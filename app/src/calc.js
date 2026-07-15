import {LOAD_MODES} from './constants.js';
import {DB} from './db.js';

export function cleanSets(rows){
  const sets=[];
  for(const s of rows){
    if(s.reps===''&&s.w===''&&(s.rpe===''||s.rpe==null))continue;
    const w=Number(s.w||0),reps=Number(s.reps),rpe=(s.rpe===''||s.rpe==null)?null:Number(s.rpe);
    if(!Number.isFinite(w)||w<0)return {error:'重量は0以上で入力してください'};
    if(!Number.isFinite(reps)||reps<=0||reps>999)return {error:'回数は1〜999で入力してください'};
    if(rpe!=null&&(!Number.isFinite(rpe)||rpe<1||rpe>10))return {error:'RPEは1〜10で入力してください'};
    const m=['plus','minus'].includes(s.m)?s.m:'bw';
    sets.push({w,reps,rpe,m});
  }
  return {sets};
}
export function est1RM(w,reps){
  w=Number(w||0);reps=Number(reps||0);
  if(w<=0||reps<=0)return 0;if(reps===1)return Math.round(w);
  const epley=w*(1+reps/30);const brz=reps<37?w*36/(37-reps):epley;
  const f=DB.rmFormula||'average';
  if(f==='epley')return Math.round(epley);
  if(f==='brzycki')return Math.round(brz);
  return Math.round((epley+brz)/2);
}
/* 日付別の体重を取得（その日以前で最も新しい記録） */
export function getBW(date){
  if(!DB.bwLog||!DB.bwLog.length)return 0;
  const sorted=[...DB.bwLog].sort((a,b)=>a.date<b.date?-1:1);
  let res=null;for(const r of sorted){if(r.date<=date)res=r.kg;}
  if(res==null)res=sorted[0].kg;return Number(res)||0;
}
/* ボリューム計算（bwは日付別体重） */
export function setVolume(equip,w,reps,uni,sides,bw){
  w=Number(w||0);reps=Number(reps||0);bw=Number(bw||0);
  const sd=uni?(sides||2):1;
  if(equip==='bodyweight')return ((bw+w)>0?(bw+w):1)*reps*sd; // wは加重が正・補助が負
  if(equip==='assist')return (bw>0?Math.max(bw-w,0):1)*reps*sd;
  const mult=uni?sd:(equip==='dumbbell'?2:1);
  return w*reps*mult;
}
export function entryVolume(e){const bw=getBW(e.date);return e.sets.reduce((s,st)=>s+setVolume(e.equip,st.w,st.reps,e.uni,e.sides,bw),0);}
export function unitLabel(eq,load){return eq==='dumbbell'?'片手kg':eq==='bodyweight'?(load==='minus'?'補助kg':'加重kg'):eq==='assist'?'補助kg':'kg';}
export function setsLabelText(eq){return eq==='bodyweight'?'セット（kg × 回数 / RPE）':`セット（${unitLabel(eq)} × 回数 / RPE）`;}
export function setDisp(e,s){
  const eq=e.equip;let base;
  if(eq==='bodyweight')base=(s.w>0?`+${s.w}kg×`:s.w<0?`補助${-s.w}kg×`:'自重×')+s.reps+'回';
  else if(eq==='dumbbell')base=`片手${s.w}kg×${s.reps}回`;
  else if(eq==='assist')base=`補助${s.w}kg×${s.reps}回`;
  else base=`${s.w}kg×${s.reps}回`;
  if(e.uni)base+=(e.sides===1?'（片側）':'（両側）');
  return base;
}
export function loadModeFromWeight(w){return Number(w)<0?'minus':Number(w)>0?'plus':'bw';}
export function loadModeLabel(m){return m==='plus'?'加重＋':m==='minus'?'補助−':'自重';}
export function nextLoadMode(m){return LOAD_MODES[(LOAD_MODES.indexOf(m)+1)%LOAD_MODES.length];}
export function lastBodyweightMode(name){
  let latest=null,latestIndex=-1;
  DB.entries.forEach((e,i)=>{if(e.exName===name&&(!latest||e.date>latest.date||(e.date===latest.date&&i>latestIndex))){latest=e;latestIndex=i;}});
  const last=latest&&latest.sets[latest.sets.length-1];
  return last?loadModeFromWeight(last.w):'bw';
}

import {DB} from './db.js';
import {fmt,today,parseD,weekKey} from './util.js';
import {est1RM,entryVolume} from './calc.js';

export function trainDays(){return[...new Set(DB.entries.map(e=>e.date))].sort();}
export function weekTrainDays(wk){return new Set(DB.entries.filter(e=>weekKey(e.date)===wk).map(e=>e.date)).size;}
/* 週目標を達成した週が何週連続で続いているか。
   今週はまだ途中でも達成済みならカウント、未達成でもストリークは切らない（先週から遡って数える）。 */
export function calcStreak(){
  const goal=DB.weekGoal||4;
  const d=parseD(weekKey(today()));let s=0;
  if(weekTrainDays(fmt(d))>=goal)s++;
  d.setDate(d.getDate()-7);
  while(weekTrainDays(fmt(d))>=goal){s++;d.setDate(d.getDate()-7);}
  return s;
}
export function dailyVolMap(){const m={};DB.entries.forEach(e=>{m[e.date]=(m[e.date]||0)+entryVolume(e);});return m;}
/* AIエクスポート用の自動観察メモ（停滞・部位過不足・RPE高止まり・頻度低下・体重トレンド） */
export function observations(ents,targets){
  const out=[];
  targets.forEach(n=>{
    const arr=ents.filter(e=>e.exName===n&&e.equip!=='bodyweight'&&e.equip!=='assist').sort((a,b)=>a.date<b.date?-1:1);
    if(arr.length>=3){
      const m=arr.map(e=>Math.max(...e.sets.map(s=>est1RM(s.w,s.reps))));
      const recent=Math.max(m[m.length-1],m[m.length-2]),earlier=Math.max(...m.slice(0,m.length-2));
      if(recent<=earlier)out.push(`【停滞】${n}：直近2回で推定1RMが更新なし（現在 ${m[m.length-1]}kg）。重量維持で回数を積むか、軽いディロード後に再挑戦を。`);
    }
  });
  const wk=weekKey(today());const bp={};const partsSeen=new Set(DB.entries.map(e=>e.part));
  DB.entries.filter(e=>weekKey(e.date)===wk).forEach(e=>{bp[e.part]=(bp[e.part]||0)+e.sets.length;});
  const bmn=DB.balanceMin||10,bmx=DB.balanceMax||20;
  partsSeen.forEach(pt=>{const n=bp[pt]||0;
    if(n<bmn)out.push(`【ボリューム不足】${pt}：今週${n}セット（目安 週${bmn}〜${bmx}）。あと約${bmn-n}セット追加を推奨。`);
    else if(n>bmx)out.push(`【ボリューム過多】${pt}：今週${n}セット。回復が追いつくか注意。`);});
  const mon=parseD(weekKey(today()));const recentRpe=[];
  for(let i=0;i<2;i++){const d=new Date(mon);d.setDate(d.getDate()-i*7);const k=fmt(d);
    DB.entries.filter(e=>weekKey(e.date)===k).forEach(e=>e.sets.forEach(s=>{if(s.rpe)recentRpe.push(s.rpe);}));}
  if(recentRpe.length>=3){const avg=recentRpe.reduce((a,b)=>a+b,0)/recentRpe.length;
    if(avg>=9)out.push(`【疲労の兆候】直近2週の平均RPEが${avg.toFixed(1)}と高め。ディロード週の検討を。`);}
  const cnt=k=>new Set(DB.entries.filter(e=>weekKey(e.date)===k).map(e=>e.date)).size;
  const tw=cnt(fmt(mon));const prev=[];for(let i=1;i<=3;i++){const d=new Date(mon);d.setDate(d.getDate()-i*7);prev.push(cnt(fmt(d)));}
  const avgPrev=prev.reduce((a,b)=>a+b,0)/3;
  if(avgPrev>0&&tw<avgPrev-0.5)out.push(`【頻度低下】今週${tw}回（平常 約${avgPrev.toFixed(1)}回/週）。ペースが落ち気味。`);
  if(DB.bwLog.length>=2){const s=[...DB.bwLog].sort((a,b)=>a.date<b.date?-1:1);
    const last=s[s.length-1],ago=fmt(new Date(Date.now()-28*864e5));let base=s[0];
    for(const r of s){if(r.date<=ago)base=r;}
    const dlt=last.kg-base.kg;
    if(Math.abs(dlt)>=0.3)out.push(`【体重】約4週で ${dlt>=0?'+':''}${dlt.toFixed(1)}kg（${base.kg}→${last.kg}kg）。`);}
  return out;
}

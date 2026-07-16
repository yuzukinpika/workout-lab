import {BODYPARTS,DAYNAMES,COLORS} from './constants.js';
import {$,esc,appIcon,fmt,today,parseD,weekKey,jpDate,toast} from './util.js';
import {DB,save} from './db.js';
import {est1RM,entryVolume} from './calc.js';
import {lineSVG} from './chart.js';
import {trainDays,calcStreak,dailyVolMap} from './stats.js';

export function updateStreak(){$('#streakNum').textContent=calcStreak();}

/* ===================== 設定 ===================== */
function renderSettings(){
  $('#wgInput').value=DB.weekGoal;
  const m=DB.balanceMetric||'sets';
  $('#bmSets').classList.toggle('on',m==='sets');$('#bmVol').classList.toggle('on',m==='volume');
  $('#balRangeWrap').classList.toggle('hide',m==='volume');
  $('#balMin').value=DB.balanceMin;$('#balMax').value=DB.balanceMax;
  $('#rmFormula').value=DB.rmFormula||'average';
}
export function setWeekGoal(v){DB.weekGoal=Math.max(1,Number(v)||4);save();renderDash();}
export function setBalanceMetric(m){DB.balanceMetric=m;save();renderDash();}
export function setBalanceRange(){DB.balanceMin=Number($('#balMin').value)||10;DB.balanceMax=Number($('#balMax').value)||20;save();renderDash();}
export function setRMFormula(v){DB.rmFormula=v;save();renderDash();}

/* ===================== 分析 ===================== */
let volMode='week';
export function setVolMode(m){volMode=m;['week','month','custom'].forEach(x=>$('#pm'+x[0].toUpperCase()+x.slice(1)).classList.toggle('on',x===m));
  $('#customRange').classList.toggle('hide',m!=='custom');
  if(m==='custom'){if(!$('#rangeTo').value)$('#rangeTo').value=today();if(!$('#rangeFrom').value){const f=new Date();f.setDate(f.getDate()-56);$('#rangeFrom').value=fmt(f);}}
  renderVolBars();}
export function renderDash(){
  const streak=calcStreak();
  $('#streakBig').innerHTML=streak+'<span style="font-size:14px"> 週</span>';
  $('#totSess').textContent=trainDays().length;$('#streakNum').textContent=streak;
  const wk=weekKey(today());
  const twd=new Set(DB.entries.filter(e=>weekKey(e.date)===wk).map(e=>e.date)).size,goal=DB.weekGoal||4;
  $('#weekDays').textContent=twd+'/'+goal;
  $('#weekRing').setAttribute('stroke-dashoffset',264*(1-Math.min(twd/goal,1)));
  $('#habitMsg').textContent=twd>=goal?'今週の目標を達成しました':`今週あと${goal-twd}回で目標達成`;
  renderSettings();renderBadges(streak);renderActCal();renderVolBars();renderBalance();
  fillExDetailSel();renderExDetail();renderRPE();renderFreq();renderBW();
}
function renderBadges(streak){
  const tot=trainDays().length,totVol=DB.entries.reduce((s,e)=>s+entryVolume(e),0);
  const defs=[{ic:'note',nm:'初記録',got:tot>=1},{ic:'flame',nm:'3週連続達成',got:streak>=3},
    {ic:'target',nm:'8週連続達成',got:streak>=8},{ic:'trophy',nm:'10回達成',got:tot>=10},
    {ic:'chart',nm:'30回達成',got:tot>=30},{ic:'dumbbell',nm:'10万vol',got:totVol>=100000}];
  $('#badges').innerHTML=defs.map(b=>`<div class="badge ${b.got?'got':''}"><div class="ic">${appIcon(b.got?b.ic:'lock')}</div><div class="nm">${b.nm}</div></div>`).join('');
}
/* 活動カレンダー（月表示・トレした日を塗る） */
let actMonth=new Date();
export function actNav(n){actMonth=new Date(actMonth.getFullYear(),actMonth.getMonth()+n,1);renderActCal();}
function renderActCal(){
  const dv=dailyVolMap();
  const y=actMonth.getFullYear(),m=actMonth.getMonth();
  const start=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let cnt=0;
  let h=`<div class="calhd"><button onclick="actNav(-1)">‹</button><span>${y}年${m+1}月</span><button onclick="actNav(1)">›</button></div>`;
  h+='<div class="calgrid">'+DAYNAMES.map(d=>`<div class="dow">${d}</div>`).join('');
  for(let i=0;i<start;i++)h+='<div class="day empty"></div>';
  for(let dd=1;dd<=days;dd++){
    const ds=fmt(new Date(y,m,dd));const v=dv[ds]||0;if(v)cnt++;
    const cls=['day'];if(v)cls.push('did');if(ds===today())cls.push('today');
    h+=`<div class="${cls.join(' ')}" title="${v?jpDate(ds)+' '+Math.round(v).toLocaleString()+'vol':''}">${dd}</div>`;
  }
  $('#actCal').innerHTML=h+'</div>';
  $('#actCalLbl').textContent=`${m+1}月は ${cnt}日 トレーニング`;
}
export function renderVolBars(){
  let buckets=[];
  if(volMode==='week'){
    const mon=parseD(weekKey(today()));
    for(let i=7;i>=0;i--){const d=new Date(mon);d.setDate(d.getDate()-i*7);const k=fmt(d);
      buckets.push({label:(d.getMonth()+1)+'/'+d.getDate(),now:i===0,test:e=>weekKey(e.date)===k});}
  }else if(volMode==='month'){
    const now=new Date();
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=fmt(d).slice(0,7);
      buckets.push({label:(d.getMonth()+1)+'月',now:i===0,test:e=>e.date.slice(0,7)===k});}
  }else{
    const from=$('#rangeFrom').value,to=$('#rangeTo').value;
    if(!from||!to){$('#volBars').innerHTML='';$('#volNote').textContent='期間を選択してください';return;}
    let s=parseD(weekKey(from)),e2=parseD(to),i=0;
    while(s<=e2&&i<60){const k=fmt(s);buckets.push({label:(s.getMonth()+1)+'/'+s.getDate(),now:false,
      test:e=>weekKey(e.date)===k&&e.date>=from&&e.date<=to});s=new Date(s);s.setDate(s.getDate()+7);i++;}
  }
  const vols=buckets.map(b=>DB.entries.filter(b.test).reduce((s,e)=>s+entryVolume(e),0));
  const max=Math.max(...vols,1);
  $('#volBars').innerHTML=buckets.map((b,i)=>`<div class="bar ${b.now?'today':''}"><div class="fill" style="height:${Math.round(vols[i]/max*100)}%"></div><div class="bl">${b.label}</div></div>`).join('');
  const tot=vols.reduce((a,b)=>a+b,0),last=vols[vols.length-1],prev=vols[vols.length-2];
  let note=`合計 ${Math.round(tot).toLocaleString()} vol`;
  if(last&&prev){const ch=Math.round((last-prev)/prev*100);note+=` ／ 直近 ${ch>=0?'+':''}${ch}%`;}
  $('#volNote').textContent=note;
}
function renderBalance(){
  const wk=weekKey(today());const metric=DB.balanceMetric||'sets';const data={};
  DB.entries.filter(e=>weekKey(e.date)===wk).forEach(e=>{data[e.part]=(data[e.part]||0)+(metric==='volume'?entryVolume(e):e.sets.length);});
  const total=Object.values(data).reduce((a,b)=>a+b,0);
  if(!total){$('#balance').innerHTML='<div class="empty">今週のデータがありません</div>';return;}
  const unit=metric==='volume'?'vol':'セット';
  let h='<div style="margin-bottom:10px">';
  BODYPARTS.forEach(p=>{const n=data[p]||0,pct=Math.round(n/total*100);
    const val=metric==='volume'?Math.round(n).toLocaleString():n;
    h+=`<div class="legrow"><span class="sw" style="background:${COLORS[p]||'#888'}"></span>${p} <span class="pct">${val}${unit} (${pct}%)</span></div>`;});
  h+='</div><div style="display:flex;height:14px;border-radius:7px;overflow:hidden;border:1px solid var(--line)">';
  BODYPARTS.forEach(p=>{const n=data[p]||0;if(n)h+=`<div style="width:${n/total*100}%;background:${COLORS[p]||'#888'}"></div>`;});
  h+='</div>';
  $('#balance').innerHTML=h;
}
/* 種目別詳細 */
function fillExDetailSel(){
  const byEx={};DB.entries.forEach(e=>{byEx[e.exName]=(byEx[e.exName]||0)+1;});
  const names=Object.keys(byEx).sort((a,b)=>byEx[b]-byEx[a]);
  const sel=$('#exDetailSel');const prev=sel.value;
  sel.innerHTML=names.length?names.map(n=>`<option value="${esc(n)}">${esc(n)}（${byEx[n]}回）</option>`).join(''):'<option>記録なし</option>';
  if(names.includes(prev))sel.value=prev;
}
export function renderExDetail(){
  const name=$('#exDetailSel').value;
  const arr=DB.entries.filter(e=>e.exName===name).sort((a,b)=>a.date<b.date?-1:1);
  if(arr.length<1){$('#exDetail').innerHTML='<div class="empty">記録がありません</div>';return;}
  const eq=arr[0].equip;
  const oneRMpts=arr.map(e=>({l:`${parseD(e.date).getMonth()+1}/${parseD(e.date).getDate()}`,v:Math.max(...e.sets.map(s=>est1RM(eq==='bodyweight'?0:s.w,s.reps)))}));
  const volPts=arr.map(e=>({l:`${parseD(e.date).getMonth()+1}/${parseD(e.date).getDate()}`,v:Math.round(entryVolume(e))}));
  // ベスト記録
  let best={w:0,reps:0,e1:0};
  arr.forEach(e=>e.sets.forEach(s=>{const r=est1RM(s.w,s.reps);if(r>best.e1)best={w:s.w,reps:s.reps,e1:r};}));
  let html='';
  if(eq!=='bodyweight'&&eq!=='assist'){
    html+=`<div class="chartlbl"><span>推定1RM 推移</span><span>最新 ${oneRMpts[oneRMpts.length-1].v}kg</span></div>`;
    html+=lineSVG(oneRMpts,'#db5c38',{fmt:v=>Math.round(v)+'kg'});
    html+=`<div class="muted" style="margin-top:4px">ベスト: ${best.w}kg×${best.reps}回（推定1RM ${best.e1}kg）</div>`;
  }
  html+=`<div class="chartlbl" style="margin-top:14px"><span>ボリューム 推移</span><span>最新 ${volPts[volPts.length-1].v.toLocaleString()}</span></div>`;
  html+=lineSVG(volPts,'#2d8a69');
  $('#exDetail').innerHTML=html;
}
/* RPE推移 */
function renderRPE(){
  const mon=parseD(weekKey(today()));const pts=[];
  for(let i=9;i>=0;i--){const d=new Date(mon);d.setDate(d.getDate()-i*7);const k=fmt(d);
    const rpes=[];DB.entries.filter(e=>weekKey(e.date)===k).forEach(e=>e.sets.forEach(s=>{if(s.rpe)rpes.push(s.rpe);}));
    if(rpes.length)pts.push({l:(d.getMonth()+1)+'/'+d.getDate(),v:rpes.reduce((a,b)=>a+b,0)/rpes.length});
  }
  $('#rpeChart').innerHTML=pts.length>=2?lineSVG(pts,'#d97706',{fmt:v=>v.toFixed(1)}):'<div class="empty">RPEを入力した週が2週以上で表示されます</div>';
}
/* 頻度 */
function renderFreq(){
  const mon=parseD(weekKey(today()));const weeks=[];
  for(let i=7;i>=0;i--){const d=new Date(mon);d.setDate(d.getDate()-i*7);weeks.push(fmt(d));}
  const counts=weeks.map(k=>new Set(DB.entries.filter(e=>weekKey(e.date)===k).map(e=>e.date)).size);
  const max=Math.max(...counts,1);
  $('#freqBars').innerHTML=weeks.map((k,i)=>{const d=parseD(k);
    return `<div class="bar ${i===weeks.length-1?'today':''}"><div class="fill" style="height:${Math.round(counts[i]/max*100)}%"></div><div class="bl">${d.getMonth()+1}/${d.getDate()}</div></div>`;}).join('');
  const last4=counts.slice(-4);const avg=last4.reduce((a,b)=>a+b,0)/(last4.length||1);
  $('#freqAvg').innerHTML=avg.toFixed(1)+'<span style="font-size:13px"> 回/週</span>';
  $('#freqNow').innerHTML=counts[counts.length-1]+'<span style="font-size:13px"> 回</span>';
}
/* 体重 */
export function addBW(){
  const date=$('#bwDate').value||today();const kg=Number($('#bwVal').value);
  if(!Number.isFinite(kg)||kg<=0||kg>500){toast('体重は1〜500kgで入力してください');return;}
  const ex=DB.bwLog.find(r=>r.date===date);if(ex)ex.kg=kg;else DB.bwLog.push({date,kg});
  save();$('#bwVal').value='';renderBW();renderVolBars();toast('体重を記録しました');
}
function renderBW(){
  $('#bwDate').value=$('#bwDate').value||today();
  const log=[...DB.bwLog].sort((a,b)=>a.date<b.date?-1:1);
  if(log.length<1){$('#bwChart').innerHTML='<div class="empty">体重を記録すると推移が表示されます</div>';$('#bwList').innerHTML='';return;}
  const pts=log.map(r=>({l:(parseD(r.date).getMonth()+1)+'/'+parseD(r.date).getDate(),v:r.kg}));
  $('#bwChart').innerHTML=log.length>=2?lineSVG(pts,'#148da0',{fmt:v=>v.toFixed(1)+'kg'}):`<div class="muted">記録: ${log[0].kg}kg（${jpDate(log[0].date)}）</div>`;
  const recent=log.slice(-4).reverse();
  $('#bwList').innerHTML=recent.map(r=>`<div class="legrow"><span class="sub" style="width:90px">${jpDate(r.date)}</span> <b>${esc(r.kg)}kg</b> <span class="del" style="margin-left:auto;width:auto" data-d="${esc(r.date)}" onclick="rmBW(this.dataset.d)">削除</span></div>`).join('');
}
export function rmBW(date){DB.bwLog=DB.bwLog.filter(r=>r.date!==date);save();renderBW();renderVolBars();toast('削除しました');}

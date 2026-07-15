import {BODYPARTS,EQUIPS,BUILTIN,DAYNAMES,LOAD_MODES} from './constants.js';
import {$,esc,appIcon,fmt,today,parseD,jpDate,toast} from './util.js';
import {DB,save,exMap,exNameExists} from './db.js';
import {cleanSets,entryVolume,unitLabel,setsLabelText,setDisp,loadModeLabel,nextLoadMode,lastBodyweightMode} from './calc.js';
import {updateStreak} from './analysis.js';

/* ===================== 日付 ===================== */
export let recDate=today();
let calMonth=new Date();
export function refreshDateUI(){
  const d=parseD(recDate);
  $('#curDate').innerHTML=`${appIcon('calendar')} ${d.getFullYear()}年 ${jpDate(recDate)}`;
  $('#todayLabel').textContent=jpDate(recDate);
  renderTodayLog();
}
export function toggleCal(){const c=$('#cal');c.classList.toggle('hide');if(!c.classList.contains('hide')){calMonth=parseD(recDate);renderCal();}}
export function renderCal(){
  const y=calMonth.getFullYear(),m=calMonth.getMonth();
  const start=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const recd=new Set(DB.entries.map(e=>e.date));
  let h=`<div class="calhd"><button onclick="calNav(-1)">‹</button><span>${y}年${m+1}月</span><button onclick="calNav(1)">›</button></div>`;
  h+='<div class="calgrid">'+DAYNAMES.map(d=>`<div class="dow">${d}</div>`).join('');
  for(let i=0;i<start;i++)h+='<div class="day empty"></div>';
  for(let dd=1;dd<=days;dd++){
    const ds=fmt(new Date(y,m,dd));const cls=['day'];
    if(ds===recDate)cls.push('sel');if(ds===today())cls.push('today');
    h+=`<div class="${cls.join(' ')}" onclick="pickCal('${ds}')">${dd}${recd.has(ds)?'<span class="mk"></span>':''}</div>`;
  }
  $('#cal').innerHTML=h+'</div>';
}
export function calNav(n){calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()+n,1);renderCal();}
export function pickCal(ds){recDate=ds;refreshDateUI();$('#cal').classList.add('hide');}

/* ===================== ピッカー ===================== */
let selEx=null,pickCat='all',showArchive=false,curSide=2;
export function openPicker(){$('#pickerScrim').classList.remove('hide');$('#exSearch').value='';pickCat='all';showArchive=false;$('#customForm').classList.add('hide');renderCats();renderPicker();}
export function closePicker(){$('#pickerScrim').classList.add('hide');}
function renderCats(){$('#pickCats').innerHTML=['all',...BODYPARTS].map(c=>`<span class="chip ${c===pickCat?'on':''}" onclick="setCat('${c}')">${c==='all'?'すべて':c}</span>`).join('');}
export function setCat(c){pickCat=c;renderCats();renderPicker();}
export function toggleArchiveView(){showArchive=!showArchive;$('#archBtn').classList.toggle('on',showArchive);$('#pickTitle').firstChild.textContent=showArchive?'アーカイブ ':'種目を選ぶ ';renderCats();renderPicker();}
/* 種目名をonclickのJS文字列に埋め込むとXSSになるため、配列インデックスで参照する */
let __pickItems=[];
export function pickAct(i,act){
  const x=__pickItems[i];if(!x)return;
  if(act==='choose')chooseEx(x.name);
  else if(act==='fav')toggleFav(x.name);
  else if(act==='arch')setArchive(x.name,true);
  else if(act==='restore')setArchive(x.name,false);
}
export function renderPicker(){
  const q=$('#exSearch').value.trim();const all=[...BUILTIN,...DB.customEx];const arch=new Set(DB.archived);
  const match=x=>(pickCat==='all'||x.part===pickCat)&&(!q||x.name.includes(q));
  __pickItems=[];
  const exrow=x=>{
    const i=__pickItems.push(x)-1;
    const fav=DB.favs.includes(x.name),isArch=arch.has(x.name);
    return `<div class="exrow"><div style="flex:1" onclick="pickAct(${i},'choose')"><div class="nm">${esc(x.name)}</div>
        <div class="meta">${esc(x.part)}・${esc(EQUIPS[x.equip]||'')}${x.uni?'・片側ずつ':''}${x.custom?'・自作':''}</div></div>
      ${isArch?`<span class="ico" onclick="pickAct(${i},'restore')" title="復元">${appIcon('history')}</span>`
        :`<span class="ico ${fav?'on':''}" onclick="pickAct(${i},'fav')">${fav?'★':'☆'}</span>
          <span class="ico" onclick="pickAct(${i},'arch')" title="アーカイブ">${appIcon('archive')}</span>`}</div>`;
  };
  if(showArchive){const list=all.filter(x=>arch.has(x.name)&&match(x));
    $('#pickList').innerHTML='<div class="seclbl">アーカイブ済み</div>'+(list.length?list.map(exrow).join(''):'<div class="empty">アーカイブはありません</div>');return;}
  let html='';
  if(!q){
    const fav=all.filter(x=>DB.favs.includes(x.name)&&!arch.has(x.name)&&match(x));
    if(fav.length)html+='<div class="seclbl">★ お気に入り</div>'+fav.map(exrow).join('');
    const recent=[...new Set(DB.entries.slice().reverse().map(e=>e.exName))].slice(0,6)
      .map(n=>all.find(x=>x.name===n)).filter(x=>x&&!arch.has(x.name)&&!DB.favs.includes(x.name)&&match(x));
    if(recent.length)html+='<div class="seclbl">最近使った</div>'+recent.map(exrow).join('');
  }
  const rest=all.filter(x=>!arch.has(x.name)&&match(x));
  html+='<div class="seclbl">'+(q?'検索結果':'すべて')+'</div>'+(rest.length?rest.map(exrow).join(''):'<div class="empty">該当なし</div>');
  $('#pickList').innerHTML=html;
}
function toggleFav(n){const i=DB.favs.indexOf(n);if(i<0)DB.favs.push(n);else DB.favs.splice(i,1);save();renderPicker();}
function setArchive(n,on){const i=DB.archived.indexOf(n);if(on&&i<0)DB.archived.push(n);if(!on&&i>=0)DB.archived.splice(i,1);save();renderPicker();toast(on?'アーカイブしました':'復元しました');}
function chooseEx(n){selEx=exMap()[n];curSide=2;closePicker();renderSelEx();}
export function renderSelEx(){
  if(!selEx){$('#selExName').textContent='種目を選ぶ';$('#selExMeta').textContent='タップしてライブラリから選択';$('#setsArea').classList.add('hide');return;}
  $('#selExName').textContent=selEx.name;
  $('#selExMeta').innerHTML=`<span class="eqtag">${esc(selEx.part)}</span> <span class="eqtag">${esc(EQUIPS[selEx.equip]||'')}</span>${selEx.uni?' <span class="eqtag">片側ずつ</span>':''}`;
  $('#setsArea').classList.remove('hide');
  $('#sideSel').classList.toggle('hide',!selEx.uni);
  if(selEx.uni)setSide(2);
  $('#setsLabel').textContent=setsLabelText(selEx.equip);
  showLastHint();
  const initialMode=selEx.equip==='bodyweight'?lastBodyweightMode(selEx.name):'bw';
  if(!setsState.length)setsState=[{w:'',reps:'',rpe:'',m:initialMode}];
  else{
    const blankInitial=setsState.length===1&&setsState[0].w===''&&setsState[0].reps===''&&(setsState[0].rpe===''||setsState[0].rpe==null);
    setsState.forEach(s=>{if(blankInitial||!['bw','plus','minus'].includes(s.m))s.m=initialMode;});
  }
  renderSets();
}
export function setSide(n){curSide=n;$('#sideBoth').classList.toggle('on',n===2);$('#sideOne').classList.toggle('on',n===1);}
export function toggleCustom(){$('#customForm').classList.toggle('hide');
  $('#cPart').innerHTML=BODYPARTS.map(b=>`<option>${b}</option>`).join('');
  $('#cEquip').innerHTML=Object.entries(EQUIPS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');}
export function addCustom(){
  const name=$('#cName').value.trim();if(!name){toast('名前を入力');return;}
  if(exNameExists(name)){toast('同じ名前の種目があります');return;}
  DB.customEx.push({name,part:$('#cPart').value,equip:$('#cEquip').value,uni:$('#cUni').checked,custom:true});
  save();$('#cName').value='';$('#cUni').checked=false;chooseEx(name);
}

/* ===================== セット入力 ===================== */
let setsState=[];
export function renderSets(){
  const eq=selEx?selEx.equip:'barbell';
  $('#sets').innerHTML=setsState.map((s,i)=>`
    <div class="setrow"><span class="n">${i+1}</span>
      ${eq==='bodyweight'?`<button class="set-mode" data-index="${i}" onclick="cycleSetMode(this.dataset.index)">${loadModeLabel(s.m)}</button>`:''}
      ${eq==='bodyweight'&&s.m==='bw'?'':`<div class="field"><small>${unitLabel(eq,s.m)}</small><input type="number" inputmode="decimal" placeholder="kg" value="${esc(s.w)}" onchange="setVal(${i},'w',this.value)"></div>`}
      <div class="field"><small>回数</small><input type="number" inputmode="numeric" placeholder="回" value="${esc(s.reps)}" onchange="setVal(${i},'reps',this.value)"></div>
      <div class="field"><small>RPE</small><input type="number" inputmode="decimal" placeholder="任意" value="${esc(s.rpe)}" onchange="setVal(${i},'rpe',this.value)"></div>
      <button class="del" onclick="rmSet(${i})">×</button></div>`).join('');
}
export function setVal(i,k,v){setsState[i][k]=v;}
export function cycleSetMode(i){const s=setsState[Number(i)];if(!s)return;s.m=nextLoadMode(s.m);renderSets();}
export function addSet(){const l=setsState[setsState.length-1]||{};setsState.push({w:l.w||'',reps:l.reps||'',rpe:'',m:LOAD_MODES.includes(l.m)?l.m:'bw'});renderSets();}
export function rmSet(i){setsState.splice(i,1);if(!setsState.length)setsState=[{w:'',reps:'',rpe:'',m:selEx&&selEx.equip==='bodyweight'?lastBodyweightMode(selEx.name):'bw'}];renderSets();}
function showLastHint(){
  if(!selEx){$('#lastHint').textContent='';return;}
  const past=DB.entries.filter(e=>e.exName===selEx.name).sort((a,b)=>a.date<b.date?1:-1);
  if(!past.length){$('#lastHint').innerHTML='<span class="muted">前回の記録なし — 新しい種目です</span>';return;}
  const p=past[0];$('#lastHint').innerHTML=`<span class="sub">前回 ${jpDate(p.date)}: </span>`+esc(p.sets.map(s=>setDisp(p,s)).join(' / '));
}
export function saveEntry(){
  if(!selEx){toast('種目を選んでください');return;}
  const res=cleanSets(setsState);if(res.error){toast(res.error);return;}
  const sets=res.sets;
  if(!sets.length){toast('セットを入力してください');return;}
  // 自重種目: 各セットの負荷タイプに応じて符号を付与（加重=正/補助=負/自重のみ=0）
  if(selEx.equip==='bodyweight')sets.forEach(s=>{s.w=s.m==='minus'?-Math.abs(s.w):s.m==='plus'?Math.abs(s.w):0;});
  sets.forEach(s=>{delete s.m;}); // mはUI状態のみ。DBには従来どおり符号付きwだけを保存する
  DB.entries.push({id:Date.now()+''+Math.random().toString(36).slice(2,5),date:recDate,
    exName:selEx.name,part:selEx.part,equip:selEx.equip,uni:selEx.uni,sides:selEx.uni?curSide:1,sets});
  save();setsState=[];selEx=null;renderSelEx();renderTodayLog();updateStreak();toast('✓ 保存しました');
}
export function renderTodayLog(){const list=DB.entries.filter(e=>e.date===recDate);
  $('#todayLog').innerHTML=list.length?list.map(logCard).join(''):'<div class="empty">まだ記録がありません</div>';}
export function logCard(e){
  const sets=e.sets.map(s=>setDisp(e,s)+(s.rpe?` @${s.rpe}`:'')).join('  /  ');
  return `<div class="logrec" data-id="${esc(e.id)}" onclick="openEdit(this.dataset.id)">
    <div style="display:flex;align-items:center"><span class="ex">${esc(e.exName)}</span>
    <span class="dt" style="margin-left:auto">${esc(e.part)}・${Math.round(entryVolume(e)).toLocaleString()}vol ▸</span></div>
    <div class="sub" style="font-size:13px">${esc(sets)}</div></div>`;
}

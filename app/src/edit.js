import {$,esc,toast} from './util.js';
import {DB,save} from './db.js';
import {cleanSets,unitLabel,setsLabelText,loadModeFromWeight,loadModeLabel,nextLoadMode} from './calc.js';
import {LOAD_MODES} from './constants.js';
import {renderTodayLog} from './record.js';
import {renderHist} from './history.js';
import {updateStreak} from './analysis.js';

let editId=null,editSetsState=[],editSide=2;
export function openEdit(id){
  const e=DB.entries.find(x=>x.id===id);if(!e)return;
  // 自重種目は符号付きで保存されているため、編集欄には絶対値を出し各行のmで符号を持つ
  editId=id;editSetsState=e.sets.map(s=>({w:e.equip==='bodyweight'?(Math.abs(s.w)||''):s.w,reps:s.reps,rpe:s.rpe||'',m:e.equip==='bodyweight'?loadModeFromWeight(s.w):'bw'}));editSide=e.sides||2;
  $('#editTitle').firstChild.textContent=e.exName+' を編集 ';$('#editDate').value=e.date;
  $('#editScrim').dataset.equip=e.equip;
  $('#editSideSel').classList.toggle('hide',!e.uni);if(e.uni)setEditSide(editSide);
  $('#editSetsLabel').textContent=setsLabelText(e.equip);
  renderEditSets();$('#editScrim').classList.remove('hide');
}
export function setEditSide(n){editSide=n;$('#eSideBoth').classList.toggle('on',n===2);$('#eSideOne').classList.toggle('on',n===1);}
export function closeEdit(){$('#editScrim').classList.add('hide');editId=null;}
function renderEditSets(){
  const eq=$('#editScrim').dataset.equip;
  $('#editSets').innerHTML=editSetsState.map((s,i)=>`
    <div class="setrow"><span class="n">${i+1}</span>
      ${eq==='bodyweight'?`<button class="set-mode" data-index="${i}" onclick="cycleEditSetMode(this.dataset.index)">${loadModeLabel(s.m)}</button>`:''}
      ${eq==='bodyweight'&&s.m==='bw'?'':`<div class="field"><small>${unitLabel(eq,s.m)}</small><input type="number" inputmode="decimal" value="${esc(s.w)}" onchange="editVal(${i},'w',this.value)"></div>`}
      <div class="field"><small>回数</small><input type="number" value="${esc(s.reps)}" onchange="editVal(${i},'reps',this.value)"></div>
      <div class="field"><small>RPE</small><input type="number" value="${esc(s.rpe)}" onchange="editVal(${i},'rpe',this.value)"></div>
      <button class="del" onclick="editRm(${i})">×</button></div>`).join('');
}
export function editVal(i,k,v){editSetsState[i][k]=v;}
export function cycleEditSetMode(i){const s=editSetsState[Number(i)];if(!s)return;s.m=nextLoadMode(s.m);renderEditSets();}
export function editAddSet(){const l=editSetsState[editSetsState.length-1]||{};editSetsState.push({w:l.w||'',reps:l.reps||'',rpe:'',m:LOAD_MODES.includes(l.m)?l.m:'bw'});renderEditSets();}
export function editRm(i){editSetsState.splice(i,1);renderEditSets();}
export function editSave(){
  const e=DB.entries.find(x=>x.id===editId);if(!e)return;
  const res=cleanSets(editSetsState);if(res.error){toast(res.error);return;}
  const sets=res.sets;
  if(!sets.length){toast('セットがありません');return;}
  if(e.equip==='bodyweight')sets.forEach(s=>{s.w=s.m==='minus'?-Math.abs(s.w):s.m==='plus'?Math.abs(s.w):0;});
  sets.forEach(s=>{delete s.m;});
  e.sets=sets;e.date=$('#editDate').value||e.date;if(e.uni)e.sides=editSide;
  save();closeEdit();renderTodayLog();renderHist();updateStreak();toast('✓ 更新しました');
}
export function editDelete(){if(!confirm('この記録を削除しますか？'))return;
  DB.entries=DB.entries.filter(x=>x.id!==editId);save();closeEdit();renderTodayLog();renderHist();updateStreak();toast('削除しました');}

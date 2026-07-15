import {$,jpDate} from './util.js';
import {DB} from './db.js';
import {entryVolume} from './calc.js';
import {logCard} from './record.js';

export function renderHist(){
  if(!DB.entries.length){$('#histList').innerHTML='<div class="empty">記録がありません</div>';return;}
  const byDate={};DB.entries.forEach(e=>{(byDate[e.date]=byDate[e.date]||[]).push(e);});
  $('#histList').innerHTML=Object.keys(byDate).sort((a,b)=>a<b?1:-1).map(d=>{
    const vol=byDate[d].reduce((s,e)=>s+entryVolume(e),0);
    return `<div class="seclbl" style="font-size:13px;color:var(--acc);margin-top:14px">${jpDate(d)} <span style="color:var(--mut);font-weight:500">・${Math.round(vol).toLocaleString()}vol</span></div>`+byDate[d].map(logCard).join('');
  }).join('');
}

import {$} from './util.js';
import {renderHist} from './history.js';
import {renderDash} from './analysis.js';

export function go(pg){
  ['log','hist','dash'].forEach(p=>$('#page-'+p).classList.toggle('hide',p!==pg));
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.pg===pg));
  if(pg==='hist')renderHist();
  if(pg==='dash')renderDash();
  window.scrollTo(0,0);
}

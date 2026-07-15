import {DAYNAMES,ICON_NAMES} from './constants.js';

export const $=s=>document.querySelector(s);
/* XSS対策: innerHTMLに入れるユーザー由来の文字列は必ずこれを通す */
export const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function appIcon(name,klass='ui-icon'){
  const safe=ICON_NAMES.has(name)?name:'note';
  return `<svg class="${klass}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${safe}"/></svg>`;
}
export const fmt=d=>{const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());};
export const today=()=>fmt(new Date());
export function parseD(s){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
export function weekKey(s){const d=parseD(s);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return fmt(d);}
export function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1800);}
export function jpDate(s){const d=parseD(s);return `${d.getMonth()+1}/${d.getDate()}(${DAYNAMES[d.getDay()]})`;}

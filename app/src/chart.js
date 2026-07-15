/* 自前のSVG折れ線グラフ（ライブラリ不使用） */
let __gid=0;
export function lineSVG(data,color,opts){
  opts=opts||{};
  if(!data||data.length<2)return '<div class="empty">データが2点以上必要です</div>';
  const W=320,H=opts.h||110,p=12,pb=18;
  const vals=data.map(d=>d.v);let mn=Math.min(...vals),mx=Math.max(...vals);
  if(mn===mx){mn-=1;mx+=1;}
  const rng=mx-mn;
  const X=i=>p+i*(W-2*p)/(data.length-1);
  const Y=v=>H-pb-(v-mn)/rng*(H-p-pb);
  let line='',area='M'+X(0).toFixed(1)+' '+(H-pb)+' ';
  data.forEach((d,i)=>{const xx=X(i).toFixed(1),yy=Y(d.v).toFixed(1);line+=(i?'L':'M')+xx+' '+yy+' ';area+='L'+xx+' '+yy+' ';});
  area+='L'+X(data.length-1).toFixed(1)+' '+(H-pb)+' Z';
  const dots=data.map((d,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(d.v).toFixed(1)}" r="2.3" fill="${color}"/>`).join('');
  const f=opts.fmt||(v=>Math.round(v).toLocaleString());
  const idxs=[...new Set([0,Math.floor((data.length-1)/2),data.length-1])];
  const labels=idxs.map(i=>`<text x="${X(i).toFixed(1)}" y="${H-4}" fill="#756e66" font-size="9" text-anchor="${i===0?'start':i===data.length-1?'end':'middle'}">${data[i].l}</text>`).join('');
  const gid='ag'+(++__gid);
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    ${dots}${labels}
    <text x="${p}" y="11" fill="#756e66" font-size="9">${f(mx)}</text>
    <text x="${p}" y="${H-pb-2}" fill="#756e66" font-size="9">${f(mn)}</text>
  </svg>`;
}

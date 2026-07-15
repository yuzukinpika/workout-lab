import {EQUIPS} from './constants.js';
import {$,esc,fmt,today,weekKey,parseD,toast} from './util.js';
import {DB,save} from './db.js';
import {est1RM,entryVolume,setDisp} from './calc.js';
import {trainDays,calcStreak,observations} from './stats.js';

/* ===================== AIエクスポート（設定式） ===================== */
let exNames=[],exSel={};
function loadProfile(){const p=DB.profile||{};
  const goals=p.goals||(p.goal?[p.goal]:['筋肥大']);
  document.querySelectorAll('.goalchk').forEach(c=>c.checked=goals.includes(c.value));
  $('#pWeak').value=p.weak||'';$('#pInjury').value=p.injury||'';$('#pDays').value=p.days||'';}
function readGoals(){return [...document.querySelectorAll('.goalchk')].filter(c=>c.checked).map(c=>c.value);}
function saveProfile(){DB.profile={goals:readGoals(),weak:$('#pWeak').value.trim(),injury:$('#pInjury').value.trim(),days:$('#pDays').value};save();}
export function openExportSheet(){if(!DB.entries.length){toast('記録がありません');return;}loadProfile();exSel={};$('#pCustomRange').classList.add('hide');renderExportExList();$('#exportScrim').classList.remove('hide');}
export function closeExport(){$('#exportScrim').classList.add('hide');}
export function exExAll(on){exNames.forEach(n=>exSel[n]=on);renderExportExList();}
/* 種目名をonchangeのJS文字列に埋め込むとXSSになるため、配列インデックスで参照する */
export function exToggle(i,checked){const n=exNames[i];if(n!==undefined)exSel[n]=checked;}
function exPeriodRange(){
  const v=$('#pPeriod').value;
  $('#pCustomRange').classList.toggle('hide',v!=='custom');
  if(v==='custom'){
    if(!$('#pTo').value)$('#pTo').value=today();
    if(!$('#pFrom').value){const f=new Date();f.setDate(f.getDate()-56);$('#pFrom').value=fmt(f);}
    return {from:$('#pFrom').value||null,to:$('#pTo').value||today()};
  }
  const days=Number(v||0);
  return {from:days?fmt(new Date(Date.now()-days*864e5)):null,to:today()};
}
function inRangeFn(r){return e=>(!r.from||e.date>=r.from)&&(!r.to||e.date<=r.to);}
export function renderExportExList(){
  const r=exPeriodRange();const inR=inRangeFn(r);const counts={};
  DB.entries.filter(inR).forEach(e=>{counts[e.exName]=(counts[e.exName]||0)+1;});
  exNames=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
  exNames.forEach(n=>{if(exSel[n]===undefined)exSel[n]=true;});
  $('#pExList').innerHTML=exNames.length?exNames.map((n,i)=>`<label class="check"><input type="checkbox" ${exSel[n]?'checked':''} onchange="exToggle(${i},this.checked)"> ${esc(n)}（${counts[n]}回）</label>`).join(''):'<div class="empty">この期間に記録がありません</div>';
}
export function buildExport(){
  saveProfile();const p=DB.profile;
  const r=exPeriodRange();const inR=inRangeFn(r);const ents=DB.entries.filter(inR);
  if(!ents.length){toast('対象期間にデータがありません');return;}
  const targets=exNames.filter(n=>exSel[n]);
  const periodLabel=r.from?`${r.from} 〜 ${r.to}`:`全期間（〜${r.to}）`;
  const notes=observations(ents,targets);
  const wkVol={};ents.forEach(e=>{const k=weekKey(e.date);wkVol[k]=(wkVol[k]||0)+entryVolume(e);});
  const wkVolArr=Object.keys(wkVol).sort().slice(-12).map(k=>`- ${k}: ${Math.round(wkVol[k]).toLocaleString()}vol`);
  const wkRpe={};ents.forEach(e=>{const k=weekKey(e.date);e.sets.forEach(s=>{if(s.rpe){(wkRpe[k]=wkRpe[k]||[]).push(s.rpe);}});});
  const wkRpeArr=Object.keys(wkRpe).sort().slice(-12).map(k=>{const a=wkRpe[k];return `- ${k}: 平均RPE ${(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)}`;});
  const wkDays={};ents.forEach(e=>{const k=weekKey(e.date);(wkDays[k]=wkDays[k]||new Set()).add(e.date);});
  const wkDaysArr=Object.keys(wkDays).sort().slice(-12).map(k=>`- ${k}: ${wkDays[k].size}回`);
  const bwArr=[...DB.bwLog].sort((a,b)=>a.date<b.date?-1:1).filter(inR).slice(-12).map(x=>`- ${x.date}: ${x.kg}kg`);
  let exBlocks='';
  targets.forEach(n=>{
    const arr=ents.filter(e=>e.exName===n).sort((a,b)=>a.date<b.date?-1:1);if(!arr.length)return;
    const eq=arr[0].equip;
    exBlocks+=`\n### ${n}（${arr[0].part}/${EQUIPS[eq]}${arr[0].uni?'・片側ずつ':''}）\n`;
    arr.slice(-10).forEach(e=>{
      const oneRM=(eq!=='bodyweight'&&eq!=='assist')?` 推定1RM ${Math.max(...e.sets.map(s=>est1RM(s.w,s.reps)))}kg /`:'';
      exBlocks+=`- ${e.date}:${oneRM} ${Math.round(entryVolume(e)).toLocaleString()}vol ｜ `+e.sets.map(s=>setDisp(e,s)+(s.rpe?`@RPE${s.rpe}`:'')).join(', ')+`\n`;
    });
  });
  const bwSorted=[...DB.bwLog].sort((a,b)=>a.date<b.date?-1:1);
  const lastBW=bwSorted.length?bwSorted[bwSorted.length-1]:null;
  const bwStale=lastBW?Math.round((Date.now()-parseD(lastBW.date).getTime())/864e5):null;
  const bwLine=lastBW?`${lastBW.kg}kg（最終記録: ${lastBW.date}${bwStale>=14?` / ${bwStale}日前のため最新でない可能性あり`:''}）`:'未登録';
  const md=`# 筋トレ記録 — AIコーチング依頼

あなたは筋トレの専門コーチです。まずは以下のデータと私の状況を読み解き、
現状の評価（良い点・課題・気づいた傾向）を分かりやすく教えてください。
そのうえで、メニューや今後の方針は一気に決めず、私と対話しながら一緒に詰めていきたいです。
最後に「ここをもう少し聞きたい」という確認質問を2〜3個添えてくれると助かります。
（筋トレ科学＝漸進性過負荷・週間10〜20セット/部位・適切な頻度・十分な回復、を前提に）

## 私の状況
- 目標: ${(p.goals&&p.goals.length)?p.goals.join('、'):'未設定'}
- 弱点・伸ばしたい部位: ${p.weak||'特になし'}
- ケガ・制限: ${p.injury||'特になし'}
- 週のトレ可能日数: ${p.days||'未記入'}
- 体重: ${bwLine}

## 基本情報
- 出力期間: ${periodLabel}
- 総セッション(全期間): ${trainDays().length} ／ 週目標の連続達成: ${calcStreak()}週 ／ 週目標: ${DB.weekGoal}回
- ボリューム定義: バーベル/マシン=重量×回数、ダンベル=片手重量×2×回数、片側種目は両側で×2、自重=体重×回数

## アプリの自動観察メモ
${notes.length?notes.map(s=>'- '+s).join('\n'):'- 特筆すべき検出事項はありません。'}

## 週間ボリューム推移
${wkVolArr.join('\n')||'- データなし'}

## トレーニング頻度（週あたり日数）
${wkDaysArr.join('\n')||'- データなし'}

## 平均RPE推移（疲労の目安）
${wkRpeArr.join('\n')||'- RPE入力なし'}

## 体重推移
${bwArr.join('\n')||'- 記録なし'}

## 種目別の推移（対象: ${targets.length}種目）
${exBlocks||'（対象種目が選択されていません）'}

まずは上記の分析と気づきを聞かせてください。そこから先は、あなたの質問に答えながら、次のメニューや調整方針を対話で一緒に決めていきましょう。`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));
  a.download='筋トレコーチング依頼-'+today()+'.md';a.click();closeExport();toast('ファイルを作成しました');
}

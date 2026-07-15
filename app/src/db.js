import {KEY,BODYPARTS,EQUIPS,BUILTIN} from './constants.js';
import {today} from './util.js';

export function load(){
  try{const d=JSON.parse(localStorage.getItem(KEY));if(d)return migrate(d);}catch(e){}
  try{const o=JSON.parse(localStorage.getItem('workoutLab_v4'));if(o)return migrate(o);}catch(e){}
  try{const o=JSON.parse(localStorage.getItem('workoutLab_v3'));if(o)return migrate(o);}catch(e){}
  try{const o=JSON.parse(localStorage.getItem('workoutLab_v2'));if(o)return migrate(o);}catch(e){}
  return {entries:[],customEx:[],favs:[],archived:[],weekGoal:4,bwLog:[],profile:{},balanceMetric:'sets',balanceMin:10,balanceMax:20,rmFormula:'average'};
}
/* 読み込むデータは信頼しない（改ざんされたバックアップJSON対策）。
   型を強制し、equip/part等は既知の値にホワイトリストで丸める。 */
export function migrate(d){
  const str=v=>v==null?'':String(v);
  const num=v=>{const n=Number(v);return isFinite(n)?n:0;};
  const dateOk=s=>/^\d{4}-\d{2}-\d{2}$/.test(s);
  const arr=v=>Array.isArray(v)?v:[];
  d=d&&typeof d==='object'?d:{};
  const out={};
  out.entries=arr(d.entries).filter(e=>e&&dateOk(str(e.date))).map(e=>({
    id:str(e.id)||Date.now()+''+Math.random().toString(36).slice(2,5),
    date:str(e.date),exName:str(e.exName),
    part:BODYPARTS.includes(e.part)?e.part:'体幹',
    equip:EQUIPS[e.equip]?e.equip:'other',
    uni:!!e.uni,sides:e.sides===1?1:(e.uni?2:1),
    sets:arr(e.sets).map(s=>s||{}).map(s=>({w:num(s.w),reps:num(s.reps),rpe:(s.rpe==null||s.rpe==='')?null:num(s.rpe)}))
  }));
  out.customEx=arr(d.customEx).filter(x=>x&&x.name).map(x=>({
    name:str(x.name),part:BODYPARTS.includes(x.part)?x.part:'体幹',
    equip:EQUIPS[x.equip]?x.equip:'other',uni:!!x.uni,custom:true}));
  out.favs=arr(d.favs).map(str);
  out.archived=arr(d.archived).map(str);
  // v4→v5: 組み込みの「アシスト懸垂」を「懸垂」に統合（補助重量は負のwとして保持）。
  // 同名の自作種目がある場合は誤変換を避けるためスキップ。
  if(!out.customEx.some(x=>x.name==='アシスト懸垂')){
    out.entries.forEach(e=>{
      if(e.exName==='アシスト懸垂'&&e.equip==='assist'){
        e.exName='懸垂';e.equip='bodyweight';
        e.sets.forEach(s=>{if(s.w>0)s.w=-s.w;});
      }
    });
    out.favs=[...new Set(out.favs.map(n=>n==='アシスト懸垂'?'懸垂':n))];
    out.archived=out.archived.filter(n=>n!=='アシスト懸垂');
  }
  out.weekGoal=Math.max(1,num(d.weekGoal))||4;
  out.bwLog=arr(d.bwLog).filter(r=>r&&dateOk(str(r.date))&&num(r.kg)>0).map(r=>({date:str(r.date),kg:num(r.kg)}));
  const p=(d.profile&&typeof d.profile==='object')?d.profile:{};
  out.profile={goals:arr(p.goals||(p.goal?[p.goal]:[])).map(str),weak:str(p.weak),injury:str(p.injury),days:str(p.days)};
  out.balanceMetric=d.balanceMetric==='volume'?'volume':'sets';
  out.balanceMin=num(d.balanceMin)||10;out.balanceMax=num(d.balanceMax)||20;
  out.rmFormula=['epley','brzycki','average'].includes(d.rmFormula)?d.rmFormula:'average';
  // 旧: 単一bodyweight → bwLogへ
  if(d.bodyweight&&!out.bwLog.length&&num(d.bodyweight)>0){out.bwLog=[{date:today(),kg:num(d.bodyweight)}];}
  return out;
}
export let DB=load();
/* importData/wipe/loadDemo などDB全体を差し替える際に使う（ESMのimportは再代入できないため） */
export function setDB(d){DB=d;}
export function save(){localStorage.setItem(KEY,JSON.stringify(DB));}
export function exMap(){const m={};[...BUILTIN,...DB.customEx].forEach(x=>m[x.name]=x);return m;}
export function hasUserData(){return !!(DB.entries.length||DB.bwLog.length||DB.customEx.length||DB.favs.length||DB.archived.length);}
export function exNameExists(name){return [...BUILTIN,...DB.customEx].some(x=>x.name===name);}

import {fmt,today,toast} from './util.js';
import {DB,setDB,migrate,save,hasUserData} from './db.js';
import {refreshDateUI,renderSelEx,renderSets} from './record.js';
import {renderHist} from './history.js';
import {renderDash,updateStreak} from './analysis.js';
import {go} from './nav.js';

export function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}));a.download='workout-backup-'+today()+'.json';a.click();}
export function importData(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{setDB(migrate(JSON.parse(r.result)));save();toast('読み込みました');refreshDateUI();renderSelEx();renderSets();renderHist();renderDash();updateStreak();}catch(e){toast('読み込み失敗');}};r.readAsText(f);ev.target.value='';}
export function wipe(){if(confirm('全データを削除しますか？この操作は元に戻せません。')){setDB({entries:[],customEx:[],favs:[],archived:[],weekGoal:4,bwLog:[],profile:{},balanceMetric:'sets',balanceMin:10,balanceMax:20,rmFormula:'average'});save();refreshDateUI();renderSelEx();renderSets();renderHist();renderDash();updateStreak();toast('削除しました');}}
export function loadDemo(){
  if(hasUserData()&&!confirm('現在の記録をデモデータで上書きします。先にバックアップすることをおすすめします。続行しますか？'))return;
  const db={entries:[],customEx:[],favs:['ベンチプレス','スクワット'],archived:[],weekGoal:3,bwLog:[],
    profile:{goals:['筋肥大','筋力向上'],weak:'肩の前部',injury:'特になし',days:'4'},
    balanceMetric:'sets',balanceMin:10,balanceMax:20,rmFormula:'average'};
  const lib={'ベンチプレス':['胸','barbell',50,0],'ダンベルカール':['腕','dumbbell',14,0],
    'スクワット':['脚','barbell',60,0],'ダンベルショルダープレス':['肩','dumbbell',16,0],
    'ラットプルダウン':['背中','cable',45,0],'ワンハンドダンベルロウ':['背中','dumbbell',22,1]};
  const names=Object.keys(lib),now=new Date();
  for(let wk=5;wk>=0;wk--){
    // 体重ログ（週次・微増）
    const bd=new Date(now);bd.setDate(bd.getDate()-wk*7);db.bwLog.push({date:fmt(bd),kg:64+(5-wk)*0.4});
    [1,3,5].forEach((off,di)=>{
      const d=new Date(now);d.setDate(d.getDate()-wk*7-(6-off));
      for(let k=0;k<2;k++){
        const name=names[(di*2+k+wk)%names.length];const[part,equip,base,uni]=lib[name];
        const w=base+(5-wk)*2.5;
        db.entries.push({id:Math.random().toString(36).slice(2),date:fmt(d),exName:name,part,equip,uni:!!uni,sides:uni?2:1,
          sets:[1,2,3].map(()=>({w,reps:8+Math.floor(Math.random()*3),rpe:7+Math.floor(Math.random()*3)}))});
      }
    });
  }
  setDB(db);save();toast('デモデータを投入しました');refreshDateUI();updateStreak();go('dash');
}

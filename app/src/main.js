import './style.css';
import {$,today} from './util.js';
import {go} from './nav.js';
import {
  refreshDateUI,renderSelEx,renderSets,
  toggleCal,calNav,pickCal,openPicker,closePicker,renderPicker,setCat,toggleArchiveView,pickAct,
  setSide,toggleCustom,addCustom,setVal,cycleSetMode,addSet,rmSet,saveEntry,
} from './record.js';
import {openEdit,setEditSide,closeEdit,editVal,cycleEditSetMode,editAddSet,editRm,editSave,editDelete} from './edit.js';
import {
  updateStreak,setVolMode,renderVolBars,renderExDetail,actNav,
  addBW,rmBW,setWeekGoal,setBalanceMetric,setBalanceRange,setRMFormula,
} from './analysis.js';
import {openExportSheet,closeExport,exExAll,exToggle,renderExportExList,buildExport} from './export.js';
import {exportData,importData,loadDemo,wipe} from './data.js';
import {initPersistence} from './persist.js';

/* inline onclick等（静的HTML＋innerHTMLで生成するHTML）から参照される関数をグローバルに公開する。
   モジュール化後もHTML側のイベント記述を変えないためのブリッジ。 */
Object.assign(window,{
  go,
  toggleCal,calNav,pickCal,openPicker,closePicker,renderPicker,setCat,toggleArchiveView,pickAct,
  setSide,toggleCustom,addCustom,setVal,cycleSetMode,addSet,rmSet,saveEntry,
  openEdit,setEditSide,closeEdit,editVal,cycleEditSetMode,editAddSet,editRm,editSave,editDelete,
  setVolMode,renderVolBars,renderExDetail,actNav,addBW,rmBW,
  setWeekGoal,setBalanceMetric,setBalanceRange,setRMFormula,
  openExportSheet,closeExport,exExAll,exToggle,renderExportExList,buildExport,
  exportData,importData,loadDemo,wipe,
});

/* ===================== 初期化 ===================== */
(async()=>{
  try{await initPersistence();}catch(e){}
  $('#bwDate').value=today();
  refreshDateUI();renderSelEx();renderSets();updateStreak();
})();

export const KEY='workoutLab_v5';
export const BODYPARTS=['胸','背中','肩','腕','脚','体幹'];
export const EQUIPS={barbell:'バーベル',dumbbell:'ダンベル',machine:'マシン',cable:'ケーブル',bodyweight:'自重',assist:'アシスト',other:'その他'};
export const DAYNAMES=['日','月','火','水','木','金','土'];
export const BUILTIN=[
  ['ベンチプレス','胸','barbell',0],['インクラインベンチプレス','胸','barbell',0],
  ['ダンベルベンチプレス','胸','dumbbell',0],['インクラインダンベルプレス','胸','dumbbell',0],
  ['ダンベルフライ','胸','dumbbell',0],['チェストプレス','胸','machine',0],
  ['ペックフライ','胸','machine',0],['ケーブルクロスオーバー','胸','cable',0],['プッシュアップ','胸','bodyweight',0],
  ['デッドリフト','背中','barbell',0],['ベントオーバーロウ','背中','barbell',0],
  ['ラットプルダウン','背中','cable',0],['シーテッドロウ','背中','machine',0],
  ['ワンハンドダンベルロウ','背中','dumbbell',1],['懸垂','背中','bodyweight',0],
  ['ケーブルプルオーバー','背中','cable',0],
  ['ショルダープレス','肩','barbell',0],['ダンベルショルダープレス','肩','dumbbell',0],
  ['サイドレイズ','肩','dumbbell',0],['リアレイズ','肩','dumbbell',0],
  ['アーノルドプレス','肩','dumbbell',0],['フェイスプル','肩','cable',0],['マシンショルダープレス','肩','machine',0],
  ['バーベルカール','腕','barbell',0],['ダンベルカール','腕','dumbbell',0],
  ['ハンマーカール','腕','dumbbell',0],['コンセントレーションカール','腕','dumbbell',1],
  ['トライセプスプレスダウン','腕','cable',0],['ナローベンチプレス','腕','barbell',0],
  ['ライイングエクステンション','腕','barbell',0],['ケーブルカール','腕','cable',0],
  ['スクワット','脚','barbell',0],['レッグプレス','脚','machine',0],
  ['レッグエクステンション','脚','machine',0],['レッグカール','脚','machine',0],
  ['ルーマニアンデッドリフト','脚','barbell',0],['ブルガリアンスクワット','脚','dumbbell',1],
  ['カーフレイズ','脚','machine',0],['ヒップスラスト','脚','barbell',0],
  ['プランク','体幹','bodyweight',0],['クランチ','体幹','bodyweight',0],
  ['アブローラー','体幹','bodyweight',0],['レッグレイズ','体幹','bodyweight',0],
  ['ロシアンツイスト','体幹','bodyweight',0],['ケーブルクランチ','体幹','cable',0],
].map(([name,part,equip,uni])=>({name,part,equip,uni:!!uni,custom:false}));
export const COLORS={'胸':'#db5c38','背中':'#3c7f8e','肩':'#557a5b','腕':'#a56442','脚':'#b87816','体幹':'#b34d61'};
export const LOAD_MODES=['bw','plus','minus'];
export const ICON_NAMES=new Set(['brand','flame','note','history','chart','calendar','target','balance','dumbbell','gauge','scale','sparkles','sliders','database','file','archive','search','trophy','lock','check','chevron']);

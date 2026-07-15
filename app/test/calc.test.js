import {describe,it,expect} from 'vitest';
import {weekKey} from '../src/util.js';
import {setVolume,est1RM} from '../src/calc.js';
import {migrate,setDB} from '../src/db.js';

describe('weekKey（月曜始まり）',()=>{
  it('水曜はその週の月曜を返す',()=>{expect(weekKey('2026-07-15')).toBe('2026-07-13');});
  it('月曜はその日自身',()=>{expect(weekKey('2026-07-13')).toBe('2026-07-13');});
  it('日曜は前の月曜',()=>{expect(weekKey('2026-07-19')).toBe('2026-07-13');});
});

describe('setVolume',()=>{
  it('バーベル: w×reps',()=>{expect(setVolume('barbell',100,5,false,1,70)).toBe(500);});
  it('ダンベル: 片手×2×reps',()=>{expect(setVolume('dumbbell',20,10,false,1,70)).toBe(400);});
  it('片側種目 両側: ×2',()=>{expect(setVolume('dumbbell',20,10,true,2,70)).toBe(400);});
  it('片側種目 片側のみ: ×1',()=>{expect(setVolume('dumbbell',20,10,true,1,70)).toBe(200);});
  it('自重: (体重+w)×reps（加重=正）',()=>{expect(setVolume('bodyweight',10,5,false,1,70)).toBe(400);});
  it('自重: 補助は負のw',()=>{expect(setVolume('bodyweight',-20,5,false,1,70)).toBe(250);});
  it('自重: 体重未登録は1として扱う',()=>{expect(setVolume('bodyweight',0,5,false,1,0)).toBe(5);});
});

describe('est1RM',()=>{
  it('1回はそのまま',()=>{expect(est1RM(100,1)).toBe(100);});
  it('average既定: EpleyとBrzyckiの平均',()=>{
    const epley=100*(1+5/30),brz=100*36/(37-5);
    expect(est1RM(100,5)).toBe(Math.round((epley+brz)/2));
  });
  it('epley切替',()=>{
    setDB(migrate({rmFormula:'epley'}));
    expect(est1RM(100,5)).toBe(Math.round(100*(1+5/30)));
    setDB(migrate({}));
  });
});

describe('migrate（入力サニタイズ・v5移行）',()=>{
  it('アシスト懸垂→懸垂に統合し補助重量を負に',()=>{
    const out=migrate({entries:[{date:'2026-01-05',exName:'アシスト懸垂',equip:'assist',part:'背中',sets:[{w:20,reps:8}]}]});
    expect(out.entries[0].exName).toBe('懸垂');
    expect(out.entries[0].equip).toBe('bodyweight');
    expect(out.entries[0].sets[0].w).toBe(-20);
  });
  it('不正な日付のentryは捨てる',()=>{
    expect(migrate({entries:[{date:'not-a-date',exName:'x',sets:[]}]}).entries).toHaveLength(0);
  });
  it('未知のequip/partはホワイトリストに丸める',()=>{
    const out=migrate({entries:[{date:'2026-01-05',exName:'x',equip:'<img>',part:'evil',sets:[]}]});
    expect(out.entries[0].equip).toBe('other');
    expect(out.entries[0].part).toBe('体幹');
  });
  it('rmFormulaは既知の値のみ許可',()=>{
    expect(migrate({rmFormula:'__proto__'}).rmFormula).toBe('average');
  });
});

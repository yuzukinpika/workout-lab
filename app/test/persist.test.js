import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>{
  const data=new Map();
  globalThis.localStorage={
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key),
    clear:()=>data.clear(),
  };
  return {get:vi.fn(),set:vi.fn()};
});

vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true}}));
vi.mock('@capacitor/preferences',()=>({Preferences:{get:mocks.get,set:mocks.set}}));

import {KEY} from '../src/constants.js';
import {DB,migrate,save,setDB} from '../src/db.js';
import {initPersistence} from '../src/persist.js';

beforeEach(()=>{
  localStorage.clear();
  mocks.get.mockReset();
  mocks.set.mockReset().mockResolvedValue(undefined);
  setDB(migrate({}));
});

describe('initPersistence',()=>{
  it('localStorage消失時はPreferencesから復元する',async()=>{
    const value=JSON.stringify({entries:[{id:'1',date:'2026-07-16',exName:'ベンチプレス',part:'胸',equip:'barbell',sets:[]}]});
    mocks.get.mockResolvedValue({value});
    await initPersistence();
    expect(localStorage.getItem(KEY)).toBe(value);
    expect(DB.entries).toHaveLength(1);
  });

  it('localStorageの既存データをPreferencesへミラーする',async()=>{
    const value=JSON.stringify({entries:[]});
    localStorage.setItem(KEY,value);
    mocks.get.mockResolvedValue({value:null});
    await initPersistence();
    expect(mocks.set).toHaveBeenCalledWith({key:KEY,value});
  });

  it('初期化後の保存をPreferencesへミラーする',async()=>{
    mocks.get.mockResolvedValue({value:null});
    await initPersistence();
    mocks.set.mockClear();
    setDB(migrate({weekGoal:5}));
    save();
    expect(mocks.set).toHaveBeenCalledWith({key:KEY,value:localStorage.getItem(KEY)});
  });
});

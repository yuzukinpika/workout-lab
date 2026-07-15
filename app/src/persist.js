import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {KEY} from './constants.js';
import {setDB,migrate,setSaveHook} from './db.js';

export async function initPersistence(){
  if(!Capacitor.isNativePlatform())return;
  const {value}=await Preferences.get({key:KEY});
  const local=localStorage.getItem(KEY);
  if(!local&&value){
    try{localStorage.setItem(KEY,value);setDB(migrate(JSON.parse(value)));}catch(e){}
  }else if(local){
    Preferences.set({key:KEY,value:local}).catch(()=>{});
  }
  setSaveHook(json=>{Preferences.set({key:KEY,value:json}).catch(()=>{});});
}

/* ルートの app-icon.svg から @capacitor/assets 用の素材（assets/）を生成する。
   実行: node scripts/gen-assets.mjs && npx capacitor-assets generate --ios */
import sharp from 'sharp';
import {mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const p=u=>fileURLToPath(new URL(u,import.meta.url));

const svg=readFileSync(p('../../app-icon.svg'));
mkdirSync(p('../assets'),{recursive:true});

// アイコン: 1024x1024（iOSは不透明・角丸はOS側で適用）
await sharp(svg,{density:288}).resize(1024,1024).png().toFile(p('../assets/icon-only.png'));

// スプラッシュ: 2732x2732、#fcfaf7 背景に角丸アイコンを中央配置
const size=480,r=size*0.22;
const logo=await sharp(svg,{density:288}).resize(size,size).png().toBuffer();
const mask=Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`);
const rounded=await sharp(logo).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
const splash=sharp({create:{width:2732,height:2732,channels:4,background:'#fcfaf7'}})
  .composite([{input:rounded,gravity:'center'}]).png();
await splash.clone().toFile(p('../assets/splash.png'));
await splash.clone().toFile(p('../assets/splash-dark.png'));
console.log('assets generated');

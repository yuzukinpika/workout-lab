# app/ — App Store版の開発フォルダ

ここに Phase 1 以降（ファイル分割・Vite ビルド・Capacitor化）の新実装を進める。
ルート直下のファイル群（workout-app.html / index.html / sw.js 等）は現行PWA（GitHub Pages配信中）で、安定版として維持する。

## 開発コマンド

```sh
npm install        # 初回のみ
npm run dev        # 開発サーバ（http://localhost:5173）
npm run build      # 本番ビルド → dist/
npm run test       # 純粋関数のユニットテスト（Vitest）
```

## 構成（Phase 1: workout-app.html を分割したもの）

- `index.html` — マークアップ（inline onclick は現行のまま。関数は main.js が window に公開）
- `src/style.css` — 全スタイル
- `src/constants.js` — 種目リスト・部位・器具などの定数
- `src/util.js` — DOM/日付ユーティリティ・esc（XSS対策）
- `src/db.js` — localStorage（キー `workoutLab_v5`）・migrate（入力サニタイズ）
- `src/calc.js` — ボリューム計算・推定1RM などの計算ロジック
- `src/chart.js` — 自前SVG折れ線
- `src/stats.js` — ストリーク・観察メモなどの集計
- `src/record.js` / `src/edit.js` / `src/history.js` / `src/analysis.js` — 各画面のUI
- `src/export.js` — AIコーチ用エクスポート
- `src/data.js` — バックアップ/読み込み/デモ/全削除
- `src/nav.js` / `src/main.js` — タブ切替・初期化・windowブリッジ

## 現行PWAとの差分（意図的なもの）

- Service Worker / manifest は未搭載（Capacitor化するアプリ本体には不要。必要になったら再検討）
- CSPメタタグは Vite dev では外し、`npm run build` 時に vite.config.js が現行と同じ内容を注入する

データモデル（`workoutLab_v5`）と計算ロジックは HANDOFF.md の仕様どおり維持すること。

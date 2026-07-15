import { defineConfig } from 'vite';

// 現行PWAと同じCSP（XSS時のデータ外部送信を遮断）。
// Vite devサーバはHMR用のWebSocket等が必要なため、ビルド成果物にのみ注入する。
const CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'";

export default defineConfig({
  base: './', // Capacitor(file://)でも動くよう相対パス
  server: { port: 5173, strictPort: true },
  plugins: [
    {
      name: 'inject-csp',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          '<meta charset="UTF-8">',
          `<meta charset="UTF-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`
        );
      },
    },
  ],
});

# 潮巢 Project Dashboard｜GitHub Pages PWA

潮巢 Nestory 內部使用的 Project Bot 只讀儀表板。資料來源為 Google Apps Script Web App API，前端只讀取 JSON 並做視覺化，不登入、不編輯任務、不寫入 Google Sheet，也不串接 LINE。

## 技術架構

- Vite + React + CSS
- GitHub Pages 部署
- PWA：manifest、service worker、可加入手機桌面
- 手機優先，桌機也支援
- 一般 `fetch` 讀取 Apps Script API

## 設定 API_BASE_URL

打開 `src/config.js`，把 Apps Script Web App URL 填入：

```js
export const API_BASE_URL = 'https://script.google.com/macros/s/xxxx/exec';
```

API 測試網址格式：

```txt
https://script.google.com/macros/s/xxxx/exec?type=dashboard
https://script.google.com/macros/s/xxxx/exec?type=tasks
https://script.google.com/macros/s/xxxx/exec?type=reports
https://script.google.com/macros/s/xxxx/exec?type=members
https://script.google.com/macros/s/xxxx/exec?type=categories
https://script.google.com/macros/s/xxxx/exec?type=blockers
https://script.google.com/macros/s/xxxx/exec?type=ideas
```

預期回傳：

```json
{
  "success": true,
  "type": "dashboard",
  "generatedAt": "yyyy/mm/dd hh:mm:ss",
  "data": {}
}
```

如果 `success` 是 `false`，畫面會顯示 API 錯誤訊息。

## 本機測試

```bash
npm install
npm run dev
npm run build
npm run preview
```

開發伺服器通常會在 `http://localhost:5173/chocho-project-dashboard/`。

## GitHub Pages 部署

此專案已包含 `.github/workflows/deploy.yml`，push 到 `main` 後會自動 build 並部署到 GitHub Pages。

部署步驟：

1. 建立 GitHub repo，例如 `chocho-project-dashboard`
2. 確認 `vite.config.js` 的 `base` 設定正確
3. push 專案到 `main` branch
4. 到 GitHub repo 的 Settings → Pages
5. Source 選擇 GitHub Actions
6. 等待 Actions 成功
7. 打開 GitHub Pages URL
8. 檢查資料是否正常載入

## 修改 repo base path

Vite 部署到 GitHub Pages 必須設定 `base`。

如果 repo 名稱是 `chocho-project-dashboard`，請使用：

```js
base: '/chocho-project-dashboard/'
```

如果 repo 名稱改成 `my-dashboard`，請改成：

```js
base: '/my-dashboard/'
```

同時建議更新 `public/manifest.json` 的 `start_url` 和 `scope`：

```json
{
  "start_url": "/my-dashboard/",
  "scope": "/my-dashboard/"
}
```

## 常見錯誤排查

### fetch 失敗或 CORS 錯誤

請先確認：

- Apps Script Web App 是否已部署為 Web App
- 存取權限是否允許前端讀取
- API URL 是否可直接在瀏覽器打開
- 回傳內容是否為 JSON
- Apps Script `doGet` 是否有正確回傳 `ContentService.createTextOutput(JSON.stringify(...)).setMimeType(ContentService.MimeType.JSON)`
- DevTools Console / Network 是否出現 CORS、redirect、403、404 或 HTML 回應

第一版使用一般 `fetch`。如果 Apps Script 不能直接被前端讀取，可以考慮：

- 使用 Apps Script JSONP 格式，例如支援 `callback=xxx`
- 使用 Cloudflare Worker、Netlify Function 或其他簡單 proxy
- 調整 Apps Script `doGet` 的回傳格式與部署權限

### GitHub Pages 顯示空白

通常是 `base` 錯誤。repo 是 `chocho-project-dashboard` 時，`vite.config.js` 必須是：

```js
base: '/chocho-project-dashboard/'
```

### PWA 不能安裝

請確認：

- 網站使用 HTTPS
- `manifest.json` 可以正常載入
- `sw.js` 註冊成功
- GitHub Pages URL 的 base path 與 manifest 的 `start_url`、`scope` 一致

## 目前頁面

- 總覽 Dashboard
- 任務看板 Tasks
- 分類進度 Categories
- 日報 Reports
- 卡關中心 Blockers
- 想法池 Ideas

## 未來可擴充功能

- 更精準的資料欄位 mapping
- 成員績效趨勢
- 分類趨勢圖
- API proxy 或 JSONP 模式
- 離線快取最近一次 API 資料
- 手機推播提醒
- 權限控管與內部登入

# Music Shop - 商品解析器

一個具有音樂風格的前端應用程式，用於解析商品資訊並展示圖片與 HTML 內容。

## 🎵 功能特色

### 音樂風格設計
- 優美的漸層背景
- 動態浮動音符動畫
- 唱片轉盤載入動畫
- 流暢的互動體驗

### 商品解析
- 輸入商品網址
- 自動發送請求到 n8n webhook
- 即時解析並顯示結果

### HTML 預覽與下載
- 前端即時渲染 HTML 內容（預覽用）
- 美觀的內容呈現
- 下載 n8n 返回的**原始文字**（包含 markdown 標記）

### 圖片管理
- **📥 點擊即下載**：點擊任一圖片「下載」按鈕，自動下載到用戶的「下載」資料夾
- **🐍 Python 代理**：使用 Python `requests` 繞過 CORS 限制
- **💾 存到用戶下載資料夾**：就像一般網頁下載一樣（~/Downloads）
- 自動去重圖片
- 網格式圖片展示

## 🏗️ 技術架構

```
前端 (Vercel)          ← 使用者訪問
    ↓
n8n webhook           ← 取得商品資訊
    ↓
Python 後端 (GCP Cloud Run) ← 下載圖片（繞過 CORS）
```

## 🚀 部署資訊

- **前端**: Vercel
- **後端**: GCP Cloud Run
- **後端 API**: https://music-shop-image-downloader-354905615311.asia-east1.run.app

## 🌐 Demo

訪問: [部署後的 URL]

## 📱 使用方式

1. 輸入商品網址並點擊「解析商品」
2. 查看商品資訊和圖片
3. 點擊任一圖片的「下載」按鈕自動下載到本地
4. 或點擊「下載 HTML」取得原始文字

## 🛠️ 技術棧

- **前端**: HTML, CSS, JavaScript
- **後端**: Python Flask (Cloud Run)
- **部署**: Vercel (前端), GCP Cloud Run (後端)
- **API**: n8n webhook

## 📄 License

MIT

---

💖 Made with love for music lovers

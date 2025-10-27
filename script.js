// 全域變數
let currentData = null;

// DOM 元素
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const htmlPreview = document.getElementById('htmlPreview');
const imageGallery = document.getElementById('imageGallery');
const imageCount = document.getElementById('imageCount');
const downloadHtmlBtn = document.getElementById('downloadHtml');
const downloadAllImagesBtn = document.getElementById('downloadAllImages');

// 從 config.js 讀取配置
const WEBHOOK_URL = CONFIG.N8N_WEBHOOK;
const AUTO_DOWNLOAD_SERVICE = CONFIG.IMAGE_DOWNLOAD_SERVICE;

// 事件監聽器
submitBtn.addEventListener('click', handleSubmit);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});
downloadHtmlBtn.addEventListener('click', downloadHTML);
downloadAllImagesBtn.addEventListener('click', downloadAllImages);

// 主要處理函式
async function handleSubmit() {
    const url = urlInput.value.trim();
    
    // 驗證輸入
    if (!url) {
        showError('請輸入商品網址');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('請輸入有效的網址格式');
        return;
    }
    
    // 顯示載入狀態
    showLoading();
    
    try {
        // 發送請求到 n8n webhook
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 儲存資料
        currentData = data;
        
        // 顯示結果
        displayResults(data);
        
    } catch (err) {
        console.error('Error:', err);
        showError('請求失敗，請檢查網路連線或稍後再試');
    }
}

// 顯示結果
function displayResults(data) {
    hideAll();
    results.style.display = 'block';
    
    // 處理 HTML 內容
    if (data && data.length > 0) {
        let originalContent;
        
        // 檢查新格式（LLM 直接輸出）
        if (data[0].content && data[0].content.parts && data[0].content.parts[0]) {
            originalContent = data[0].content.parts[0].text;
        } 
        // 檢查 OpenAI 格式
        else if (data[0].choices && data[0].choices[0] && data[0].choices[0].message) {
            originalContent = data[0].choices[0].message.content;
        }
        // 檢查舊格式（AI Agent 輸出）
        else if (data[0].output) {
            originalContent = data[0].output;
        }
        // 檢查直接文字格式
        else if (data[0].text) {
            originalContent = data[0].text;
        }
        
        if (originalContent) {
            // 前端預覽：移除 markdown 的程式碼區塊標記
            const cleanHtml = originalContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');
            htmlPreview.innerHTML = cleanHtml;
            
            // 將原始內容存到全域變數供下載使用
            window.originalHtmlContent = originalContent;
        } else {
            htmlPreview.innerHTML = '<p style="color: #999;">無商品資訊</p>';
            window.originalHtmlContent = null;
        }
    } else {
        htmlPreview.innerHTML = '<p style="color: #999;">無商品資訊</p>';
        window.originalHtmlContent = null;
    }
    
    // 處理圖片
    if (data && data.length > 1 && data[1].images) {
        const images = data[1].images;
        // 去除重複的圖片
        const uniqueImages = [...new Set(images)];
        imageCount.textContent = uniqueImages.length;
        
        imageGallery.innerHTML = '';
        
        uniqueImages.forEach((imageUrl, index) => {
            const imageItem = createImageItem(imageUrl, index);
            imageGallery.appendChild(imageItem);
        });
        
        // 不自動彈窗，用戶可以點擊個別圖片下載
    } else {
        imageGallery.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center;">無圖片資料</p>';
        imageCount.textContent = '0';
    }
}

// 創建圖片項目
function createImageItem(imageUrl, index) {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.style.animationDelay = `${index * 0.05}s`;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = `商品圖片 ${index + 1}`;
    img.loading = 'lazy';
    
    // 圖片載入錯誤處理
    img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3E圖片載入失敗%3C/text%3E%3C/svg%3E';
    };
    
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'image-buttons';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'image-download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下載';
    downloadBtn.onclick = (e) => {
        e.stopPropagation();
        downloadImage(imageUrl, index);
    };
    
    const openBtn = document.createElement('button');
    openBtn.className = 'image-download-btn image-open-btn';
    openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> 開啟';
    openBtn.onclick = (e) => {
        e.stopPropagation();
        window.open(imageUrl, '_blank');
    };
    
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(openBtn);
    overlay.appendChild(buttonContainer);
    div.appendChild(img);
    div.appendChild(overlay);
    
    return div;
}

// （此函數已移除 - 不再自動彈窗詢問下載）

// 下載 HTML（下載 n8n 返回的原始文字）
function downloadHTML() {
    if (!window.originalHtmlContent) {
        alert('無資料可下載');
        return;
    }
    
    // 下載原始內容（包含 markdown 標記）
    const originalContent = window.originalHtmlContent;
    const blob = new Blob([originalContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_info_${Date.now()}.txt`;  // 改為 .txt 因為是原始文字
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showDownloadToast('✅ 已下載原始文字檔案', 'success', 2000);
}

// 下載單張圖片（使用 Python 代理）
async function downloadImage(imageUrl, index) {
    showDownloadToast('正在下載圖片...', 'info');
    
    try {
        // 調用 Python 代理服務
        const response = await fetch(AUTO_DOWNLOAD_SERVICE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: imageUrl  // 傳送單一圖片網址
            })
        });
        
        if (response.ok) {
            // Python 成功下載，返回圖片文件
            const blob = await response.blob();
            
            // 從回應標頭取得檔案名稱
            const contentDisposition = response.headers.get('content-disposition');
            let filename = imageUrl.split('/').pop().split('?')[0] || `image_${index + 1}.jpg`;
            
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            
            // 觸發瀏覽器下載到用戶的「下載」資料夾
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showDownloadToast(`✅ 下載成功！\n${filename}`, 'success', 3000);
            return;
        }
        
        throw new Error('Python 服務未回應');
        
    } catch (err) {
        console.error('Python 服務未啟動，使用瀏覽器下載:', err);
        
        // 備用：瀏覽器直接下載
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Fetch failed');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const filename = imageUrl.split('/').pop().split('?')[0] || `image_${index + 1}.jpg`;
            
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showDownloadToast(
                `⚠️ Python 服務未啟動\n已使用瀏覽器下載\n\n` +
                `💡 啟動 Python 服務可繞過 CORS 限制：\n` +
                `python3 image_downloader.py`,
                'warning',
                6000
            );
            
        } catch (directErr) {
            showDownloadToast(
                `❌ 下載失敗\n\n` +
                `請確認 Python 服務已啟動：\n` +
                `python3 image_downloader.py\n\n` +
                `或點擊「開啟」按鈕在新分頁查看`,
                'warning',
                6000
            );
        }
    }
}

// 下載所有圖片
async function downloadAllImages() {
    if (!currentData || !currentData[1] || !currentData[1].images) {
        alert('無圖片可下載');
        return;
    }
    
    const images = [...new Set(currentData[1].images)];
    
    showDownloadToast(`正在批次下載 ${images.length} 張圖片...`, 'info', 3000);
    
    // 逐一下載到用戶的「下載」資料夾
    for (let i = 0; i < images.length; i++) {
        setTimeout(() => {
            downloadImage(images[i], i);
        }, i * 1000);  // 每張間隔 1 秒
    }
}

// 顯示載入狀態
function showLoading() {
    hideAll();
    loading.style.display = 'block';
    submitBtn.disabled = true;
}

// 顯示錯誤
function showError(message) {
    hideAll();
    error.style.display = 'block';
    errorMessage.textContent = message;
    submitBtn.disabled = false;
    
    // 3秒後自動隱藏錯誤訊息
    setTimeout(() => {
        error.style.display = 'none';
    }, 3000);
}

// 隱藏所有狀態區塊
function hideAll() {
    loading.style.display = 'none';
    results.style.display = 'none';
    error.style.display = 'none';
    submitBtn.disabled = false;
}

// URL 驗證
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
}

// Toast 通知系統
function showDownloadToast(message, type = 'info', duration = 3000) {
    // 移除現有的 toast
    const existingToast = document.querySelector('.download-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 創建新的 toast
    const toast = document.createElement('div');
    toast.className = `download-toast download-toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                  type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : 
                  '<i class="fas fa-spinner fa-spin"></i>'}
            </div>
            <div class="toast-message">${message.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // 觸發動畫
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自動移除
    if (type !== 'info' || duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
}

// 頁面載入完成後的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Music Shop 已載入完成');
    urlInput.focus();
});


<script setup>
import { onMounted } from 'vue'
import './image2svip.css'

onMounted(() => {
  const HISTORY_STORAGE_KEY = 'image2svip.history'
  const DB_NAME = 'image2svip'
  const DB_VERSION = 1
  const STORE_NAME = 'images'

  // 内联配置（原 /api/config 的返回值，来自 image2svip/app-config.js）
  const PUBLIC_CONFIG = {
    app: {
      name: 'image2svip',
      eyebrow: 'FLOW API',
      tagline: '图像生成工作台',
      apiKeyHelp: '获取 API Key，可到\nhttps://www.zyflow.cn',
      purchaseUrl: 'https://www.zyflow.cn'
    },
    api: {
      url: 'https://www.zyflow.cn/v1/chat/completions',
      providerLabel: 'openai',
      endpointPath: '/v1/chat/completions',
      method: 'POST',
      maxImages: 6,
      maxCount: 10
    },
    generation: {
      defaultModel: 'codex-gpt-image-2',
      defaultSize: 'auto',
      defaultCount: 1,
      models: [
        { id: 'codex-gpt-image-2', label: 'codex-gpt-image-2', description: '默认图像生成模型', groups: ['default分组'], priceSummary: '模型价格 $1.000', unit: '/ 次' },
        { id: 'gpt-image-2', label: 'gpt-image-2', description: 'VIP 图像生成模型', groups: ['default分组', 'vip分组'], priceSummary: '模型价格 $1.000', unit: '/ 次' }
      ],
      sizes: [
        { value: 'auto', label: '智能', hint: '自动', pixels: '1536 x 1024' },
        { value: '1792x768', label: '21:9', hint: '超宽', pixels: '1792 x 768' },
        { value: '1536x864', label: '16:9', hint: '横屏', pixels: '1536 x 864' },
        { value: '1536x1024', label: '3:2', hint: '横图', pixels: '1536 x 1024' },
        { value: '1152x864', label: '4:3', hint: '横图', pixels: '1152 x 864' },
        { value: '1024x1024', label: '1:1', hint: '方图', pixels: '1024 x 1024' },
        { value: '864x1152', label: '3:4', hint: '竖图', pixels: '864 x 1152' },
        { value: '1024x1536', label: '2:3', hint: '竖图', pixels: '1024 x 1536' },
        { value: '768x1792', label: '9:16', hint: '竖屏', pixels: '768 x 1792' }
      ],
      counts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
  }

  let db
  let appConfig = PUBLIC_CONFIG
  const API_URL = appConfig.api.url

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }
      request.onupgradeneeded = (event) => {
        const database = event.target.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  async function saveImageToDB(url, data) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const request = store.add({ id, url: data, originalUrl: url, timestamp: Date.now() })
      request.onsuccess = () => resolve({ id, localUrl: data })
      request.onerror = () => reject(request.error)
    })
  }

  function getImageFromDB(id) {
    return new Promise((resolve, reject) => {
      if (!db || !id) {
        resolve(null)
        return
      }
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  function deleteImageFromDB(id) {
    return new Promise((resolve, reject) => {
      if (!db || !id) {
        resolve()
        return
      }
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async function downloadImage(url) {
    try {
      if (url.startsWith('data:image/')) {
        return url
      }
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.warn('下载图片失败，使用原始链接:', error)
      return url
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
      const parsed = JSON.parse(raw || '[]')
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === 'object') : []
    } catch (error) {
      console.warn('Failed to parse history from storage.', error)
      return []
    }
  }

  const state = {
    images: [],
    history: loadHistory(),
    activeHistoryUrl: '',
    currentResults: [],
    currentResultMeta: { pixels: '', sizeLabel: '' },
    activeResultIndex: 0,
    generating: false
  }

  const els = {
    brandEyebrow: document.querySelector('#brandEyebrow'),
    brandName: document.querySelector('#brandName'),
    apiKeyHelp: document.querySelector('#apiKeyHelp'),
    apiKey: document.querySelector('#apiKey'),
    model: document.querySelector('#model'),
    prompt: document.querySelector('#prompt'),
    counter: document.querySelector('#counter'),
    saveKey: document.querySelector('#saveKey'),
    clearKey: document.querySelector('#clearKey'),
    keyStatus: document.querySelector('#keyStatus'),
    generate: document.querySelector('#generate'),
    dropZone: document.querySelector('#dropZone'),
    imageInput: document.querySelector('#imageInput'),
    thumbStrip: document.querySelector('#thumbStrip'),
    generationError: document.querySelector('#generationError'),
    size: document.querySelector('#size'),
    sizeText: document.querySelector('#sizeText'),
    sizeOptions: document.querySelector('#sizeOptions'),
    count: document.querySelector('#count'),
    countText: document.querySelector('#countText'),
    countOptions: document.querySelector('#countOptions'),
    clearHistory: document.querySelector('#clearHistory'),
    canvasPanel: document.querySelector('.canvas-panel'),
    canvasStatus: document.querySelector('#canvasStatus'),
    progressPill: document.querySelector('#progressPill'),
    resultGrid: document.querySelector('#resultGrid'),
    imagePreviewModal: document.querySelector('#imagePreviewModal'),
    previewImage: document.querySelector('#previewImage'),
    previewClose: document.querySelector('#previewClose'),
    historyList: document.querySelector('#historyList'),
    toast: document.querySelector('#toast'),
    modelInfoButton: document.querySelector('#modelInfoButton'),
    modelModal: document.querySelector('#modelModal'),
    modalModelName: document.querySelector('#modalModelName'),
    pricingTable: document.querySelector('#pricingTable'),
    endpointProvider: document.querySelector('#endpointProvider'),
    endpointPath: document.querySelector('#endpointPath'),
    endpointMethod: document.querySelector('#endpointMethod')
  }

  function isDataImageUrl(url) {
    return typeof url === 'string' && url.startsWith('data:image/')
  }

  function persistHistory() {
    for (let count = state.history.length; count >= 0; count -= 1) {
      try {
        const persisted = state.history.slice(0, count).map((item) => ({
          imageId: item.imageId || null,
          originalUrl: isDataImageUrl(item.originalUrl || item.url) ? '' : item.originalUrl || item.url || '',
          prompt: item.prompt || '',
          model: item.model || '',
          sizeLabel: item.sizeLabel || '',
          pixels: item.pixels || '',
          time: item.time || ''
        }))
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(persisted))
        return
      } catch (error) {
        if (count === 0) {
          console.warn('Failed to persist history to storage.', error)
        }
      }
    }
  }

  async function hydrateHistory() {
    const storedHistory = loadHistory()
    if (!storedHistory.length) {
      state.history = []
      renderHistory()
      return
    }

    if (!db) {
      try {
        await openDB()
      } catch (error) {
        console.warn('Failed to open IndexedDB while hydrating history.', error)
      }
    }

    const hydrated = await Promise.all(
      storedHistory.map(async (item) => {
        if (item.imageId) {
          try {
            const savedImage = await getImageFromDB(item.imageId)
            if (savedImage?.url) {
              return {
                ...item,
                url: savedImage.url,
                originalUrl: savedImage.originalUrl || item.originalUrl || savedImage.url
              }
            }
          } catch (error) {
            console.warn('Failed to restore image from IndexedDB.', error)
          }
        }

        if (item.originalUrl) {
          return { ...item, url: item.originalUrl }
        }

        return null
      })
    )

    state.history = hydrated.filter(Boolean).slice(0, 12)
    renderHistory()
  }

  function modelMeta() {
    return Object.fromEntries(appConfig.generation.models.map((model) => [model.id, model]))
  }

  function renderConfigDrivenControls() {
    els.brandEyebrow.textContent = appConfig.app.eyebrow || 'FLOW API'
    els.brandName.textContent = appConfig.app.name || 'image2svip'
    els.apiKeyHelp.innerHTML = escapeHtml(appConfig.app.apiKeyHelp || '').replaceAll('\n', '<br />')
    document.title = appConfig.app.name || 'image2svip'

    els.model.innerHTML = appConfig.generation.models
      .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`)
      .join('')

    els.sizeOptions.innerHTML = appConfig.generation.sizes
      .map(
        (size) => `
        <button class="option-tile" type="button" data-value="${escapeHtml(size.value)}" data-label="${escapeHtml(size.label)}" data-pixels="${escapeHtml(size.pixels || '')}">
          <strong>${escapeHtml(size.label)}</strong>
          <span>${escapeHtml(size.hint || size.pixels || '')}</span>
        </button>
      `
      )
      .join('')

    els.size.innerHTML = appConfig.generation.sizes
      .map((size) => `<option value="${escapeHtml(size.value)}">${escapeHtml(size.label)}</option>`)
      .join('')

    els.countOptions.innerHTML = appConfig.generation.counts
      .map((count) => `<button class="option-tile" type="button" data-value="${count}">${count}</button>`)
      .join('')

    els.count.innerHTML = appConfig.generation.counts
      .map((count) => `<option value="${count}">${count} 张</option>`)
      .join('')

    els.endpointProvider.textContent = `${appConfig.api.providerLabel || 'openai'}:`
    els.endpointPath.textContent = appConfig.api.url || appConfig.api.endpointPath || ''
    els.endpointMethod.textContent = appConfig.api.method || 'POST'
  }

  async function init() {
    renderConfigDrivenControls()

    const savedKey = localStorage.getItem('image2svip.apiKey')
    const savedModel = localStorage.getItem('image2svip.model')
    const savedSize = localStorage.getItem('image2svip.size')
    const savedCount = localStorage.getItem('image2svip.count')

    if (savedKey) {
      els.apiKey.value = savedKey
      setKeyStatus(true)
    }

    const models = modelMeta()
    els.model.value = savedModel && models[savedModel] ? savedModel : appConfig.generation.defaultModel

    els.size.value =
      savedSize && els.size.querySelector(`option[value="${CSS.escape(savedSize)}"]`)
        ? savedSize
        : appConfig.generation.defaultSize

    els.count.value =
      savedCount && els.count.querySelector(`option[value="${CSS.escape(savedCount)}"]`)
        ? savedCount
        : String(appConfig.generation.defaultCount || 1)

    document.querySelectorAll('.control-group').forEach((group) => {
      group.classList.add('is-open')
      const header = group.querySelector('.control-header')
      if (header) header.setAttribute('aria-expanded', 'true')
    })

    await hydrateHistory()
    updateCount()
    syncOptionControls()
    renderPricing()
  }

  function setKeyStatus(saved) {
    els.keyStatus.classList.toggle('saved', saved)
    els.keyStatus.lastChild.textContent = saved ? '已保存 Key' : '等待保存 Key'
  }

  function toast(message) {
    els.toast.textContent = message
    els.toast.classList.add('show')
    clearTimeout(window.__toastTimer)
    window.__toastTimer = setTimeout(() => {
      els.toast.classList.remove('show')
    }, 2600)
  }

  function showGenerationError(message) {
    els.generationError.textContent = message
    els.generationError.hidden = false
  }

  function clearGenerationError() {
    els.generationError.textContent = ''
    els.generationError.hidden = true
  }

  function updateCount() {
    const count = els.prompt.value.trim().length
    els.counter.textContent = `${count} 字`
  }

  function selectedSizeButton() {
    return els.sizeOptions.querySelector(`[data-value="${CSS.escape(els.size.value)}"]`)
  }

  function selectedSizeLabel() {
    return selectedSizeButton()?.dataset.label || els.size.options[els.size.selectedIndex]?.textContent || '智能'
  }

  function selectedSizePixels() {
    return selectedSizeButton()?.dataset.pixels || appConfig.generation.sizes[0]?.pixels || '1536 x 1024'
  }

  function syncOptionControls() {
    const sizeButton = selectedSizeButton()
    const countButton = els.countOptions.querySelector(`[data-value="${CSS.escape(els.count.value)}"]`)

    els.sizeOptions.querySelectorAll('.option-tile').forEach((button) => {
      button.classList.toggle('is-active', button === sizeButton)
    })

    els.countOptions.querySelectorAll('.option-tile').forEach((button) => {
      button.classList.toggle('is-active', button === countButton)
    })

    els.sizeText.textContent = selectedSizeLabel()
    els.countText.textContent = `${els.count.value} 张`
  }

  function setGenerating(isGenerating) {
    state.generating = isGenerating
    els.canvasPanel.classList.toggle('is-generating', isGenerating)
    els.generate.disabled = isGenerating

    if (isGenerating) {
      els.generate.innerHTML = spinnerIcon() + '<span>生成中</span>'
      els.canvasStatus.style.display = ''
      els.canvasStatus.querySelector('span').textContent = `并发生成中 0 / ${els.count.value}`
      els.progressPill.innerHTML = spinnerIcon() + `<span>并发生成中 0 / ${els.count.value}</span>`
      renderPendingResults(Number(els.count.value))
    } else {
      els.generate.innerHTML = sparkleIcon() + '<span>生成图像</span>'
    }
  }

  function sparkleIcon() {
    return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="m17.8 6.2 1.4-1.4"></path>
      <path d="m10.8 13.2 1.4-1.4"></path>
      <path d="m17.8 11.8 1.4 1.4"></path>
      <path d="M3 21 14 10"></path>
    </svg>
  `
  }

  function spinnerIcon() {
    return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
    </svg>
  `
  }

  function checkIcon() {
    return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m20 6-11 11-5-5"></path>
    </svg>
  `
  }

  function copyIcon() {
    return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2"></rect>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>
  `
  }

  function downloadIcon() {
    return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <path d="M7 10l5 5 5-5"></path>
      <path d="M12 15V3"></path>
    </svg>
  `
  }

  function renderThumbs() {
    els.thumbStrip.hidden = state.images.length === 0
    els.thumbStrip.innerHTML = state.images
      .map((image) => `<img src="${image.dataUrl}" alt="${escapeHtml(image.name)}" />`)
      .join('')
  }

  function renderHistory() {
    els.clearHistory.hidden = state.history.length === 0

    if (state.history.length === 0) {
      els.historyList.innerHTML = '<p>暂无图像</p>'
      return
    }

    els.historyList.innerHTML = state.history
      .slice(0, 8)
      .map(
        (item, index) => `
        <button class="history-item ${
          item.url === state.activeHistoryUrl || (!state.activeHistoryUrl && index === 0) ? 'is-active' : ''
        }" type="button" data-history-index="${index}">
          <img src="${item.url}" alt="" />
          <span class="history-meta">${escapeHtml(item.time)} / ${escapeHtml(item.sizeLabel || '智能')}</span>
        </button>
      `
      )
      .join('')
  }

  function renderPendingResults(count) {
    els.resultGrid.classList.add('is-pending')
    els.resultGrid.innerHTML = `
    <div class="generation-wait">
      <div class="orbit-loader" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <strong>正在生成图像</strong>
      <p>已提交到 HTTPS 上游接口，请保持页面开启</p>
      <div class="wait-meter"><span style="width: 0%"></span></div>
    </div>
    <div class="generation-list">
      ${Array.from({ length: count }, (_, index) => `
        <div class="generation-card">
          <span class="generation-icon">${spinnerIcon()}</span>
          <strong>第 ${index + 1} 张生成中</strong>
        </div>
      `).join('')}
    </div>
  `
  }

  function updateGenerationProgress(done, total) {
    const label = `并发生成中 ${done} / ${total}`
    els.canvasStatus.querySelector('span').textContent = label
    els.progressPill.innerHTML = spinnerIcon() + `<span>${label}</span>`
    const meter = els.resultGrid.querySelector('.wait-meter span')
    if (meter) {
      meter.style.width = `${Math.round((done / Math.max(total, 1)) * 100)}%`
    }
  }

  function renderPricing() {
    const model = els.model.value
    const meta = modelMeta()[model] || appConfig.generation.models[0] || {}
    const groups = meta.groups || ['default分组']
    els.modalModelName.textContent = meta.label || model
    els.pricingTable.innerHTML = `
    <div class="pricing-head">
      <span>分组</span>
      <span>计费类型</span>
      <span>价格摘要</span>
    </div>
    ${groups
      .map(
        (group) => `
          <div class="pricing-row">
            <span class="tag">${escapeHtml(group)}</span>
            <span class="pill">按次计费</span>
            <span><b>${escapeHtml(meta.priceSummary || '按上游接口计费')}</b><small>${escapeHtml(meta.unit || '')}</small></span>
          </div>
        `
      )
      .join('')}
  `
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function addFiles(files) {
    const imageFiles = [...files].filter((file) => file.type.startsWith('image/'))
    const maxImages = Number(appConfig.api.maxImages || 6)

    if (imageFiles.length === 0) {
      toast('请选择图片文件。')
      return
    }

    const loaded = await Promise.all(
      imageFiles.slice(0, maxImages).map(async (file) => ({
        name: file.name,
        dataUrl: await fileToDataUrl(file)
      }))
    )

    state.images = [...state.images, ...loaded].slice(0, maxImages)
    renderThumbs()
    toast(`已添加 ${loaded.length} 张参考图。`)
  }

  function createGenerationSnapshot() {
    return {
      apiKey: els.apiKey.value.trim(),
      prompt: els.prompt.value.trim(),
      model: els.model.value,
      size: els.size.value,
      count: Number(els.count.value),
      images: state.images.map((image) => ({ ...image }))
    }
  }

  function extractImageUrls(data) {
    const urls = []
    const visit = (value) => {
      if (!value) return

      if (typeof value === 'string') {
        const markdown = value.match(/!\[[^\]]*]\(([^)]+)\)/)
        if (markdown) urls.push(markdown[1])

        const dataUrl = value.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/)
        if (dataUrl) urls.push(dataUrl[0])

        const directUrl = value.match(/https?:\/\/[^\s"'<>]+/)
        if (directUrl && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(directUrl[0])) {
          urls.push(directUrl[0])
        }
        return
      }

      if (Array.isArray(value)) {
        value.forEach(visit)
        return
      }

      if (typeof value === 'object') {
        if (value.b64_json) urls.push(`data:image/png;base64,${value.b64_json}`)
        if (value.url && typeof value.url === 'string') urls.push(value.url)
        if (value.image_url) {
          if (typeof value.image_url === 'string') urls.push(value.image_url)
          if (value.image_url.url) urls.push(value.image_url.url)
        }
        if (value.data && typeof value.data === 'string' && value.data.startsWith('data:image/')) {
          urls.push(value.data)
        }
        Object.values(value).forEach(visit)
      }
    }

    visit(data?.data)
    visit(data?.image)
    visit(data?.choices?.map((choice) => choice.message?.content))

    return [...new Set(urls)].filter(Boolean)
  }

  function normalizeResultItems(items) {
    return items.map((item, index) =>
      typeof item === 'string' ? { url: item, status: 'success', index } : { ...item, index: item.index ?? index }
    )
  }

  function renderResults(urls, options = {}) {
    const items = normalizeResultItems(urls)
    const successItems = items.filter((item) => item.url)
    const failedItems = items.filter((item) => item.status === 'failed')

    if (urls.length === 0) {
      els.canvasStatus.querySelector('span').textContent = '生成完成，但没有识别到图片地址'
      els.progressPill.innerHTML = sparkleIcon() + '<span>无图像结果</span>'
      return
    }

    const sizeLabel = options.sizeLabel || selectedSizeLabel()
    const fallbackPixels = options.pixels || selectedSizePixels()
    const activeIndex = Math.max(0, Math.min(Math.max(successItems.length - 1, 0), Number(options.activeIndex || 0)))
    const activeItem = successItems[activeIndex]
    const totalCount = options.totalCount || items.length

    state.currentResults = [...items]
    state.currentResultMeta = { pixels: fallbackPixels, sizeLabel }
    state.activeResultIndex = activeIndex

    els.resultGrid.classList.remove('is-pending')
    els.progressPill.innerHTML =
      failedItems.length > 0
        ? sparkleIcon() + `<span>已生成 ${successItems.length} 张，失败 ${failedItems.length} 张</span>`
        : checkIcon() + `<span>已生成 ${successItems.length} 张图像</span>`

    if (!activeItem) {
      els.canvasStatus.style.display = ''
      els.canvasStatus.querySelector('span').textContent = '生成失败'
      els.resultGrid.innerHTML = `
      <div class="result-switcher">
        ${items.map(renderResultTile).join('')}
      </div>
    `
      return
    }

    els.canvasStatus.querySelector('span').textContent = ''
    els.canvasStatus.style.display = 'none'
    els.resultGrid.innerHTML = `
    <article class="result-frame">
      <img src="${activeItem.url}" alt="生成结果 ${activeItem.index + 1}" data-preview-src="${activeItem.url}" data-dimension-target="result-active" />
      <div class="result-meta">文字 / ${escapeHtml(sizeLabel)} / <span id="result-active">${escapeHtml(fallbackPixels)}</span></div>
      <div class="result-actions">
        <button type="button" data-copy="${activeItem.url}" title="复制">
          ${copyIcon()}
        </button>
        <a href="${activeItem.url}" download="image2svip-${Date.now()}-${activeItem.index + 1}.png" target="_blank" rel="noreferrer" title="下载">
          ${downloadIcon()}
        </a>
      </div>
    </article>
    ${
      totalCount > 1
        ? `
          <div class="result-switcher">
            ${items.map((item) => renderResultTile(item, activeItem)).join('')}
          </div>
        `
        : ''
    }
  `

    els.resultGrid.querySelectorAll('img[data-dimension-target]').forEach((image) => {
      image.addEventListener('load', () => {
        const target = document.querySelector(`#${image.dataset.dimensionTarget}`)
        if (target && image.naturalWidth && image.naturalHeight) {
          target.textContent = `${image.naturalWidth} x ${image.naturalHeight}`
        }
      })
    })
  }

  function renderResultTile(item, activeItem) {
    if (item.status === 'failed') {
      return `
      <button class="result-tile is-failed" type="button" disabled>
        <span class="result-fail-thumb">失败</span>
        <strong>第 ${item.index + 1} 张失败</strong>
      </button>
    `
    }

    return `
    <button class="result-tile ${activeItem && item.url === activeItem.url ? 'is-active' : ''}" type="button" data-result-url="${item.url}">
      <img src="${item.url}" alt="" />
      <strong>第 ${item.index + 1} 张</strong>
    </button>
  `
  }

  function errorMessageFromResponse(data, status) {
    const message =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      data?.detail?.error?.message ||
      data?.detail?.message ||
      data?.detail?.detail ||
      data?.detail ||
      `生成接口返回 ${status}`

    return typeof message === 'string' ? message : JSON.stringify(message)
  }

  // 直连上游 API（替代原 /api/generate 代理），请求体构造与 server.js 保持一致
  async function requestOneImage(snapshot, index) {
    const apiCfg = appConfig.api
    const content = [{ type: 'text', text: snapshot.prompt }]
    for (const image of (snapshot.images || []).slice(0, apiCfg.maxImages || 6)) {
      if (image && image.dataUrl) {
        content.push({ type: 'image_url', image_url: { url: image.dataUrl } })
      }
    }

    const requestBody = {
      model: snapshot.model,
      messages: [{ role: 'user', content }],
      stream: false
    }

    if (snapshot.size && snapshot.size !== 'auto') {
      requestBody.size = snapshot.size
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${snapshot.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(errorMessageFromResponse(data, response.status))
    }

    const urls = extractImageUrls(data)
    if (urls.length === 0) {
      throw new Error('接口返回成功，但未找到图像。')
    }

    return { index, status: 'success', url: urls[0] }
  }

  async function generate() {
    if (state.generating) return

    const snapshot = createGenerationSnapshot()

    if (!snapshot.apiKey) {
      toast('请先填写并保存 API Key。')
      els.apiKey.focus()
      return
    }

    if (!snapshot.prompt) {
      toast('请输入提示词。')
      els.prompt.focus()
      return
    }

    clearGenerationError()
    setGenerating(true)

    try {
      if (!db) await openDB()

      const total = snapshot.count
      let completed = 0
      const requests = Array.from({ length: total }, (_, index) =>
        requestOneImage(snapshot, index).finally(() => {
          completed += 1
          updateGenerationProgress(completed, total)
        })
      )
      const settled = await Promise.allSettled(requests)
      const results = settled.map((result, index) =>
        result.status === 'fulfilled'
          ? result.value
          : { index, status: 'failed', error: result.reason?.message || '生成失败' }
      )

      const savedResults = []
      for (const result of results) {
        if (result.url) {
          try {
            const localData = await downloadImage(result.url)
            const saved = await saveImageToDB(result.url, localData)
            savedResults.push({ ...result, imageId: saved.id, url: saved.localUrl, originalUrl: result.url })
          } catch (error) {
            savedResults.push(result)
          }
        } else {
          savedResults.push(result)
        }
      }

      const successItems = savedResults.filter((item) => item.url)
      const successUrls = successItems.map((item) => item.url)
      const errors = savedResults.filter((item) => item.status === 'failed').map((item) => item.error)

      if (errors.length > 0) {
        showGenerationError(errors[0])
      }

      renderResults(savedResults, { totalCount: total })
      saveHistory(successItems, snapshot.prompt)
      state.activeHistoryUrl = successUrls[0] || ''
      renderHistory()
      toast(successUrls.length ? '图像生成完成并已保存到本地。' : '生成失败。')
    } catch (error) {
      els.canvasStatus.querySelector('span').textContent = '生成失败'
      els.progressPill.innerHTML = sparkleIcon() + '<span>生成失败</span>'
      showGenerationError(error.message)
      toast(error.message)
    } finally {
      setGenerating(false)
    }
  }

  function saveHistory(items, prompt) {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const historyItems = items.map((item) => ({
      imageId: item.imageId || null,
      url: item.url,
      originalUrl: item.originalUrl || item.url,
      prompt,
      model: els.model.value,
      sizeLabel: selectedSizeLabel(),
      pixels: selectedSizePixels(),
      time
    }))

    state.history = [...historyItems, ...state.history].slice(0, 12)
    persistHistory()
  }

  // ---- 事件绑定 ----
  els.prompt.addEventListener('input', updateCount)

  els.saveKey.addEventListener('click', () => {
    const key = els.apiKey.value.trim()
    if (!key) {
      toast('请输入 API Key。')
      return
    }
    localStorage.setItem('image2svip.apiKey', key)
    setKeyStatus(true)
    toast('API Key 已保存。')
  })

  els.clearKey.addEventListener('click', () => {
    localStorage.removeItem('image2svip.apiKey')
    els.apiKey.value = ''
    setKeyStatus(false)
    toast('API Key 已清除。')
  })

  els.model.addEventListener('change', () => {
    localStorage.setItem('image2svip.model', els.model.value)
    renderPricing()
  })

  document.querySelectorAll('.control-header').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.closest('.control-group')
      const expanded = !group.classList.toggle('is-open')
      button.setAttribute('aria-expanded', String(!expanded))
    })
  })

  els.sizeOptions.addEventListener('click', (event) => {
    const button = event.target.closest('.option-tile')
    if (!button) return
    els.size.value = button.dataset.value
    localStorage.setItem('image2svip.size', els.size.value)
    syncOptionControls()
  })

  els.countOptions.addEventListener('click', (event) => {
    const button = event.target.closest('.option-tile')
    if (!button) return
    els.count.value = button.dataset.value
    localStorage.setItem('image2svip.count', els.count.value)
    syncOptionControls()
  })

  els.generate.addEventListener('click', generate)

  els.clearHistory.addEventListener('click', async () => {
    const imageIds = state.history.map((item) => item.imageId).filter(Boolean)
    if (!db && imageIds.length > 0) {
      try {
        await openDB()
      } catch (error) {
        console.warn('Failed to open IndexedDB while clearing history.', error)
      }
    }
    await Promise.all(imageIds.map((imageId) => deleteImageFromDB(imageId).catch(() => {})))
    state.history = []
    state.activeHistoryUrl = ''
    localStorage.setItem(HISTORY_STORAGE_KEY, '[]')
    renderHistory()
    toast('历史记录已清空。')
  })

  els.historyList.addEventListener('click', (event) => {
    const itemButton = event.target.closest('.history-item[data-history-index]')
    if (!itemButton) return
    const item = state.history[Number(itemButton.dataset.historyIndex)]
    if (!item) return
    state.activeHistoryUrl = item.url
    renderResults([item.url], {
      sizeLabel: item.sizeLabel || '智能',
      pixels: item.pixels || selectedSizePixels()
    })
    renderHistory()
  })

  els.dropZone.addEventListener('click', () => els.imageInput.click())
  els.imageInput.addEventListener('change', (event) => addFiles(event.target.files))

  for (const eventName of ['dragenter', 'dragover']) {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      els.dropZone.classList.add('dragging')
    })
  }

  for (const eventName of ['dragleave', 'drop']) {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      els.dropZone.classList.remove('dragging')
    })
  }

  els.dropZone.addEventListener('drop', (event) => {
    addFiles(event.dataTransfer.files)
  })

  els.resultGrid.addEventListener('click', async (event) => {
    const resultTile = event.target.closest('.result-tile[data-result-url]')
    if (resultTile) {
      const successItems = state.currentResults.filter((item) => item.url)
      const activeIndex = successItems.findIndex((item) => item.url === resultTile.dataset.resultUrl)
      renderResults(state.currentResults, {
        ...state.currentResultMeta,
        activeIndex: Math.max(0, activeIndex),
        totalCount: state.currentResults.length
      })
      return
    }

    const image = event.target.closest('img[data-preview-src]')
    if (image) {
      els.previewImage.src = image.dataset.previewSrc
      els.previewImage.alt = image.alt || '放大预览'
      els.imagePreviewModal.showModal()
      return
    }

    const button = event.target.closest('button[data-copy]')
    if (!button) return
    await navigator.clipboard.writeText(button.dataset.copy)
    toast('图像地址已复制。')
  })

  els.previewClose.addEventListener('click', () => {
    els.imagePreviewModal.close()
  })

  els.imagePreviewModal.addEventListener('click', (event) => {
    if (event.target === els.imagePreviewModal) {
      els.imagePreviewModal.close()
    }
  })

  els.imagePreviewModal.addEventListener('close', () => {
    els.previewImage.removeAttribute('src')
  })

  els.modelInfoButton.addEventListener('click', () => {
    renderPricing()
    els.modelModal.showModal()
  })

  const modelCloseButton = document.querySelector('.model-modal .modal-close')
  function closeModelModal(event) {
    event.preventDefault()
    event.stopPropagation()
    els.modelModal.close()
  }
  modelCloseButton.addEventListener('pointerdown', closeModelModal)
  modelCloseButton.addEventListener('click', closeModelModal)

  els.modelModal.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault()
    els.modelModal.close()
  })

  els.modelModal.addEventListener('click', (event) => {
    if (event.target === els.modelModal) {
      els.modelModal.close()
    }
  })

  els.modelModal.addEventListener('cancel', () => {
    els.modelModal.close()
  })

  document.querySelector('.copy-dot').addEventListener('click', async () => {
    await navigator.clipboard.writeText(els.model.value)
    toast('模型名已复制。')
  })

  init()
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" aria-label="访问配置">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <img src="/img/spark.svg" alt="" />
        </div>
        <div>
          <span id="brandEyebrow">FLOW API</span>
          <strong id="brandName">image2svip</strong>
        </div>
      </div>

      <section class="config-section">
        <h2>
          <svg viewBox="0 0 1024 1024" aria-hidden="true" class="yaoshi-icon">
            <path d="M630.646 348.503c-0.026 26.23 21.222 47.514 47.452 47.54s47.514-21.223 47.534-47.448v-0.092a47.493 47.493 0 1 0-94.986 0z" />
            <path d="M142.653 878.71V699.494l263.721-263.726-0.624-3.123a241.178 241.178 0 0 1-4.69-47.206c0-132.419 107.73-240.149 240.148-240.149 132.409 0 240.128 107.73 240.128 240.144 0 132.408-107.72 240.128-240.128 240.128-25.508 0-50.677-4.04-74.864-12.007l-7.808-2.575v2.483h-29.374v86.59h-85.499v86.574H357.08V878.7H142.653z m498.555-681.32c-103.69 0-188.047 84.357-188.047 188.043a188.32 188.32 0 0 0 4.675 41.748c3.84 16.901 0.727 30.095-9.519 40.335L194.755 721.065v105.544h110.213v-92.073h86.584v-86.574h85.494v-75.295c10.025-3.082 37.1-10.63 61.486-10.63 7.675 0 14.464 0.748 20.178 2.238 34.887 9.052 80.558 9.196 82.483 9.196 103.685 0 188.037-84.352 188.037-188.032 0.01-103.696-84.342-188.048-188.022-188.048z" />
          </svg>
          访问配置
        </h2>

        <label for="apiKey">API Key</label>
        <input id="apiKey" type="password" autocomplete="off" placeholder="sk-..." />

        <div class="field-row">
          <label for="model">模型</label>
          <button class="icon-button ghost small" id="modelInfoButton" title="查看模型信息" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 17v-5" />
              <path d="M12 8h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
        </div>
        <select id="model"></select>

        <div class="button-row">
          <button id="saveKey" class="button primary" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <path d="M17 21v-8H7v8" />
              <path d="M7 3v5h8" />
            </svg>
            保存
          </button>
          <button id="clearKey" class="button secondary" type="button">
            <svg viewBox="0 0 1024 1024" aria-hidden="true" class="clear-icon">
              <path d="M620.303059 216.124235l-312.440471 235.429647a26.352941 26.352941 0 0 0-4.608 37.647059l234.797177 289.882353a26.352941 26.352941 0 0 0 35.538823 5.029647l58.970353-41.020235 245.458824-184.952471a26.352941 26.352941 0 0 0 5.180235-36.924235l-226.002824-299.911529a26.352941 26.352941 0 0 0-36.894117-5.180236z m10.631529 57.916236l194.319059 257.837176-223.623529 168.538353-38.038589 26.443294-202.24-249.645176L630.964706 274.070588z" />
              <path d="M314.277647 446.735059l31.713882 42.074353L183.717647 611.087059l134.927059 179.049412h163.177412l60.235294-48.188236L575.006118 783.058824l-67.433412 54.031058a26.352941 26.352941 0 0 1-12.920471 5.541647l-3.553882 0.240942h-185.584941a26.352941 26.352941 0 0 1-18.763294-7.830589l-2.288942-2.710588-158.689882-210.55247a26.352941 26.352941 0 0 1 2.469647-34.575059l2.710588-2.349177 183.326118-138.119529z" />
              <path d="M858.352941 790.106353a26.352941 26.352941 0 0 1 3.312941 52.495059l-3.312941 0.210823H307.410824a26.352941 26.352941 0 0 1-3.312942-52.495059l3.312942-0.210823H858.352941z" />
            </svg>
            清除
          </button>
        </div>

        <p class="key-status" id="keyStatus">
          <svg viewBox="0 0 1024 1024" aria-hidden="true" class="yaoshi-icon">
            <path d="M630.646 348.503c-0.026 26.23 21.222 47.514 47.452 47.54s47.514-21.223 47.534-47.448v-0.092a47.493 47.493 0 1 0-94.986 0z" />
            <path d="M142.653 878.71V699.494l263.721-263.726-0.624-3.123a241.178 241.178 0 0 1-4.69-47.206c0-132.419 107.73-240.149 240.148-240.149 132.409 0 240.128 107.73 240.128 240.144 0 132.408-107.72 240.128-240.128 240.128-25.508 0-50.677-4.04-74.864-12.007l-7.808-2.575v2.483h-29.374v86.59h-85.499v86.574H357.08V878.7H142.653z m498.555-681.32c-103.69 0-188.047 84.357-188.047 188.043a188.32 188.32 0 0 0 4.675 41.748c3.84 16.901 0.727 30.095-9.519 40.335L194.755 721.065v105.544h110.213v-92.073h86.584v-86.574h85.494v-75.295c10.025-3.082 37.1-10.63 61.486-10.63 7.675 0 14.464 0.748 20.178 2.238 34.887 9.052 80.558 9.196 82.483 9.196 103.685 0 188.037-84.352 188.037-188.032 0.01-103.696-84.342-188.048-188.022-188.048z" />
          </svg>
          等待保存 Key
        </p>
      </section>

      <p class="buy-tip" id="apiKeyHelp">获取 API Key，可到<br />https://www.zyflow.cn</p>

      <button id="generate" class="generate-button" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 4V2" />
          <path d="M15 16v-2" />
          <path d="M8 9h2" />
          <path d="M20 9h2" />
          <path d="m17.8 6.2 1.4-1.4" />
          <path d="m10.8 13.2 1.4-1.4" />
          <path d="m17.8 11.8 1.4 1.4" />
          <path d="M3 21 14 10" />
        </svg>
        <span>生成图像</span>
      </button>
    </aside>

    <main class="workspace">
      <section class="prompt-section">
        <div class="section-title">
          <label for="prompt">提示词</label>
          <span id="counter">0 字</span>
        </div>
        <textarea id="prompt" placeholder="请输入你要生成的图像内容"></textarea>
      </section>

      <section class="drop-zone" id="dropZone">
        <input id="imageInput" type="file" accept="image/*" multiple />
        <div class="drop-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 5a2 2 0 0 1 2-2h5l2 3h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
            <path d="M12 11v6" />
            <path d="m9 14 3-3 3 3" />
          </svg>
        </div>
        <div>
          <strong>图生图 / 多图编辑</strong>
          <span>点击选择或拖拽图片到这里</span>
        </div>
      </section>

      <div class="thumb-strip" id="thumbStrip" hidden></div>
      <div class="generation-error" id="generationError" hidden></div>

      <section class="canvas-panel" aria-live="polite">
        <div class="canvas-grid" aria-hidden="true"></div>
        <div class="canvas-status" id="canvasStatus">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 4V2" />
            <path d="M15 16v-2" />
            <path d="M8 9h2" />
            <path d="M20 9h2" />
            <path d="m17.8 6.2 1.4-1.4" />
            <path d="m10.8 13.2 1.4-1.4" />
            <path d="m17.8 11.8 1.4 1.4" />
            <path d="M3 21 14 10" />
          </svg>
          <span>等待生成</span>
        </div>
        <div class="progress-pill" id="progressPill">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          </svg>
          <span>待生成</span>
        </div>
        <div class="result-grid" id="resultGrid"></div>
      </section>
    </main>

    <aside class="right-panel" aria-label="输出参数和历史记录">
      <section class="panel-section parameter-section">
        <h2>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 21v-7" />
            <path d="M4 10V3" />
            <path d="M12 21v-9" />
            <path d="M12 8V3" />
            <path d="M20 21v-5" />
            <path d="M20 12V3" />
            <path d="M2 14h4" />
            <path d="M10 8h4" />
            <path d="M18 16h4" />
          </svg>
          输出参数
        </h2>

        <div class="control-group is-open" data-control-group="size">
          <button class="control-header" type="button" aria-expanded="true">
            <span>
              <strong>尺寸</strong>
              <em id="sizeText">智能</em>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <div class="option-grid size-grid" id="sizeOptions"></div>
          <select id="size" aria-hidden="true" tabindex="-1"></select>
        </div>

        <div class="control-group is-open" data-control-group="count">
          <button class="control-header" type="button" aria-expanded="true">
            <span>
              <strong>数量</strong>
              <em id="countText">1 张</em>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <div class="option-grid count-grid" id="countOptions"></div>
          <select id="count" aria-hidden="true" tabindex="-1"></select>
        </div>
      </section>

      <section class="panel-section history-section">
        <div class="history-heading">
          <h2>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3v5h5" />
              <path d="M3.05 13A9 9 0 1 0 6 6.3L3 8" />
              <path d="M12 7v5l3 2" />
            </svg>
            历史记录
          </h2>
          <button id="clearHistory" type="button">清空</button>
        </div>
        <div class="history-list" id="historyList">
          <p>暂无图像</p>
        </div>
      </section>
    </aside>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <dialog class="model-modal" id="modelModal">
    <form method="dialog" class="modal-card">
      <button class="modal-close" value="close" aria-label="关闭" type="submit">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <header class="modal-header">
        <div class="openai-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2.5a4.5 4.5 0 0 1 4.42 3.68 4.5 4.5 0 0 1 2.1 8.07 4.5 4.5 0 0 1-6.52 6.14 4.5 4.5 0 0 1-6.42-3.58 4.5 4.5 0 0 1-.1-8.43A4.5 4.5 0 0 1 12 2.5Z" />
            <path d="M8.3 8.6 12 6.5l3.7 2.1v4.2L12 15l-3.7-2.2V8.6Z" />
          </svg>
        </div>
        <h2 id="modalModelName">codex-gpt-image-2</h2>
        <span class="copy-dot" title="复制模型名"></span>
      </header>

      <section class="model-block">
        <div class="block-heading">
          <span class="round-icon blue">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 17v-5" />
              <path d="M12 8h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <div>
            <h3>基本信息</h3>
            <p>模型的详细描述和基本特性</p>
          </div>
        </div>
        <p class="empty-desc">暂无模型描述</p>
      </section>

      <section class="model-block">
        <div class="block-heading">
          <span class="round-icon purple">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l1.88-1.88a5 5 0 0 0-7.08-7.08L11.26 5.66" />
              <path d="M14 11a5 5 0 0 0-7.54-.54L4.58 12.34a5 5 0 0 0 7.08 7.08l1.08-1.08" />
            </svg>
          </span>
          <div>
            <h3>API端点</h3>
            <p>模型支持的接口端点信息</p>
          </div>
        </div>
        <div class="endpoint-line">
          <span class="green-dot"></span>
          <span id="endpointProvider">openai:</span>
          <code id="endpointPath">/v1/chat/completions</code>
          <strong id="endpointMethod">POST</strong>
        </div>
      </section>

      <section class="model-block">
        <div class="block-heading">
          <span class="round-icon amber">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 10.5h7" />
              <path d="M9.5 13.5h5" />
              <path d="M12 7.5v9" />
            </svg>
          </span>
          <div>
            <h3>分组价格</h3>
            <p>不同用户分组的价格信息</p>
          </div>
        </div>
        <p class="route-line">auto分组调用链路 → <span>default分组</span></p>
        <div class="pricing-table" id="pricingTable"></div>
      </section>
    </form>
  </dialog>

  <dialog class="image-preview-modal" id="imagePreviewModal">
    <button class="preview-close" id="previewClose" type="button" aria-label="关闭预览">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
    <img id="previewImage" alt="放大预览" />
  </dialog>
</template>

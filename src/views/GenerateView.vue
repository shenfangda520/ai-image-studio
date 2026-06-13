<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useImageStore } from '@/stores/images'
import { useSettingsStore } from '@/stores/settings'
import { generateImage } from '@/services/api'
import {
  Upload,
  Sparkles,
  Wand2,
  Download,
  Heart,
  Copy,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Key,
  X,
  Eye,
  EyeOff,
  Hash
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const appStore = useAppStore()
const imageStore = useImageStore()
const settingsStore = useSettingsStore()

const prompt = ref('')
const selectedStyle = ref('tech')
const selectedScene = ref('gradient')
const count = ref(1)
const isDragging = ref(false)
const uploadedImage = ref<string | null>(null)
const uploadedImages = ref<{ name: string; dataUrl: string }[]>([])
const generatedImages = ref<string[]>([])
const errorMessage = ref('')
const showApiKeyModal = ref(false)
const tempApiKey = ref('')
const showApiKey = ref(false)
const isGeneratingCount = ref(0)

// Load template from localStorage on mount
onMounted(() => {
  const templateData = localStorage.getItem('ai-studio-template')
  if (templateData) {
    try {
      const data = JSON.parse(templateData)
      prompt.value = data.prompt || ''
      if (data.style) {
        selectedStyle.value = data.style
      }
      if (data.size) {
        settingsStore.setSize(data.size)
      }
    } catch {
      // ignore
    }
    localStorage.removeItem('ai-studio-template')
  }
})

const styles = [
  { id: 'tech', name: '科技风', colors: 'from-blue-500 to-purple-600', description: '适合电子产品、SaaS', promptPrefix: '科技感十足，未来主义风格，' },
  { id: 'minimal', name: '极简风', colors: 'from-gray-400 to-gray-600', description: '高端品牌、设计师', promptPrefix: '极简主义设计，大量留白，' },
  { id: 'apple', name: '苹果风', colors: 'from-gray-200 to-white', description: '3C产品、数码配件', promptPrefix: '苹果风格，简洁优雅，白底产品图，' },
  { id: 'xiaohongshu', name: '小红书风', colors: 'from-pink-400 to-orange-400', description: '美妆、服饰、生活', promptPrefix: '小红书风格，温暖色调，生活感，' },
  { id: 'guochao', name: '国潮风', colors: 'from-red-500 to-yellow-500', description: '中式餐饮、国货', promptPrefix: '国潮风格，传统元素现代化，红金配色，' },
  { id: 'ins', name: 'ins风', colors: 'from-amber-200 to-orange-300', description: '咖啡厅、轻食', promptPrefix: 'Instagram风格，莫兰迪色调，高级感，' },
]

const scenes = [
  { id: 'gradient', name: '渐变背景', icon: '🎨' },
  { id: 'geometric', name: '几何图形', icon: '📐' },
  { id: 'nature', name: '自然环境', icon: '🌿' },
  { id: 'abstract', name: '抽象艺术', icon: '🎭' },
  { id: 'solid', name: '纯色背景', icon: '⬛' },
  { id: 'lifestyle', name: '生活场景', icon: '☕' },
]

const sizes = [
  { id: 'auto', name: '智能', desc: '自动选择最佳尺寸' },
  { id: '1024x1024', name: '1:1 方图', desc: '1024×1024' },
  { id: '1536x1024', name: '3:2 横图', desc: '1536×1024' },
  { id: '1024x1536', name: '2:3 竖图', desc: '1024×1536' },
  { id: '1792x768', name: '21:9 超宽', desc: '1792×768' },
  { id: '1536x864', name: '16:9 横屏', desc: '1536×864' },
  { id: '1152x864', name: '4:3 横图', desc: '1152×864' },
  { id: '864x1152', name: '3:4 竖图', desc: '864×1152' },
  { id: '768x1792', name: '9:16 竖屏', desc: '768×1792' },
]

const models = [
  { id: 'codex-gpt-image-2', name: 'Codex GPT Image 2', desc: '默认模型' },
  { id: 'gpt-image-2', name: 'GPT Image 2', desc: '标准模型' },
]

const countOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const MULTI_IMAGE_CONCURRENCY = 2
const MAX_RETRY_COUNT = 2
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms))

const shouldRetry = (err: any) => {
  const status = Number(err?.status)
  return RETRYABLE_STATUS.has(status)
}

async function runWithConcurrency<T>(
  total: number,
  concurrency: number,
  task: (index: number) => Promise<T>
) {
  const results: PromiseSettledResult<T>[] = new Array(total)
  let nextIndex = 0

  const workers = Array.from({ length: Math.min(total, concurrency) }, async () => {
    while (nextIndex < total) {
      const currentIndex = nextIndex++

      try {
        results[currentIndex] = {
          status: 'fulfilled',
          value: await task(currentIndex),
        }
      } catch (reason) {
        results[currentIndex] = {
          status: 'rejected',
          reason,
        }
      }
    }
  })

  await Promise.all(workers)
  return results
}

const generateOneImage = async (fullPrompt: string, index: number) => {
  let lastError: any

  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
    try {
      return await generateImage(
        {
          apiKey: settingsStore.apiKey,
          prompt: fullPrompt,
          model: settingsStore.model,
          size: settingsStore.size,
          images: uploadedImages.value.length > 0 ? uploadedImages.value : undefined,
        },
        settingsStore.apiUrl
      )
    } catch (err: any) {
      lastError = err

      if (attempt >= MAX_RETRY_COUNT || !shouldRetry(err)) {
        break
      }

      await wait(700 * (attempt + 1) + index * 120)
    }
  }

  throw lastError
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

const handleFileInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

const handleFile = (file: File) => {
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      uploadedImage.value = dataUrl
      uploadedImages.value = [{ name: file.name, dataUrl }]
    }
    reader.readAsDataURL(file)
  }
}

const removeUploadedImage = () => {
  uploadedImage.value = null
  uploadedImages.value = []
}

const openApiKeyModal = () => {
  tempApiKey.value = settingsStore.apiKey
  showApiKeyModal.value = true
}

const saveApiKey = () => {
  settingsStore.setApiKey(tempApiKey.value)
  showApiKeyModal.value = false
}

const generateImages = async () => {
  if (!prompt.value && !uploadedImage.value) return

  if (!settingsStore.apiKey) {
    openApiKeyModal()
    return
  }

  errorMessage.value = ''
  generatedImages.value = []
  appStore.startGeneration()
  isGeneratingCount.value = 0

  try {
    const stylePrefix = styles.find(s => s.id === selectedStyle.value)?.promptPrefix || ''
    const fullPrompt = stylePrefix + prompt.value

    const results = await runWithConcurrency(
      count.value,
      MULTI_IMAGE_CONCURRENCY,
      async (index) => {
        try {
          return await generateOneImage(fullPrompt, index)
        } finally {
          isGeneratingCount.value++
          appStore.updateProgress(Math.round((isGeneratingCount.value / count.value) * 100))
        }
      }
    )

    const failures: string[] = []

    for (const result of results) {
      if (result.status === 'rejected') {
        failures.push(result.reason?.message || '生成失败')
        continue
      }

      generatedImages.value.push(...result.value.images)

      for (const url of result.value.images) {
        imageStore.addImage({
          url,
          prompt: prompt.value,
          style: selectedStyle.value,
          size: settingsStore.size,
          model: settingsStore.model,
        })
      }
    }

    if (failures.length > 0) {
      const successCount = generatedImages.value.length
      errorMessage.value = successCount > 0
        ? `已生成 ${successCount} 张，${failures.length} 张失败：${failures[0]}`
        : `生成失败：${failures[0]}`
    }
  } catch (err: any) {
    errorMessage.value = err.message || '生成失败，请重试'
  } finally {
    appStore.finishGeneration()
  }
}

const downloadImage = (url: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-image-${Date.now()}.png`
  a.click()
}

const copyPrompt = () => {
  navigator.clipboard.writeText(prompt.value)
}
</script>

<template>
  <div class="px-4 py-5 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-5 sm:mb-8 animate-in">
      <h1 class="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2">
        <span class="gradient-text">AI 图片生成</span>
      </h1>
      <p class="text-sm sm:text-base text-muted-foreground">上传产品图或输入描述，一键生成专业营销素材</p>
    </div>

    <!-- API Key Missing Banner -->
    <div
      v-if="!settingsStore.apiKey"
      class="glass-card mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
    >
        <div class="flex items-center gap-3">
          <Key class="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">请先配置 API Key</p>
            <p class="text-xs text-muted-foreground">需要 API Key 才能使用图片生成功能</p>
          </div>
        <button @click="openApiKeyModal" class="glass-button flex-shrink-0 text-sm">
          配置
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <Transition name="fade">
      <div
        v-if="errorMessage"
        class="glass-card mb-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30"
      >
        <div class="flex items-start gap-3">
          <X class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-sm min-w-0 flex-1 break-words">{{ errorMessage }}</p>
          <button @click="errorMessage = ''" class="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Left Panel - Input -->
      <div class="lg:col-span-2 space-y-4 sm:space-y-6">
        <!-- Prompt Input -->
        <div class="glass-card">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium">描述你想要的图片</label>
            <button
              v-if="prompt"
              @click="copyPrompt"
              class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Copy class="w-3 h-3" />
              复制
            </button>
          </div>
          <textarea
            v-model="prompt"
            placeholder="例如：科技感十足的手机产品图，蓝色渐变背景，光影效果..."
            class="glass-input min-h-[112px] sm:min-h-[120px] resize-none"
          />
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            提示：描述越详细，生成效果越好。可以包含风格、颜色、构图等信息。
          </p>
        </div>

        <!-- Upload Zone -->
        <div
          :class="cn(
            'upload-zone rounded-2xl p-4 sm:p-6 text-center transition-all duration-300',
            isDragging && 'border-primary bg-primary/5 scale-[1.02]'
          )"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <template v-if="!uploadedImage">
            <div class="w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
              <Upload class="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <p class="text-sm font-medium mb-1">拖拽图片到这里</p>
            <p class="text-xs text-muted-foreground mb-3">或点击选择文件（可选，用于参考图）</p>
            <label class="glass-button inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload class="w-4 h-4" />
              选择图片
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileInput"
              />
            </label>
          </template>

          <template v-else>
            <div class="relative inline-block">
              <img
                :src="uploadedImage"
                alt="Uploaded"
                class="max-h-40 sm:max-h-32 max-w-full rounded-xl mx-auto object-contain"
              />
              <button
                @click="removeUploadedImage"
                class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center text-white"
              >
                <span class="text-xs">×</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Model & Size Selection -->
        <div class="glass-card">
          <h3 class="text-sm font-medium mb-4">模型与尺寸</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label class="text-xs text-muted-foreground mb-2 block">模型</label>
              <select
                v-model="settingsStore.model"
                class="glass-input w-full"
              >
                <option v-for="m in models" :key="m.id" :value="m.id">
                  {{ m.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-2 block">尺寸</label>
              <select
                v-model="settingsStore.size"
                class="glass-input w-full"
              >
                <option v-for="s in sizes" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.desc }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Style Selection -->
        <div class="glass-card">
          <h3 class="text-sm font-medium mb-4">选择风格</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            <button
              v-for="style in styles"
              :key="style.id"
              @click="selectedStyle = style.id"
              :class="cn(
                'style-card p-3 sm:p-4 text-left',
                selectedStyle === style.id && 'selected'
              )"
            >
              <div
                :class="cn(
                  'w-full h-10 sm:h-12 rounded-lg mb-2 sm:mb-3 bg-gradient-to-br',
                  style.colors
                )"
              />
              <p class="font-medium text-sm">{{ style.name }}</p>
              <p class="text-xs text-muted-foreground leading-snug">{{ style.description }}</p>
            </button>
          </div>
        </div>

        <!-- Scene Selection -->
        <div class="glass-card">
          <h3 class="text-sm font-medium mb-4">选择场景</h3>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            <button
              v-for="scene in scenes"
              :key="scene.id"
              @click="selectedScene = scene.id"
              :class="cn(
                'style-card p-2.5 sm:p-3 text-center',
                selectedScene === scene.id && 'selected'
              )"
            >
              <span class="text-xl sm:text-2xl mb-1.5 sm:mb-2 block">{{ scene.icon }}</span>
              <p class="text-xs leading-tight">{{ scene.name }}</p>
            </button>
          </div>
        </div>

        <!-- Count Selection (Prominent) -->
        <div class="glass-card">
          <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
            <Hash class="w-4 h-4" />
            生成数量
          </h3>
          <div class="grid grid-cols-5 gap-1.5 sm:gap-2">
            <button
              v-for="n in countOptions"
              :key="n"
              @click="count = n"
              :class="cn(
                'min-h-11 py-2.5 sm:py-3 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200',
                count === n
                  ? 'bg-gradient-to-br from-primary to-pink-500 text-white shadow-lg shadow-primary/30'
                  : 'glass hover:bg-white/10'
              )"
            >
              {{ n }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-2 text-center">
            每张独立生成，共 {{ count }} 张
          </p>
        </div>

        <!-- Generate Button (Prominent) -->
        <button
          @click="generateImages"
          :disabled="appStore.isGenerating || (!prompt && !uploadedImage)"
          :class="cn(
            'w-full py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-300',
            'bg-gradient-to-r from-primary via-purple-500 to-pink-500',
            'hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-3',
            'shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40',
            'active:scale-[0.98]'
          )"
        >
          <template v-if="appStore.isGenerating">
            <Loader2 class="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            生成中 {{ isGeneratingCount }}/{{ count }}...
          </template>
          <template v-else>
            <Wand2 class="w-5 h-5 sm:w-6 sm:h-6" />
            开始生成
          </template>
        </button>

        <!-- Progress Bar -->
        <Transition name="fade">
          <div v-if="appStore.isGenerating" class="glass-card">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">生成进度</span>
              <span class="text-sm font-medium">{{ appStore.generationProgress }}%</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary to-pink-500 transition-all duration-300"
                :style="{ width: `${appStore.generationProgress}%` }"
              />
            </div>
          </div>
        </Transition>
      </div>

      <!-- Right Panel - Controls & Preview -->
      <div class="space-y-4 sm:space-y-6">
        <!-- Generated Images -->
        <div class="glass-card">
          <h3 class="text-sm font-medium mb-4 flex items-center gap-2">
            <ImageIcon class="w-4 h-4" />
            生成结果
            <span v-if="generatedImages.length > 0" class="badge badge-primary ml-auto">
              {{ generatedImages.length }} 张
            </span>
          </h3>

          <template v-if="generatedImages.length > 0">
            <div class="image-grid">
              <div
                v-for="(image, index) in generatedImages"
                :key="index"
                class="image-item aspect-square rounded-xl"
              >
                <img
                  :src="image"
                  alt="Generated"
                  class="w-full h-full object-cover"
                />
                <div class="overlay absolute inset-0 flex items-end p-2">
                  <div class="flex gap-1 w-full">
                    <button
                      @click="downloadImage(image)"
                      class="flex-1 glass-button text-xs flex items-center justify-center gap-1 py-1"
                    >
                      <Download class="w-3 h-3" />
                      下载
                    </button>
                    <button
                      @click="imageStore.toggleFavorite(imageStore.images[index]?.id)"
                      class="glass-button p-1.5"
                    >
                      <Heart class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="text-center py-8 text-muted-foreground">
              <ImageIcon class="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p class="text-sm">生成的图片将在这里显示</p>
            </div>
          </template>
        </div>

        <!-- Tips -->
        <div class="glass-card bg-gradient-to-br from-primary/10 to-pink-500/10">
          <h3 class="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            写作提示
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1">
            <li>• 描述具体的产品或场景</li>
            <li>• 指定颜色和风格偏好</li>
            <li>• 添加光影和构图细节</li>
            <li>• 可上传参考图获得更好效果</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- API Key Modal -->
    <Transition name="fade">
      <div
        v-if="showApiKeyModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-0"
        @click.self="showApiKeyModal = false"
      >
        <div class="glass-card w-full max-w-md max-h-[calc(100vh-1.5rem)] overflow-y-auto animate-in">
          <div class="flex items-center justify-between mb-5 sm:mb-6">
            <h2 class="text-lg font-semibold">配置 API Key</h2>
            <button @click="showApiKeyModal = false" class="text-muted-foreground hover:text-foreground">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">API Key</label>
              <div class="relative">
                <input
                  v-model="tempApiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="sk-..."
                  class="glass-input pr-10"
                />
                <button
                  @click="showApiKey = !showApiKey"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <EyeOff v-if="showApiKey" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <p class="text-xs text-muted-foreground">
              API Key 将保存在本地，不会上传到任何服务器。
            </p>

            <div class="flex gap-3">
              <button
                @click="showApiKeyModal = false"
                class="flex-1 glass-button"
              >
                取消
              </button>
              <button
                @click="saveApiKey"
                class="flex-1 glass-button bg-primary text-primary-foreground"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

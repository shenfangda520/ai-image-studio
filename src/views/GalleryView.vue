<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImageStore } from '@/stores/images'
import { useAppStore } from '@/stores/app'
import {
  Search,
  Grid,
  List,
  Heart,
  Download,
  Trash2,
  Check,
  X,
  Image as ImageIcon
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const imageStore = useImageStore()
const appStore = useAppStore()

const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const showFavoritesOnly = ref(false)
const sortBy = ref<'newest' | 'oldest'>('newest')

const filteredImages = computed(() => {
  let result = [...imageStore.images]

  if (searchQuery.value) {
    result = result.filter(img =>
      img.prompt.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (showFavoritesOnly.value) {
    result = result.filter(img => img.isFavorite)
  }

  result.sort((a, b) => {
    if (sortBy.value === 'newest') {
      return b.createdAt.getTime() - a.createdAt.getTime()
    }
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return result
})

const hasSelection = computed(() => imageStore.selectedImages.size > 0)

const downloadImage = (url: string, e?: Event) => {
  e?.stopPropagation()
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-image-${Date.now()}.png`
  a.click()
}

const goToGenerate = () => {
  appStore.setView('generate')
}
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 animate-in">
      <div>
        <h1 class="text-3xl font-bold mb-2">
          <span class="gradient-text">图片库</span>
        </h1>
        <p class="text-muted-foreground">管理和浏览所有生成的图片</p>
      </div>

      <!-- Selection Actions -->
      <Transition name="fade">
        <div v-if="hasSelection" class="flex items-center gap-3">
          <span class="text-sm text-muted-foreground">
            已选择 {{ imageStore.selectedImages.size }} 张
          </span>
          <button
            @click="imageStore.deleteSelected"
            class="glass-button text-destructive flex items-center gap-2"
          >
            <Trash2 class="w-4 h-4" />
            删除
          </button>
          <button
            @click="imageStore.clearSelection"
            class="glass-button flex items-center gap-2"
          >
            <X class="w-4 h-4" />
            取消
          </button>
        </div>
      </Transition>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索图片..."
          class="glass-input pl-10"
        />
      </div>

      <button
        @click="showFavoritesOnly = !showFavoritesOnly"
        :class="cn(
          'glass-button flex items-center gap-2',
          showFavoritesOnly && 'bg-primary/20 text-primary'
        )"
      >
        <Heart class="w-4 h-4" :fill="showFavoritesOnly ? 'currentColor' : 'none'" />
        收藏
      </button>

      <select
        v-model="sortBy"
        class="glass-input w-auto"
      >
        <option value="newest">最新</option>
        <option value="oldest">最早</option>
      </select>

      <div class="glass rounded-xl p-1 flex gap-1">
        <button
          @click="viewMode = 'grid'"
          :class="cn(
            'p-2 rounded-lg transition-all',
            viewMode === 'grid' ? 'bg-white/10' : 'hover:bg-white/5'
          )"
        >
          <Grid class="w-4 h-4" />
        </button>
        <button
          @click="viewMode = 'list'"
          :class="cn(
            'p-2 rounded-lg transition-all',
            viewMode === 'list' ? 'bg-white/10' : 'hover:bg-white/5'
          )"
        >
          <List class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Images Grid -->
    <template v-if="filteredImages.length > 0">
      <div
        :class="cn(
          viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'
        )"
      >
        <div
          v-for="image in filteredImages"
          :key="image.id"
          :class="cn(
            'group',
            viewMode === 'grid' ? 'image-item rounded-2xl' : 'glass-card flex items-center gap-4 p-4 rounded-2xl'
          )"
        >
          <!-- Selection Checkbox -->
          <button
            @click.stop="imageStore.toggleSelect(image.id)"
            :class="cn(
              'absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all z-10',
              'backdrop-blur-sm',
              imageStore.selectedImages.has(image.id)
                ? 'bg-primary text-white'
                : 'bg-black/30 text-white opacity-0 group-hover:opacity-100'
            )"
          >
            <Check v-if="imageStore.selectedImages.has(image.id)" class="w-4 h-4" />
          </button>

          <!-- Image -->
          <img
            :src="image.url"
            :alt="image.prompt"
            :class="cn(
              'object-cover',
              viewMode === 'grid' ? 'w-full aspect-square' : 'w-16 h-16 rounded-xl flex-shrink-0'
            )"
            @error="($event.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23374151%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-size=%2214%22%3E加载失败%3C/text%3E%3C/svg%3E'"
          />

          <!-- Info (List View) -->
          <div v-if="viewMode === 'list'" class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ image.prompt || '未命名' }}</p>
            <p class="text-xs text-muted-foreground">{{ image.style }} · {{ image.size || 'auto' }}</p>
          </div>

          <!-- Grid View Overlay -->
          <div
            v-if="viewMode === 'grid'"
            class="overlay"
          >
            <div class="flex gap-2 w-full">
              <button
                @click.stop="downloadImage(image.url)"
                class="flex-1 py-2 px-3 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-white/30 transition-colors"
              >
                <Download class="w-3 h-3" />
                下载
              </button>
              <button
                @click.stop="imageStore.toggleFavorite(image.id)"
                :class="cn(
                  'py-2 px-3 rounded-xl backdrop-blur-sm text-white transition-colors',
                  image.isFavorite ? 'bg-pink-500/80' : 'bg-white/20 hover:bg-white/30'
                )"
              >
                <Heart class="w-3 h-3" :fill="image.isFavorite ? 'currentColor' : 'none'" />
              </button>
              <button
                @click.stop="imageStore.deleteImage(image.id)"
                class="py-2 px-3 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/50 transition-colors"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- List View Actions -->
          <div v-if="viewMode === 'list'" class="flex gap-2 flex-shrink-0">
            <button
              @click.stop="imageStore.toggleFavorite(image.id)"
              :class="cn(
                'p-2 rounded-xl transition-colors',
                image.isFavorite ? 'text-pink-500' : 'text-muted-foreground hover:text-foreground'
              )"
            >
              <Heart class="w-4 h-4" :fill="image.isFavorite ? 'currentColor' : 'none'" />
            </button>
            <button
              @click.stop="downloadImage(image.url)"
              class="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download class="w-4 h-4" />
            </button>
            <button
              @click.stop="imageStore.deleteImage(image.id)"
              class="p-2 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <template v-else>
      <div class="glass-card text-center py-20 rounded-2xl">
        <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
          <ImageIcon class="w-10 h-10 text-primary/50" />
        </div>
        <h3 class="text-lg font-medium mb-2">暂无图片</h3>
        <p class="text-sm text-muted-foreground mb-6">
          {{ showFavoritesOnly ? '还没有收藏的图片' : '开始生成你的第一张图片吧' }}
        </p>
        <button
          @click="goToGenerate"
          class="glass-button bg-primary text-primary-foreground inline-flex items-center gap-2"
        >
          开始生成
        </button>
      </div>
    </template>
  </div>
</template>

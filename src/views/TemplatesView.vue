<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
  Megaphone,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const appStore = useAppStore()
const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = [
  { id: 'all', name: '全部', icon: Star },
  { id: 'ecommerce', name: '电商', icon: ShoppingBag },
  { id: 'retail', name: '实体店', icon: Store },
  { id: 'finance', name: '财经', icon: TrendingUp },
  { id: 'marketing', name: '营销', icon: Megaphone },
]

const templates = [
  {
    id: 1,
    name: '科技产品主图',
    category: 'ecommerce',
    preview: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    prompt: '科技感十足的产品展示，未来主义风格，蓝色渐变背景，光影效果',
    styles: ['科技风', '极简风'],
    size: '1024x1024',
    uses: 1234
  },
  {
    id: 2,
    name: '女装场景图',
    category: 'ecommerce',
    preview: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=400&fit=crop',
    prompt: '时尚女装展示，小红书风格，温暖色调，生活感强',
    styles: ['小红书风', 'ins风'],
    size: '1024x1024',
    uses: 987
  },
  {
    id: 3,
    name: '奶茶新品海报',
    category: 'retail',
    preview: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop',
    prompt: '奶茶新品宣传，清凉夏日风格，产品特写，诱人气泡效果',
    styles: ['小红书风', '国潮风'],
    size: '1024x1536',
    uses: 756
  },
  {
    id: 4,
    name: '房产宣传图',
    category: 'retail',
    preview: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=400&fit=crop',
    prompt: '高端房产宣传，极简风格，建筑美学，专业摄影感',
    styles: ['极简风', '科技风'],
    size: '1024x1536',
    uses: 543
  },
  {
    id: 5,
    name: '黄金行情封面',
    category: 'finance',
    preview: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=400&fit=crop',
    prompt: '黄金投资行情，金色主题，K线图元素，专业财经风格',
    styles: ['科技风', '极简风'],
    size: '1536x1024',
    uses: 2341
  },
  {
    id: 6,
    name: '美股收盘播报',
    category: 'finance',
    preview: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop',
    prompt: '美股市场分析，科技感界面，数据可视化，深色主题',
    styles: ['科技风', '极简风'],
    size: '1536x1024',
    uses: 1876
  },
  {
    id: 7,
    name: '促销活动海报',
    category: 'marketing',
    preview: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop',
    prompt: '限时促销活动，红黄配色，醒目标签，紧迫感设计',
    styles: ['促销风', '国潮风'],
    size: '1024x1536',
    uses: 3210
  },
  {
    id: 8,
    name: '品牌宣传图',
    category: 'marketing',
    preview: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=400&fit=crop',
    prompt: '品牌形象宣传，高端简约，留白设计，品质感',
    styles: ['极简风', '苹果风'],
    size: '1024x1536',
    uses: 1543
  },
]

const filteredTemplates = computed(() => {
  return templates.filter(t => {
    const matchesSearch = !searchQuery.value || t.name.includes(searchQuery.value)
    const matchesCategory = selectedCategory.value === 'all' || t.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const useTemplate = (template: typeof templates[0]) => {
  // Navigate to generate page and pre-fill the prompt
  appStore.setView('generate')
  // We'll emit an event or use a store to pass the template data
  // For now, store it in localStorage and the GenerateView will read it
  localStorage.setItem('ai-studio-template', JSON.stringify({
    prompt: template.prompt,
    style: template.styles[0] || 'tech',
    size: template.size,
  }))
  // Reload to pick up the template
  window.location.reload()
}
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8 animate-in">
      <h1 class="text-3xl font-bold mb-2">
        <span class="gradient-text">模板中心</span>
      </h1>
      <p class="text-muted-foreground">选择专业模板，快速生成营销素材</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4 mb-6">
      <div class="relative flex-1 min-w-[200px] max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索模板..."
          class="glass-input pl-10"
        />
      </div>

      <div class="flex gap-2 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            selectedCategory === cat.id
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'glass hover:bg-white/10'
          )"
        >
          <component :is="cat.icon" class="w-4 h-4 inline mr-1.5" />
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Templates Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card group rounded-2xl"
      >
        <!-- Preview Image -->
        <div class="relative aspect-[4/3] overflow-hidden">
          <img
            :src="template.preview"
            :alt="template.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            @error="($event.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%231f2937%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%22200%22 y=%22155%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-size=%2216%22%3E暂无预览%3C/text%3E%3C/svg%3E'"
          />

          <!-- Hover Overlay -->
          <div class="template-overlay">
            <button
              @click.stop="useTemplate(template)"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
            >
              <Sparkles class="w-4 h-4" />
              使用此模板
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Template Info -->
        <div class="p-4">
          <h3 class="font-semibold mb-2">{{ template.name }}</h3>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="style in template.styles"
              :key="style"
              class="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70"
            >
              {{ style }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              {{ template.size }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {{ template.uses.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <template v-if="filteredTemplates.length === 0">
      <div class="glass-card text-center py-20 rounded-2xl">
        <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
          <Search class="w-10 h-10 text-primary/50" />
        </div>
        <h3 class="text-lg font-medium mb-2">未找到模板</h3>
        <p class="text-sm text-muted-foreground">
          尝试调整搜索条件或选择其他分类
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  Image,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const appStore = useAppStore()

const navItems = [
  { id: 'generate' as const, label: '生成图片', icon: Sparkles },
  { id: 'gallery' as const, label: '图片库', icon: Image },
  { id: 'templates' as const, label: '模板', icon: Palette },
  { id: 'settings' as const, label: '设置', icon: Settings },
]

const isCollapsed = computed(() => appStore.sidebarCollapsed)
</script>

<template>
  <aside
    :class="cn(
      'mobile-tabbar fixed inset-x-0 bottom-0 glass border-t border-white/10 z-40 transition-all duration-300 flex flex-row',
      'md:inset-y-0 md:left-0 md:right-auto md:h-full md:border-t-0 md:border-r md:flex-col',
      isCollapsed ? 'md:w-[72px]' : 'md:w-[260px]'
    )"
  >
    <!-- Logo -->
    <div class="hidden h-16 md:flex items-center gap-3 px-4 border-b border-white/10">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
        <Zap class="w-5 h-5 text-white" />
      </div>
      <Transition name="fade">
        <div v-if="!isCollapsed" class="overflow-hidden">
          <h1 class="font-bold text-lg gradient-text">AI Studio</h1>
          <p class="text-xs text-muted-foreground">图片生成工具</p>
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="mobile-tabbar-nav md:flex-1 md:block md:p-3 md:space-y-1">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="appStore.setView(item.id)"
        :aria-label="item.label"
        :class="cn(
          'mobile-tabbar-item',
          appStore.currentView === item.id && 'active'
        )"
      >
        <component :is="item.icon" class="mobile-tabbar-icon md:w-5 md:h-5 md:flex-shrink-0" />
        <Transition name="fade">
          <span v-if="!isCollapsed" class="hidden md:inline whitespace-nowrap" aria-hidden="true">{{ item.label }}</span>
        </Transition>
        <span class="mobile-tabbar-label md:hidden">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Collapse Toggle -->
    <div class="hidden md:block p-3 border-t border-white/10">
      <button
        @click="appStore.toggleSidebar"
        class="sidebar-item w-full justify-center"
      >
        <ChevronRight
          v-if="isCollapsed"
          class="w-5 h-5"
        />
        <ChevronLeft
          v-else
          class="w-5 h-5"
        />
      </button>
    </div>
  </aside>
</template>

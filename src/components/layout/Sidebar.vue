<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  LayoutDashboard,
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
      'fixed left-0 top-0 h-full glass border-r border-white/10 z-40 transition-all duration-300 flex flex-col',
      isCollapsed ? 'w-[72px]' : 'w-[260px]'
    )"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center gap-3 px-4 border-b border-white/10">
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
    <nav class="flex-1 p-3 space-y-1">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="appStore.setView(item.id)"
        :class="cn(
          'sidebar-item w-full',
          appStore.currentView === item.id && 'active'
        )"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <Transition name="fade">
          <span v-if="!isCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
        </Transition>
      </button>
    </nav>

    <!-- Collapse Toggle -->
    <div class="p-3 border-t border-white/10">
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

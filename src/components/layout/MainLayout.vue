<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'
import { cn } from '@/lib/utils'

const appStore = useAppStore()

const mainPaddingLeft = computed(() => 
  appStore.sidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]'
)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Background Effects -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px]" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
    </div>

    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main
      :class="cn(
        'min-h-screen transition-all duration-300 relative',
        mainPaddingLeft
      )"
    >
      <slot />
    </main>
  </div>
</template>

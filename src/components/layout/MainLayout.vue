<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'
import { cn } from '@/lib/utils'

const appStore = useAppStore()

const mainPaddingLeft = computed(() => 
  appStore.sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'
)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Background Effects -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 left-1/4 w-56 h-56 md:w-96 md:h-96 bg-primary/10 rounded-full blur-[96px] md:blur-[128px]" />
      <div class="absolute bottom-0 right-1/4 w-56 h-56 md:w-96 md:h-96 bg-pink-500/10 rounded-full blur-[96px] md:blur-[128px]" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[600px] md:h-[600px] bg-purple-500/5 rounded-full blur-[120px] md:blur-[150px]" />
    </div>

    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main
      :class="cn(
        'min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0 transition-all duration-300 relative',
        mainPaddingLeft
      )"
    >
      <slot />
    </main>
  </div>
</template>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const currentView = ref<'generate' | 'gallery' | 'templates' | 'settings'>('generate')
  const isGenerating = ref(false)
  const generationProgress = ref(0)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setView = (view: typeof currentView.value) => {
    currentView.value = view
  }

  const startGeneration = () => {
    isGenerating.value = true
    generationProgress.value = 0
  }

  const updateProgress = (progress: number) => {
    generationProgress.value = progress
  }

  const finishGeneration = () => {
    isGenerating.value = false
    generationProgress.value = 100
  }

  return {
    sidebarCollapsed,
    currentView,
    isGenerating,
    generationProgress,
    toggleSidebar,
    setView,
    startGeneration,
    updateProgress,
    finishGeneration,
  }
})

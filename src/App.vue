<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import MainLayout from '@/components/layout/MainLayout.vue'
import GenerateView from '@/views/GenerateView.vue'
import GalleryView from '@/views/GalleryView.vue'
import TemplatesView from '@/views/TemplatesView.vue'
import SettingsView from '@/views/SettingsView.vue'

const appStore = useAppStore()

const currentView = computed(() => appStore.currentView)
</script>

<template>
  <MainLayout>
    <Transition name="fade" mode="out-in">
      <GenerateView v-if="currentView === 'generate'" />
      <GalleryView v-else-if="currentView === 'gallery'" />
      <TemplatesView v-else-if="currentView === 'templates'" />
      <SettingsView v-else-if="currentView === 'settings'" />
    </Transition>
  </MainLayout>
</template>

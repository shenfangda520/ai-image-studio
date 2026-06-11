import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'ai-studio-images';
const MAX_IMAGES = 50;

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  style: string
  size: string
  model: string
  createdAt: Date
  isFavorite: boolean
}

export const useImageStore = defineStore('images', () => {
  const images = ref<GeneratedImage[]>([])
  const selectedImages = ref<Set<string>>(new Set())

  const favoriteImages = computed(() =>
    images.value.filter(img => img.isFavorite)
  )

  const recentImages = computed(() =>
    [...images.value].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    ).slice(0, 20)
  )

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        images.value = data.map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt),
        }));
      }
    } catch {
      // ignore
    }
  }

  function saveToStorage() {
    try {
      // Only store metadata, not base64 images (too large)
      // Store a summary for recent images
      const toStore = images.value.slice(0, MAX_IMAGES).map(img => ({
        ...img,
        // Truncate large base64 data URLs for storage
        url: img.url.length > 1000 ? img.url.substring(0, 100) + '...' : img.url,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore
    }
  }

  // Load on init
  loadFromStorage();

  // Auto-save on changes
  watch(images, saveToStorage, { deep: true });

  const addImage = (image: Omit<GeneratedImage, 'id' | 'createdAt' | 'isFavorite'>) => {
    const newImage: GeneratedImage = {
      ...image,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isFavorite: false,
    }
    images.value.unshift(newImage)

    // Trim old images
    if (images.value.length > MAX_IMAGES) {
      images.value = images.value.slice(0, MAX_IMAGES);
    }

    return newImage
  }

  const toggleFavorite = (id: string) => {
    const image = images.value.find(img => img.id === id)
    if (image) {
      image.isFavorite = !image.isFavorite
    }
  }

  const deleteImage = (id: string) => {
    images.value = images.value.filter(img => img.id !== id)
    selectedImages.value.delete(id)
  }

  const toggleSelect = (id: string) => {
    if (selectedImages.value.has(id)) {
      selectedImages.value.delete(id)
    } else {
      selectedImages.value.add(id)
    }
  }

  const clearSelection = () => {
    selectedImages.value.clear()
  }

  const deleteSelected = () => {
    images.value = images.value.filter(img => !selectedImages.value.has(img.id))
    selectedImages.value.clear()
  }

  return {
    images,
    selectedImages,
    favoriteImages,
    recentImages,
    addImage,
    toggleFavorite,
    deleteImage,
    toggleSelect,
    clearSelection,
    deleteSelected,
  }
})

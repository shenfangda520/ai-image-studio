import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'ai-studio-settings';

export const useSettingsStore = defineStore('settings', () => {
  const apiKey = ref('');
  const apiUrl = ref('https://www.zyflow.cn/v1/chat/completions');
  const model = ref('codex-gpt-image-2');
  const size = ref('auto');
  const showApiKeyOnStart = ref(true);

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        apiKey.value = data.apiKey || '';
        apiUrl.value = data.apiUrl || 'https://www.zyflow.cn/v1/chat/completions';
        model.value = data.model || 'codex-gpt-image-2';
        size.value = data.size || 'auto';
        showApiKeyOnStart.value = data.showApiKeyOnStart !== false;
      }
    } catch {
      // ignore
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        apiKey: apiKey.value,
        apiUrl: apiUrl.value,
        model: model.value,
        size: size.value,
        showApiKeyOnStart: showApiKeyOnStart.value,
      }));
    } catch {
      // ignore
    }
  }

  // Load on init
  loadFromStorage();

  // Auto-save on changes
  watch([apiKey, apiUrl, model, size, showApiKeyOnStart], saveToStorage);

  function setApiKey(key: string) {
    apiKey.value = key;
  }

  function setApiUrl(url: string) {
    apiUrl.value = url;
  }

  function setModel(m: string) {
    model.value = m;
  }

  function setSize(s: string) {
    size.value = s;
  }

  return {
    apiKey,
    apiUrl,
    model,
    size,
    showApiKeyOnStart,
    setApiKey,
    setApiUrl,
    setModel,
    setSize,
    loadFromStorage,
    saveToStorage,
  }
})

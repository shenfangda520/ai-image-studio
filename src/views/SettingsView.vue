<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import {
  User,
  CreditCard,
  Bell,
  Palette,
  Globe,
  Shield,
  HelpCircle,
  Key,
  ChevronRight,
  Check,
  Eye,
  EyeOff
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const settingsStore = useSettingsStore()
const activeSection = ref('api')

const sections = [
  { id: 'api', name: 'API 设置', icon: Key },
  { id: 'profile', name: '个人信息', icon: User },
  { id: 'billing', name: '订阅管理', icon: CreditCard },
  { id: 'notifications', name: '通知设置', icon: Bell },
  { id: 'appearance', name: '外观设置', icon: Palette },
  { id: 'language', name: '语言设置', icon: Globe },
  { id: 'security', name: '安全设置', icon: Shield },
  { id: 'help', name: '帮助支持', icon: HelpCircle },
]

const showApiKey = ref(false)

const profile = ref({
  name: '用户',
  email: 'user@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
})

const subscription = ref({
  plan: 'free',
  expiresAt: '2024-12-31',
  usage: 0,
  limit: 10
})

const appearance = ref({
  theme: 'dark',
  accentColor: 'purple',
  compactMode: false,
  animations: true
})

const notifications = ref({
  email: true,
  push: true,
  marketing: false
})

const plans = [
  { id: 'free', name: '免费版', price: '0', features: ['每月10张', '基础风格', '标准分辨率'] },
  { id: 'professional', name: '专业版', price: '29', features: ['每月100张', '全部风格', '高清分辨率', '无水印'] },
  { id: 'enterprise', name: '企业版', price: '99', features: ['无限生成', '全部风格', '4K分辨率', 'API接口', '优先客服'] },
]

const accentColors = [
  { id: 'purple', color: 'bg-purple-500' },
  { id: 'blue', color: 'bg-blue-500' },
  { id: 'green', color: 'bg-green-500' },
  { id: 'pink', color: 'bg-pink-500' },
  { id: 'orange', color: 'bg-orange-500' },
]

const models = [
  { id: 'codex-gpt-image-2', name: 'Codex GPT Image 2', desc: '默认模型' },
  { id: 'gpt-image-2', name: 'GPT Image 2', desc: '标准模型' },
]

const sizes = [
  { id: 'auto', name: '智能', desc: '自动选择' },
  { id: '1024x1024', name: '1:1', desc: '1024×1024' },
  { id: '1536x1024', name: '3:2', desc: '1536×1024' },
  { id: '1024x1536', name: '2:3', desc: '1024×1536' },
  { id: '1792x768', name: '21:9', desc: '1792×768' },
  { id: '1536x864', name: '16:9', desc: '1536×864' },
  { id: '1152x864', name: '4:3', desc: '1152×864' },
  { id: '864x1152', name: '3:4', desc: '864×1152' },
  { id: '768x1792', name: '9:16', desc: '768×1792' },
]
</script>

<template>
  <div class="px-4 py-5 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-5 sm:mb-8 animate-in">
      <h1 class="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2">
        <span class="gradient-text">设置</span>
      </h1>
      <p class="text-sm sm:text-base text-muted-foreground">管理你的 API 配置和应用设置</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- Sidebar -->
      <div class="glass-card p-2">
        <nav class="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="activeSection = section.id"
            :class="cn(
              'sidebar-item flex-shrink-0 justify-center lg:w-full lg:justify-start',
              activeSection === section.id && 'active'
            )"
          >
            <component :is="section.icon" class="w-5 h-5" />
            <span class="whitespace-nowrap">{{ section.name }}</span>
            <ChevronRight class="hidden lg:block w-4 h-4 ml-auto opacity-50" />
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="lg:col-span-3">
        <!-- API Section -->
        <div v-if="activeSection === 'api'" class="space-y-4 sm:space-y-6">
          <!-- API Key -->
          <div class="glass-card">
            <h2 class="text-lg font-semibold mb-4">API Key</h2>
            <p class="text-sm text-muted-foreground mb-4">
              用于调用图片生成 API（OpenAI 兼容接口）
            </p>

            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium mb-2 block">API Key</label>
                <div class="relative">
                  <input
                    v-model="settingsStore.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    placeholder="sk-..."
                    class="glass-input pr-10"
                  />
                  <button
                    @click="showApiKey = !showApiKey"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <EyeOff v-if="showApiKey" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium mb-2 block">API 地址</label>
                <input
                  v-model="settingsStore.apiUrl"
                  type="url"
                  placeholder="https://api.example.com/v1/chat/completions"
                  class="glass-input"
                />
                <p class="text-xs text-muted-foreground mt-1">
                  默认为 OpenAI 兼容接口，可修改为其他兼容 API
                </p>
              </div>
            </div>
          </div>

          <!-- Default Model -->
          <div class="glass-card">
            <h2 class="text-lg font-semibold mb-4">默认模型</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="model in models"
                :key="model.id"
                @click="settingsStore.setModel(model.id)"
                :class="cn(
                  'glass-card p-4 text-left',
                  settingsStore.model === model.id && 'selected'
                )"
              >
                <p class="font-medium text-sm">{{ model.name }}</p>
                <p class="text-xs text-muted-foreground">{{ model.desc }}</p>
              </button>
            </div>
          </div>

          <!-- Default Size -->
          <div class="glass-card">
            <h2 class="text-lg font-semibold mb-4">默认尺寸</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <button
                v-for="size in sizes"
                :key="size.id"
                @click="settingsStore.setSize(size.id)"
                :class="cn(
                  'glass-card p-3 text-left',
                  settingsStore.size === size.id && 'selected'
                )"
              >
                <p class="font-medium text-sm">{{ size.name }}</p>
                <p class="text-xs text-muted-foreground">{{ size.desc }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Profile Section -->
        <div v-if="activeSection === 'profile'" class="glass-card">
          <h2 class="text-lg font-semibold mb-6">个人信息</h2>

          <div class="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
            <div class="relative">
              <img
                :src="profile.avatar"
                alt="Avatar"
                class="w-20 h-20 rounded-2xl"
              />
              <button class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                <span class="text-xs">📷</span>
              </button>
            </div>

            <div class="flex-1 space-y-4">
              <div>
                <label class="text-sm font-medium mb-2 block">姓名</label>
                <input
                  v-model="profile.name"
                  type="text"
                  class="glass-input"
                />
              </div>
              <div>
                <label class="text-sm font-medium mb-2 block">邮箱</label>
                <input
                  v-model="profile.email"
                  type="email"
                  class="glass-input"
                />
              </div>
            </div>
          </div>

          <button class="glass-button bg-primary text-primary-foreground">
            保存修改
          </button>
        </div>

        <!-- Billing Section -->
        <div v-if="activeSection === 'billing'" class="space-y-6">
          <div class="glass-card">
            <h2 class="text-lg font-semibold mb-4">当前订阅</h2>

            <div class="glass rounded-xl p-4 mb-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="font-medium">免费版</p>
                  <p class="text-sm text-muted-foreground">无需订阅</p>
                </div>
                <span class="badge badge-secondary">当前方案</span>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">本月使用量</span>
                  <span>{{ subscription.usage }}/{{ subscription.limit }} 张</span>
                </div>
                <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full"
                    :style="{ width: `${(subscription.usage / subscription.limit) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="glass-card">
            <h2 class="text-lg font-semibold mb-4">升级方案</h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                v-for="plan in plans"
                :key="plan.id"
                :class="cn(
                  'glass rounded-xl p-4 cursor-pointer transition-all duration-300',
                  subscription.plan === plan.id && 'ring-2 ring-primary'
                )"
              >
                <div class="flex items-center justify-between mb-4">
                  <p class="font-medium">{{ plan.name }}</p>
                  <div v-if="subscription.plan === plan.id" class="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check class="w-3 h-3 text-white" />
                  </div>
                </div>

                <p class="text-2xl font-bold mb-4">
                  ¥{{ plan.price }}<span class="text-sm font-normal text-muted-foreground">/月</span>
                </p>

                <ul class="space-y-2">
                  <li
                    v-for="feature in plan.features"
                    :key="feature"
                    class="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <Check class="w-4 h-4 text-primary" />
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Appearance Section -->
        <div v-if="activeSection === 'appearance'" class="glass-card">
          <h2 class="text-lg font-semibold mb-6">外观设置</h2>

          <div class="space-y-6">
            <div>
              <label class="text-sm font-medium mb-3 block">主题</label>
              <div class="flex gap-3">
                <button
                  @click="appearance.theme = 'dark'"
                  :class="cn(
                    'glass-button flex items-center gap-2',
                    appearance.theme === 'dark' && 'bg-primary/20 text-primary'
                  )"
                >
                  🌙 深色
                </button>
                <button
                  @click="appearance.theme = 'light'"
                  :class="cn(
                    'glass-button flex items-center gap-2',
                    appearance.theme === 'light' && 'bg-primary/20 text-primary'
                  )"
                >
                  ☀️ 浅色
                </button>
                <button
                  @click="appearance.theme = 'system'"
                  :class="cn(
                    'glass-button flex items-center gap-2',
                    appearance.theme === 'system' && 'bg-primary/20 text-primary'
                  )"
                >
                  💻 系统
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-3 block">强调色</label>
              <div class="flex gap-3">
                <button
                  v-for="color in accentColors"
                  :key="color.id"
                  @click="appearance.accentColor = color.id"
                  :class="cn(
                    'w-8 h-8 rounded-full transition-all duration-200',
                    color.color,
                    appearance.accentColor === color.id && 'ring-2 ring-offset-2 ring-offset-background ring-white scale-110'
                  )"
                />
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">紧凑模式</p>
                  <p class="text-sm text-muted-foreground">减小间距，显示更多内容</p>
                </div>
                <button
                  @click="appearance.compactMode = !appearance.compactMode"
                  :class="cn(
                    'w-12 h-6 rounded-full transition-all duration-200',
                    appearance.compactMode ? 'bg-primary' : 'bg-white/20'
                  )"
                >
                  <div
                    :class="cn(
                      'w-5 h-5 rounded-full bg-white transition-all duration-200',
                      appearance.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                    )"
                  />
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">动画效果</p>
                  <p class="text-sm text-muted-foreground">启用界面动画</p>
                </div>
                <button
                  @click="appearance.animations = !appearance.animations"
                  :class="cn(
                    'w-12 h-6 rounded-full transition-all duration-200',
                    appearance.animations ? 'bg-primary' : 'bg-white/20'
                  )"
                >
                  <div
                    :class="cn(
                      'w-5 h-5 rounded-full bg-white transition-all duration-200',
                      appearance.animations ? 'translate-x-6' : 'translate-x-0.5'
                    )"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications Section -->
        <div v-if="activeSection === 'notifications'" class="glass-card">
          <h2 class="text-lg font-semibold mb-6">通知设置</h2>

          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">邮件通知</p>
                <p class="text-sm text-muted-foreground">接收邮件更新和公告</p>
              </div>
              <button
                @click="notifications.email = !notifications.email"
                :class="cn(
                  'w-12 h-6 rounded-full transition-all duration-200',
                  notifications.email ? 'bg-primary' : 'bg-white/20'
                )"
              >
                <div
                  :class="cn(
                    'w-5 h-5 rounded-full bg-white transition-all duration-200',
                    notifications.email ? 'translate-x-6' : 'translate-x-0.5'
                  )"
                />
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">推送通知</p>
                <p class="text-sm text-muted-foreground">接收推送消息</p>
              </div>
              <button
                @click="notifications.push = !notifications.push"
                :class="cn(
                  'w-12 h-6 rounded-full transition-all duration-200',
                  notifications.push ? 'bg-primary' : 'bg-white/20'
                )"
              >
                <div
                  :class="cn(
                    'w-5 h-5 rounded-full bg-white transition-all duration-200',
                    notifications.push ? 'translate-x-6' : 'translate-x-0.5'
                  )"
                />
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">营销邮件</p>
                <p class="text-sm text-muted-foreground">接收产品更新和优惠信息</p>
              </div>
              <button
                @click="notifications.marketing = !notifications.marketing"
                :class="cn(
                  'w-12 h-6 rounded-full transition-all duration-200',
                  notifications.marketing ? 'bg-primary' : 'bg-white/20'
                )"
              >
                <div
                  :class="cn(
                    'w-5 h-5 rounded-full bg-white transition-all duration-200',
                    notifications.marketing ? 'translate-x-6' : 'translate-x-0.5'
                  )"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Other Sections -->
        <div v-if="['language', 'security', 'help'].includes(activeSection)" class="glass-card">
          <h2 class="text-lg font-semibold mb-6">{{ sections.find(s => s.id === activeSection)?.name }}</h2>
          <p class="text-muted-foreground">功能开发中，敬请期待...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<p align="center">
  <img src="src-tauri/icons/icon.png" width="120" alt="AI Image Studio">
</p>

<h1 align="center">AI Image Studio</h1>

<p align="center">
  基于 AI 的智能图片生成桌面应用，支持 Mac / Windows 双平台
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-1.6-blue?logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/Vue-3.4-green?logo=vue.js" alt="Vue">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## ✨ 功能特性

- 🎨 **AI 图片生成** — 输入描述或上传参考图，一键生成高质量营销素材
- 🖼️ **多风格支持** — 科技风、极简风、苹果风、小红书风、国潮风、ins 风
- 📐 **多尺寸适配** — 1:1 / 3:2 / 2:3 / 16:9 / 9:16 等 9 种比例
- 🔄 **批量生成** — 支持 1-10 张并行生成，效率倍增
- 📋 **模板中心** — 电商、实体店、财经、营销等行业模板，一键套用
- 💎 **现代 UI** — 玻璃态设计 + 深色主题，参考 Linear.app 设计语言
- 💾 **本地存储** — 图片历史和设置自动保存，重启不丢失

## 📸 截图

<p align="center">
  <img src="docs/screenshot-generate.png" width="800" alt="生成页面">
</p>

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) >= 1.70
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### 安装依赖

```bash
git clone https://github.com/YOUR_USERNAME/ai-image-studio.git
cd ai-image-studio
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建应用

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Tauri](https://tauri.app/) |
| 前端框架 | [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| 构建工具 | [Vite](https://vitejs.dev/) |
| UI 框架 | [Tailwind CSS](https://tailwindcss.com/) |
| 状态管理 | [Pinia](https://pinia.vuejs.org/) |
| 图标库 | [Lucide](https://lucide.dev/) |
| AI API | [zyflow.cn](https://www.zyflow.cn/) (OpenAI 兼容) |

## 📁 项目结构

```
ai-image-studio/
├── src/
│   ├── components/          # Vue 组件
│   │   └── layout/          # 布局组件
│   ├── views/               # 页面视图
│   │   ├── GenerateView     # 图片生成
│   │   ├── GalleryView      # 图片库
│   │   ├── TemplatesView    # 模板中心
│   │   └── SettingsView     # 设置
│   ├── stores/              # Pinia 状态管理
│   ├── services/            # API 服务
│   └── style.css            # 全局样式
├── src-tauri/               # Tauri 配置
├── public/                  # 静态资源
└── package.json
```

## ⚙️ 配置

首次使用需要配置 API Key：

1. 打开应用 → 设置 → API 设置
2. 输入从 [zyflow.cn](https://www.zyflow.cn) 获取的 API Key
3. API 地址默认为 `https://www.zyflow.cn/v1/chat/completions`，如使用其他兼容 API 可修改

## 📄 License

[MIT](LICENSE)

## 🙏 致谢

- [Tauri](https://tauri.app/) — 安全、快速、体积小的桌面应用框架
- [image2svip](https://github.com/) — API 集成参考
- [Linear](https://linear.app/) — UI 设计灵感

# MDEditor

[中文](#中文文档) | English

A lightweight, high-performance Markdown editor built with **Electron + React + Monaco Editor**, inspired by Typora, focusing on speed and user experience.

## Features

### Core Features

- **Multi-tab Editing** - Open and edit multiple Markdown files simultaneously
- **Three Editing Modes**
  - **WYSIWYG** - Real-time Markdown rendering, Typora-like editing experience
  - **Split View** - Source code on the left, live preview on the right
  - **Source Mode** - Pure source code editing for advanced users
- **Theme Switching** - Dark/Light themes with automatic persistence
- **File Operations** - New, Open, Save, Save As Markdown files
- **Export** - Export to HTML format with preserved styles

### Editor Features

- **Monaco Editor** - VS Code's editor core, excellent performance
- **Syntax Highlighting** - Full Markdown syntax highlighting support
- **Live Preview** - WYSIWYG editing experience
- **Auto Layout** - Editor automatically adapts to window size

### User Experience

- **Custom Title Bar** - Frameless window design, modern UI
- **Keyboard Shortcuts** - Complete keyboard shortcut support
- **Modification Indicator** - Unsaved file markers
- **Responsive Design** - Adapts to different screen sizes

## Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| Framework | Electron 30 | Cross-platform desktop app |
| Frontend | React 19 + TypeScript | Type-safe modern UI |
| Editor | Monaco Editor | VS Code's editor core |
| Parser | markdown-it | High-performance Markdown parsing |
| Build Tool | Vite 6 | Fast development experience |
| Testing | Vitest + Testing Library | Unit and component testing |

## Installation

### Requirements

- Node.js 18+
- npm 9+

### Clone & Install

```bash
git clone https://github.com/singlechenye/MDEidter.git
cd md-editor
npm install
```

## Usage

### Development

```bash
# Start Electron app (with React dev server)
npm run dev

# Or start web dev server only
npm run dev:react
```

### Build

```bash
# Build frontend assets
npm run build

# Build Electron installer
npm run build:electron
```

The installer will be in the `release/` directory.

### Testing

```bash
npm test
npm run test:run
npm run test:coverage
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New file/tab |
| `Ctrl + O` | Open file |
| `Ctrl + S` | Save file |
| `Ctrl + Shift + S` | Save as |
| `Ctrl + W` | Close current tab |
| `Ctrl + Tab` | Switch to next tab |
| `Ctrl + 1/2/3` | Switch editing mode |

## Project Structure

```
md-editor/
├── electron/           # Electron main process
│   ├── main.js        # Main window and IPC handling
│   └── preload.js     # Preload script (security bridge)
├── src/               # React frontend code
│   ├── components/    # React components
│   ├── types/         # TypeScript type definitions
│   ├── test/          # Test configuration
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry file
├── build/             # Build resources (icons)
├── public/            # Static assets
├── index.html         # HTML entry
└── package.json       # Project configuration
```

## License

MIT License

---

# 中文文档

一个基于 **Electron + React + Monaco Editor** 的轻量级、高性能 Markdown 编辑器，对标 Typora，专注于速度和用户体验。

## 功能特性

### 核心功能

- **多标签页编辑** - 同时打开和编辑多个 Markdown 文件
- **三种编辑模式**
  - **所见即所得 (WYSIWYG)** - 实时渲染 Markdown，类似 Typora 的编辑体验
  - **分栏模式** - 左侧编辑源码，右侧实时预览
  - **源码模式** - 纯源码编辑，适合高级用户
- **主题切换** - 暗色/亮色主题，自动持久化保存
- **文件操作** - 新建、打开、保存、另存为 Markdown 文件
- **导出功能** - 导出为 HTML 格式，保留样式

### 编辑器特性

- **Monaco Editor** - VS Code 同款编辑器内核，性能卓越
- **语法高亮** - 完整的 Markdown 语法高亮支持
- **实时预览** - 所见即所得的编辑体验
- **自动布局** - 编辑器自动适应窗口大小

### 用户体验

- **自定义标题栏** - 无边框窗口设计，现代化 UI
- **快捷键支持** - 完整的键盘快捷键操作
- **修改提示** - 未保存文件标记提示
- **响应式设计** - 适配不同屏幕尺寸

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 框架 | Electron 30 | 跨平台桌面应用 |
| 前端 | React 19 + TypeScript | 类型安全的现代化 UI |
| 编辑器 | Monaco Editor | VS Code 同款编辑器 |
| 解析器 | markdown-it | 高性能 Markdown 解析 |
| 构建工具 | Vite 6 | 极速开发体验 |
| 测试 | Vitest + Testing Library | 单元测试和组件测试 |

## 安装运行

### 环境要求

- Node.js 18+
- npm 9+

### 克隆安装

```bash
git clone https://github.com/singlechenye/MDEidter.git
cd md-editor
npm install
```

### 开发模式

```bash
# 启动 Electron 应用
npm run dev

# 或仅启动 Web 开发服务器
npm run dev:react
```

### 构建打包

```bash
# 构建前端资源
npm run build

# 构建 Electron 安装包
npm run build:electron
```

构建后的安装包位于 `release/` 目录。

### 运行测试

```bash
npm test
npm run test:run
npm run test:coverage
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建文件/标签页 |
| `Ctrl + O` | 打开文件 |
| `Ctrl + S` | 保存文件 |
| `Ctrl + Shift + S` | 另存为 |
| `Ctrl + W` | 关闭当前标签页 |
| `Ctrl + Tab` | 切换到下一个标签页 |
| `Ctrl + 1/2/3` | 切换编辑模式 |

## 项目结构

```
md-editor/
├── electron/           # Electron 主进程
│   ├── main.js        # 主窗口和 IPC 处理
│   └── preload.js     # 预加载脚本
├── src/               # React 前端代码
│   ├── components/    # React 组件
│   ├── types/         # TypeScript 类型定义
│   ├── test/          # 测试配置
│   ├── App.tsx        # 主应用组件
│   └── main.tsx       # 入口文件
├── build/             # 构建资源（图标）
├── public/            # 静态资源
└── package.json       # 项目配置
```

## 许可证

MIT License
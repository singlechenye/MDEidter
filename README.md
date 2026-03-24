# Markdown Editor

一个基于 **Electron + React + Monaco Editor** 的轻量级、高性能 Markdown 编辑器，对标 Typora，专注于速度和用户体验。

## 特性

### 核心功能

- **多标签页编辑** - 同时打开和编辑多个 Markdown 文件，支持标签页切换和关闭
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

## 安装

### 环境要求

- Node.js 18+
- npm 9+

### 克隆项目

```bash
git clone https://github.com/yourusername/md-editor.git
cd md-editor
```

### 安装依赖

```bash
npm install
```

## 运行

### 开发模式

```bash
# 启动 Electron 应用（同时启动 React 开发服务器）
npm run dev

# 或仅启动 Web 开发服务器
npm run dev:react
```

开发模式会同时启动：
- React 开发服务器 (Vite) - http://localhost:5173
- Electron 主进程（自动加载开发服务器）

### 构建生产版本

```bash
# 构建前端资源
npm run build

# 构建 Electron 安装包
npm run build:electron
```

构建后的安装包位于 `release/` 目录。

### 运行测试

```bash
# 运行测试
npm test

# 运行测试（单次执行）
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 功能说明

### 多标签页

- 点击标签栏右侧的 `+` 按钮或使用 `Ctrl+N` 新建标签页
- 点击标签页上的 `×` 按钮或使用 `Ctrl+W` 关闭当前标签页
- 使用 `Ctrl+Tab` 在标签页之间切换
- 未保存的文件会显示修改标记（圆点）

### 编辑模式

| 模式 | 说明 |
|------|------|
| **所见即所得** | 实时渲染 Markdown，提供类似 Typora 的沉浸式编辑体验 |
| **分栏** | 左侧显示源码编辑器，右侧显示渲染预览，适合对照编辑 |
| **源码** | 仅显示源码编辑器，适合高级用户和复杂格式调整 |

### 主题切换

- 点击工具栏右侧的太阳/月亮图标切换主题
- 主题选择会自动保存到本地存储
- 支持暗色主题和亮色主题

### 文件操作

- **新建文件** - 创建新的空白 Markdown 文档
- **打开文件** - 支持打开单个或多个 `.md` / `.markdown` 文件
- **保存文件** - 保存当前文件（Web 环境会下载文件）
- **另存为** - 将文件保存到新位置

### 导出 HTML

点击工具栏中的 "HTML" 按钮可将当前文档导出为独立的 HTML 文件，包含完整的样式，可直接在浏览器中查看。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建文件/标签页 |
| `Ctrl + O` | 打开文件 |
| `Ctrl + S` | 保存文件 |
| `Ctrl + Shift + S` | 另存为 |
| `Ctrl + W` | 关闭当前标签页 |
| `Ctrl + Tab` | 切换到下一个标签页 |
| `Tab` | 插入空格（在编辑器中） |

## 项目结构

```
md-editor/
├── electron/                 # Electron 主进程
│   ├── main.js              # 主窗口和 IPC 处理
│   └── preload.js           # 预加载脚本（安全桥接）
├── src/                     # React 前端代码
│   ├── components/          # React 组件
│   │   ├── Icons.tsx        # SVG 图标组件
│   │   ├── MonacoEditor.tsx # Monaco 编辑器封装
│   │   ├── PreviewPane.tsx  # Markdown 预览面板
│   │   ├── TabBar.tsx       # 标签栏组件
│   │   ├── TitleBar.tsx     # 自定义标题栏
│   │   ├── Toolbar.tsx      # 工具栏组件
│   │   ├── WysiwygEditor.tsx# 所见即所得编辑器
│   │   └── __tests__/       # 组件测试
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # 接口和类型
│   ├── test/                # 测试配置
│   ├── App.tsx              # 主应用组件
│   ├── App.css              # 应用样式
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── docs/                    # 文档
│   ├── ARCHITECTURE.md      # 架构设计
│   ├── API.md               # 组件 API
│   └── CONTRIBUTING.md      # 贡献指南
├── public/                  # 静态资源
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置
├── vitest.config.ts         # 测试配置
├── tsconfig.json            # TypeScript 配置
├── eslint.config.js         # ESLint 配置
└── package.json             # 项目配置
```

## 开发指南

### 代码规范

- 使用 TypeScript 编写代码，确保类型安全
- 组件使用函数式组件和 Hooks
- 遵循 ESLint 规则进行代码检查

### 添加新组件

1. 在 `src/components/` 目录下创建新组件文件
2. 在 `src/components/index.ts` 中导出组件
3. 在 `src/types/index.ts` 中定义 Props 接口
4. 在 `src/components/__tests__/` 中添加测试

### 添加新的 IPC 通信

1. 在 `electron/main.js` 中添加 IPC handler
2. 在 `electron/preload.js` 中暴露 API
3. 在 `src/types/index.ts` 中更新 `electronAPI` 接口

### 调试技巧

- **开发工具**: 开发模式下自动打开 DevTools
- **React DevTools**: 安装浏览器扩展进行调试
- **Electron DevTools**: 使用 `--inspect` 标志调试主进程

## 性能优化

1. **防抖解析** - Markdown 解析使用 150ms 防抖，避免频繁重绘
2. **虚拟滚动** - Monaco Editor 内置虚拟滚动，支持大文件编辑
3. **按需渲染** - 只在内容变化时重新解析 Markdown
4. **Web Worker** - Monaco Editor 使用 Web Worker 处理语法分析
5. **自动布局** - 编辑器自动适应窗口大小，无需手动调整

## 浏览器模式

如果 Electron 依赖下载遇到问题，可以仅使用浏览器模式开发：

```bash
npm run dev:react
```

然后访问 http://localhost:5173。浏览器模式下：
- 文件操作会使用浏览器的文件选择器和下载功能
- 窗口控制按钮不会显示

## 许可证

MIT License

## 致谢

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code 同款编辑器
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://react.dev/) - 用户界面库
- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown 解析器
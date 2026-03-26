# MDEditor 开发文档

> 本文档面向参与项目开发的工程师，包含技术选型、架构设计、开发准则等核心内容。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [架构设计](#3-架构设计)
4. [开发准则](#4-开发准则)
5. [代码规范](#5-代码规范)
6. [目录结构](#6-目录结构)
7. [核心模块](#7-核心模块)
8. [开发流程](#8-开发流程)
9. [构建部署](#9-构建部署)
10. [常见问题](#10-常见问题)

---

## 1. 项目概述

### 1.1 项目定位

MDEditor 是一款轻量级、高性能的 Markdown 桌面编辑器，对标 Typora，专注于：

- **速度**：快速启动、流畅编辑
- **体验**：所见即所得的编辑模式
- **简洁**：无干扰的写作环境

### 1.2 核心功能

| 功能 | 描述 |
|------|------|
| 多标签页 | 同时编辑多个文件 |
| 三种编辑模式 | WYSIWYG / 分栏 / 源码 |
| 主题切换 | 暗色 / 亮色 |
| 文件操作 | 新建、打开、保存、另存为 |
| 导出功能 | HTML、PDF |

### 1.3 目标用户

- 技术文档编写者
- 博客作者
- 笔记爱好者
- 需要轻量级 Markdown 工具的用户

---

## 2. 技术选型

### 2.1 技术栈总览

```
┌─────────────────────────────────────────────────────────┐
│                    MDEditor 技术栈                       │
├─────────────────────────────────────────────────────────┤
│  框架层    │  Electron 30 + React 19 + TypeScript       │
├─────────────────────────────────────────────────────────┤
│  编辑器    │  Monaco Editor + CodeMirror 6              │
├─────────────────────────────────────────────────────────┤
│  解析器    │  markdown-it                               │
├─────────────────────────────────────────────────────────┤
│  构建工具  │  Vite 6                                    │
├─────────────────────────────────────────────────────────┤
│  测试框架  │  Vitest + Testing Library                  │
├─────────────────────────────────────────────────────────┤
│  打包工具  │  electron-builder                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 选型理由

#### Electron 30

| 优点 | 说明 |
|------|------|
| 跨平台 | 一套代码，支持 Windows/macOS/Linux |
| 生态成熟 | 丰富的 Node.js 生态 |
| 原生能力 | 文件系统、系统对话框、PDF 导出 |
| 版本稳定 | 30.x 是长期支持版本 |

**为什么选择 Electron 而非 Tauri？**
- Electron 生态更成熟，文档更完善
- 团队对 Electron 更熟悉
- 打包工具链更稳定

#### React 19

| 优点 | 说明 |
|------|------|
| 组件化 | UI 拆分清晰，复用性强 |
| Hooks | 函数式组件，状态管理简洁 |
| 生态丰富 | 大量第三方库支持 |
| 性能优化 | 自动批处理、并发渲染 |

**为什么选择 React 而非 Vue？**
- Monaco Editor 有官方 React 封装
- React 的函数式风格更适合编辑器场景
- 团队技术栈统一

#### TypeScript

| 优点 | 说明 |
|------|------|
| 类型安全 | 编译时发现错误 |
| IDE 支持 | 智能提示、重构支持 |
| 代码文档 | 类型即文档 |
| 可维护性 | 大型项目必备 |

#### Monaco Editor

| 优点 | 说明 |
|------|------|
| VS Code 同款 | 成熟稳定，性能卓越 |
| 语法高亮 | 内置 Markdown 支持 |
| 自定义能力强 | 主题、语言、快捷键 |
| Web Worker | 大文件编辑不卡顿 |

**为什么同时引入 CodeMirror 6？**
- WYSIWYG 模式使用 CodeMirror 6，更轻量
- 源码模式使用 Monaco Editor，功能更强大
- 各取所长，优化用户体验

#### Vite 6

| 优点 | 说明 |
|------|------|
| 极速启动 | 原生 ESM，无需打包 |
| 热更新 | 毫秒级 HMR |
| 配置简单 | 开箱即用 |
| 生态完善 | 插件丰富 |

**为什么选择 Vite 而非 Webpack？**
- 开发体验更好，启动更快
- 配置更简洁
- React 官方推荐

### 2.3 依赖版本

```json
{
  "electron": "^30.5.1",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "monaco-editor": "^0.52.2",
  "@monaco-editor/react": "^4.7.0",
  "@codemirror/view": "^6.40.0",
  "markdown-it": "^14.1.0",
  "vite": "^6.0.11",
  "typescript": "^5.7.2",
  "vitest": "^4.1.1"
}
```

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Toolbar │ │ TabBar  │ │ Editor  │ │ Preview │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│                        状态管理层                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React State (useState + useCallback + useRef)      │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        业务逻辑层                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ FileHandler  │ │ EditorManager│ │ ThemeManager │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                        IPC 通信层                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  preload.js (contextBridge) ←→ main.js (ipcMain)   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        原生能力层                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 文件系统  │ │ 对话框   │ │ 窗口控制 │ │ PDF 导出 │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 进程模型

Electron 采用多进程架构：

```
┌─────────────────────────────────────────────────────────┐
│                    主进程 (Main Process)                 │
│  - electron/main.js                                     │
│  - 管理窗口生命周期                                       │
│  - 处理 IPC 请求                                         │
│  - 原生 API 调用                                         │
└───────────────────────┬─────────────────────────────────┘
                        │ IPC 通信
┌───────────────────────┴─────────────────────────────────┐
│                   渲染进程 (Renderer Process)            │
│  - React 应用                                           │
│  - 用户界面渲染                                          │
│  - 用户交互处理                                          │
│  - 通过 preload.js 与主进程通信                          │
└─────────────────────────────────────────────────────────┘
```

### 3.3 数据流

```
用户操作 → React Event Handler → State 更新 → UI 重渲染
                ↓
           调用 electronAPI
                ↓
           IPC 通信 (preload.js)
                ↓
           主进程处理 (main.js)
                ↓
           返回结果 → State 更新 → UI 重渲染
```

### 3.4 编辑模式架构

```
┌─────────────────────────────────────────────────────────┐
│                     EditMode 状态                        │
│         'wysiwyg' | 'split' | 'source'                  │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   WYSIWYG     │ │    Split      │ │    Source     │
│ CodeMirror 6  │ │ Monaco+Preview│ │ Monaco Editor │
│   实时渲染     │ │   左右分栏    │ │   纯源码      │
└───────────────┘ └───────────────┘ └───────────────┘
```

---

## 4. 开发准则

### 4.1 核心原则

#### 1. 性能优先

- **防抖处理**：频繁操作使用防抖（如 Markdown 解析 150ms）
- **虚拟滚动**：大文件编辑依赖编辑器内置虚拟滚动
- **按需渲染**：只在内容变化时重新解析
- **Web Worker**：Monaco Editor 使用 Web Worker 处理语法分析

```typescript
// ✅ 正确：使用 useCallback 避免不必要的重渲染
const updateTabContent = useCallback((id: string, content: string) => {
  setTabs(prev => prev.map(tab =>
    tab.id === id ? { ...tab, content, isModified: true } : tab
  ));
}, []);

// ❌ 错误：每次渲染都创建新函数
const updateTabContent = (id: string, content: string) => {
  setTabs(prev => prev.map(tab =>
    tab.id === id ? { ...tab, content, isModified: true } : tab
  ));
};
```

#### 2. 类型安全

- 所有函数必须有明确的参数和返回类型
- 避免使用 `any`，必要时使用 `unknown`
- 使用 TypeScript 严格模式

```typescript
// ✅ 正确：明确的类型定义
interface Tab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  isModified: boolean;
}

// ❌ 错误：使用 any
function updateTab(tab: any) { ... }
```

#### 3. 组件化

- 单一职责：每个组件只做一件事
- 组件粒度：可复用、可测试
- Props 向下，事件向上

```typescript
// ✅ 正确：组件职责单一
interface ToolbarProps {
  theme: Theme;
  editMode: EditMode;
  onThemeChange: (theme: Theme) => void;
  onEditModeChange: (mode: EditMode) => void;
}

// ❌ 错误：组件过于庞大
interface AppProps {
  // 包含所有状态和方法...
}
```

#### 4. 安全性

- 主进程验证所有 IPC 输入
- 渲染进程不直接访问 Node.js
- 使用 `contextIsolation: true`

```javascript
// main.js - 验证输入
ipcMain.handle('read-file', async (event, filePath) => {
  // 验证文件路径
  if (!filePath || typeof filePath !== 'string') {
    return { success: false, error: 'Invalid file path' };
  }
  // ...
});
```

### 4.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `TabBar`, `Toolbar` |
| 函数 | camelCase | `handleOpenFile`, `updateTabContent` |
| 常量 | UPPER_SNAKE_CASE | `MAX_TABS`, `DEFAULT_THEME` |
| 类型/接口 | PascalCase | `Tab`, `Theme`, `EditMode` |
| 文件名 | PascalCase (组件) | `TabBar.tsx` |
| 文件名 | camelCase (工具) | `editorManager.ts` |
| CSS 类 | kebab-case | `tab-bar`, `floating-toolbar` |

### 4.3 文件组织

```
每个组件目录结构：
components/
├── ComponentName.tsx      # 组件实现
├── ComponentName.test.tsx # 组件测试（可选，也可放在 __tests__）
└── __tests__/             # 测试文件目录
    └── ComponentName.test.tsx
```

---

## 5. 代码规范

### 5.1 TypeScript 规范

```typescript
// ✅ 推荐：使用接口定义 Props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ✅ 推荐：使用类型别名定义联合类型
type Theme = 'light' | 'dark';
type EditMode = 'wysiwyg' | 'split' | 'source';

// ✅ 推荐：使用可选链和空值合并
const title = tab?.title ?? 'Untitled';

// ✅ 推荐：使用 const 断言
const THEMES = ['light', 'dark'] as const;
```

### 5.2 React 规范

```typescript
// ✅ 推荐：函数式组件 + Hooks
function TabBar({ tabs, activeId, onTabClick }: TabBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // 使用 useCallback 优化回调
  const handleClick = useCallback((id: string) => {
    onTabClick(id);
  }, [onTabClick]);
  
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <Tab key={tab.id} tab={tab} onClick={handleClick} />
      ))}
    </div>
  );
}

// ❌ 避免：类组件
class TabBar extends React.Component { ... }
```

### 5.3 CSS 规范

```css
/* ✅ 推荐：使用 CSS 变量 */
:root {
  --bg-primary: #1e2028;
  --text-primary: #d4d4d4;
  --accent-color: #818cf8;
}

/* ✅ 推荐：BEM 命名 */
.tab-bar { }
.tab-bar__item { }
.tab-bar__item--active { }

/* ✅ 推荐：使用 CSS 变量实现主题 */
.dark {
  --bg-primary: #1e2028;
  --text-primary: #d4d4d4;
}

.light {
  --bg-primary: #ffffff;
  --text-primary: #333333;
}
```

### 5.4 注释规范

```typescript
/**
 * 更新标签页内容
 * @param id - 标签页 ID
 * @param content - 新的 Markdown 内容
 * @param isModified - 是否标记为已修改，默认 true
 */
const updateTabContent = useCallback((
  id: string,
  content: string,
  isModified: boolean = true
) => {
  // 实现逻辑...
}, []);

// 单行注释：解释复杂逻辑
// 使用防抖避免频繁解析
const debouncedParse = useMemo(
  () => debounce(parseMarkdown, 150),
  []
);
```

---

## 6. 目录结构

```
md-editor/
├── electron/                    # Electron 主进程
│   ├── main.js                 # 主进程入口
│   │                           # - 创建窗口
│   │                           # - IPC 处理
│   │                           # - 文件操作
│   │                           # - 窗口控制
│   │                           # - PDF 导出
│   └── preload.js              # 预加载脚本
│                               # - 暴露安全 API 给渲染进程
│
├── src/                        # React 前端代码
│   ├── components/             # React 组件
│   │   ├── Icons.tsx          # SVG 图标组件
│   │   ├── Toolbar.tsx        # 工具栏
│   │   ├── TabBar.tsx         # 标签栏
│   │   ├── TitleBar.tsx       # 标题栏（窗口控制）
│   │   ├── MonacoEditor.tsx   # Monaco 编辑器封装
│   │   ├── WysiwygEditor.tsx  # 所见即所得编辑器
│   │   ├── PreviewPane.tsx    # Markdown 预览面板
│   │   ├── CommandPalette.tsx # 命令面板（Ctrl+P）
│   │   ├── ShortcutHelp.tsx   # 快捷键帮助
│   │   ├── SideDrawer.tsx     # 侧边抽屉
│   │   ├── index.ts           # 组件导出
│   │   └── __tests__/         # 组件测试
│   │
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts           # 所有类型和接口
│   │
│   ├── utils/                  # 工具函数
│   │   └── editorManager.ts   # 编辑器实例管理
│   │
│   ├── test/                   # 测试配置
│   │   └── setup.ts           # Vitest 设置
│   │
│   ├── assets/                 # 静态资源
│   │
│   ├── App.tsx                 # 主应用组件
│   ├── App.css                 # 应用样式
│   ├── main.tsx                # 入口文件
│   └── index.css               # 全局样式
│
├── build/                      # 构建资源
│   ├── icon.ico               # Windows 图标
│   ├── icon.svg               # 图标源文件
│   └── icon-*.png             # 各尺寸图标
│
├── public/                     # 公共静态资源
│   ├── favicon.svg
│   └── icons.svg
│
├── release/                    # 打包输出（不提交）
│   └── win-unpacked/
│
├── scripts/                    # 构建脚本
│   └── generate-icon.js       # 图标生成脚本
│
├── index.html                  # HTML 入口
├── vite.config.ts              # Vite 配置
├── vitest.config.ts            # 测试配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.app.json           # 应用 TS 配置
├── tsconfig.node.json          # Node TS 配置
├── eslint.config.js            # ESLint 配置
├── package.json                # 项目配置
├── .gitignore                  # Git 忽略规则
└── README.md                   # 项目说明
```

---

## 7. 核心模块

### 7.1 主进程 (electron/main.js)

#### 窗口创建

```javascript
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,              // 无边框窗口
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,  // 安全：禁用 Node 集成
      contextIsolation: true,  // 安全：启用上下文隔离
    },
  });
}
```

#### IPC 处理

```javascript
// 文件读取
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 窗口控制
ipcMain.handle('window-maximize', () => {
  if (global.mainWindow.isMaximized()) {
    global.mainWindow.unmaximize();
    return false;
  } else {
    global.mainWindow.maximize();
    return true;
  }
});
```

### 7.2 预加载脚本 (electron/preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  
  // 对话框
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // 窗口控制
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  
  // PDF 导出
  exportPDF: (html, title) => ipcRenderer.invoke('export-pdf', html, title),
});
```

### 7.3 类型定义 (src/types/index.ts)

```typescript
// 标签页
export interface Tab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  isModified: boolean;
}

// 主题
export type Theme = 'light' | 'dark';

// 编辑模式
export type EditMode = 'wysiwyg' | 'split' | 'source';

// Electron API 类型声明
declare global {
  interface Window {
    electronAPI?: {
      readFile: (path: string) => Promise<FileResult>;
      writeFile: (path: string, content: string) => Promise<WriteResult>;
      showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogResult>;
      showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogResult>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<boolean>;
      windowClose: () => Promise<void>;
      exportPDF: (html: string, title: string) => Promise<PDFResult>;
    };
  }
}
```

### 7.4 主应用 (src/App.tsx)

核心状态管理：

```typescript
function App() {
  // 标签页状态
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  
  // UI 状态
  const [theme, setTheme] = useState<Theme>('dark');
  const [editMode, setEditMode] = useState<EditMode>('wysiwyg');
  
  // 工具栏自动隐藏
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  
  // Markdown 解析器
  const mdParser = useRef<MarkdownIt>(new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }));
  
  // ...
}
```

### 7.5 编辑器管理 (src/utils/editorManager.ts)

```typescript
// 编辑器实例管理器
// 用于在组件外部访问编辑器实例（如撤销/重做）

class EditorManager {
  private editor: any = null;
  
  setEditor(editor: any) {
    this.editor = editor;
  }
  
  undo() {
    this.editor?.trigger('keyboard', 'undo', null);
  }
  
  redo() {
    this.editor?.trigger('keyboard', 'redo', null);
  }
}

export const editorManager = new EditorManager();
```

---

## 8. 开发流程

### 8.1 环境准备

```bash
# 1. 克隆项目
git clone https://github.com/singlechenye/MDEidter.git
cd md-editor

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 8.2 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Electron + React 开发环境 |
| `npm run dev:react` | 仅启动 React 开发服务器 |
| `npm run build` | 构建前端资源 |
| `npm run build:electron` | 构建 Electron 安装包 |
| `npm test` | 运行测试（监听模式） |
| `npm run test:run` | 运行测试（单次执行） |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

### 8.3 开发模式

运行 `npm run dev` 后：

1. Vite 启动 React 开发服务器 (http://localhost:5173)
2. Electron 启动并加载开发服务器
3. 自动打开 DevTools
4. 支持热更新 (HMR)

### 8.4 添加新功能流程

```
1. 创建类型定义 (src/types/index.ts)
   ↓
2. 创建组件 (src/components/NewComponent.tsx)
   ↓
3. 添加样式 (src/App.css 或组件内)
   ↓
4. 编写测试 (src/components/__tests__/)
   ↓
5. 集成到主应用 (src/App.tsx)
   ↓
6. 运行测试 (npm test)
   ↓
7. 提交代码
```

### 8.5 添加 IPC 通信流程

```
1. 主进程添加 handler (electron/main.js)
   ipcMain.handle('new-action', async (event, ...args) => { ... });
   ↓
2. 预加载脚本暴露 API (electron/preload.js)
   newAction: (...args) => ipcRenderer.invoke('new-action', ...args)
   ↓
3. 类型声明 (src/types/index.ts)
   在 window.electronAPI 接口中添加方法类型
   ↓
4. 渲染进程调用
   const result = await window.electronAPI.newAction(...);
```

---

## 9. 构建部署

### 9.1 构建流程

```bash
# 构建安装包
npm run build:electron
```

构建步骤：
1. TypeScript 编译检查
2. Vite 构建前端资源到 `dist/`
3. electron-builder 打包到 `release/`

### 9.2 打包配置

```json
{
  "build": {
    "appId": "com.mdeditor.app",
    "productName": "MDEditor",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": [{ "target": "nsis", "arch": ["x64"] }]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### 9.3 输出产物

```
release/
├── MDEditor Setup 1.0.0.exe    # NSIS 安装程序
├── MDEditor Setup 1.0.0.exe.blockmap
├── win-unpacked/               # 免安装版本
│   ├── MDEditor.exe
│   ├── resources/
│   │   └── app.asar           # 应用代码
│   └── ...
└── builder-effective-config.yaml
```

### 9.4 发布流程

1. 更新版本号 (`package.json` 中的 `version`)
2. 构建：`npm run build:electron`
3. 在 GitHub 创建 Release
4. 上传安装包

---

## 10. 常见问题

### 10.1 Electron 依赖下载慢

**问题**：`npm install` 时 Electron 下载超时

**解决**：使用镜像源

```bash
# 设置镜像
npm config set electron_mirror https://cdn.npmmirror.com/binaries/electron/

# 或使用环境变量
set ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
npm install
```

### 10.2 打包时 rcedit 失败

**问题**：`rcedit` 报错 `Fatal error: Unable to commit changes`

**原因**：用户路径包含中文字符

**解决**：
1. 复制项目到非中文路径（如 `C:\temp\`）
2. 设置缓存目录：
```bash
set ELECTRON_BUILDER_CACHE=C:\temp\electron-builder-cache
npm run build:electron
```

### 10.3 开发模式白屏

**问题**：Electron 启动后显示白屏

**解决**：
1. 检查 React 开发服务器是否启动
2. 检查端口 5173 是否被占用
3. 查看控制台错误信息

### 10.4 热更新不生效

**问题**：修改代码后页面不更新

**解决**：
1. 检查 Vite 配置
2. 清除缓存：删除 `node_modules/.vite`
3. 重启开发服务器

### 10.5 测试报错

**问题**：Vitest 测试失败

**解决**：
1. 检查 `vitest.config.ts` 配置
2. 确保 `jsdom` 环境正确设置
3. 检查测试文件路径

---

## 附录

### A. 快捷键列表

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建文件 |
| `Ctrl + O` | 打开文件 |
| `Ctrl + S` | 保存文件 |
| `Ctrl + Shift + S` | 另存为 |
| `Ctrl + W` | 关闭当前标签 |
| `Ctrl + Tab` | 切换标签 |
| `Ctrl + P` | 打开命令面板 |
| `Ctrl + 1` | WYSIWYG 模式 |
| `Ctrl + 2` | 分栏模式 |
| `Ctrl + 3` | 源码模式 |

### B. 主题颜色

```css
/* 暗色主题 */
--bg-primary: #1e2028;
--text-primary: #d4d4d4;
--accent-color: #818cf8;

/* 亮色主题 */
--bg-primary: #ffffff;
--text-primary: #333333;
--accent-color: #6366f1;
```

### C. 参考资源

- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [CodeMirror 6](https://codemirror.net/)
- [Vite 文档](https://vitejs.dev/)
- [markdown-it](https://github.com/markdown-it/markdown-it)

---

*文档版本：1.0.0*
*最后更新：2026年3月*
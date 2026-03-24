# 架构设计文档

本文档描述 Markdown Editor 的系统架构、设计决策和技术实现细节。

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron 应用                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              渲染进程 (Renderer Process)            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              React Application              │   │   │
│  │  │  ┌─────────────────────────────────────┐   │   │   │
│  │  │  │            App.tsx                   │   │   │   │
│  │  │  │  ┌─────────────────────────────┐    │   │   │   │
│  │  │  │  │  TitleBar                   │    │   │   │   │
│  │  │  │  ├─────────────────────────────┤    │   │   │   │
│  │  │  │  │  Toolbar                    │    │   │   │   │
│  │  │  │  ├─────────────────────────────┤    │   │   │   │
│  │  │  │  │  TabBar                     │    │   │   │   │
│  │  │  │  ├─────────────────────────────┤    │   │   │   │
│  │  │  │  │  Main Content               │    │   │   │   │
│  │  │  │  │  ├─ WysiwygEditor           │    │   │   │   │
│  │  │  │  │  ├─ MonacoEditor + Preview │    │   │   │   │
│  │  │  │  │  └─ MonacoEditor (full)    │    │   │   │   │
│  │  │  │  └─────────────────────────────┘    │   │   │   │
│  │  │  └─────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                │
│                           │ IPC (contextBridge)           │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              主进程 (Main Process)                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  main.js                                     │   │   │
│  │  │  ├─ BrowserWindow 管理                       │   │   │
│  │  │  ├─ 文件系统操作 (read/write)                │   │   │
│  │  │  ├─ 原生对话框 (open/save dialog)            │   │   │
│  │  │  └─ 窗口控制 (minimize/maximize/close)       │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 进程模型

应用采用 Electron 的多进程架构：

| 进程 | 职责 | 文件 |
|------|------|------|
| **主进程** | 窗口管理、文件系统、原生 API | `electron/main.js` |
| **渲染进程** | UI 渲染、用户交互 | `src/` 目录下的 React 代码 |
| **预加载脚本** | 安全桥接主进程和渲染进程 | `electron/preload.js` |

## 核心组件

### 组件层次结构

```
App
├── TitleBar          # 自定义窗口标题栏
├── Toolbar           # 工具栏（文件操作、模式切换、主题）
├── TabBar            # 多标签页栏
└── Main Content      # 主内容区域
    ├── WysiwygEditor # 所见即所得编辑器
    ├── MonacoEditor  # Monaco 源码编辑器
    └── PreviewPane   # Markdown 预览面板
```

### 状态管理

应用使用 React 的 `useState` 和 `useCallback` 进行状态管理：

```typescript
// 核心状态
const [tabs, setTabs] = useState<Tab[]>([]);        // 标签页列表
const [activeTabId, setActiveTabId] = useState<string>(); // 当前活动标签
const [theme, setTheme] = useState<Theme>('dark');   // 主题
const [editMode, setEditMode] = useState<EditMode>('wysiwyg'); // 编辑模式
```

### 数据流

```
用户操作 → 事件处理函数 → 状态更新 → 组件重渲染
                ↓
           IPC 通信（如需）
                ↓
           主进程处理
                ↓
           返回结果 → 状态更新
```

## 编辑模式实现

### 所见即所得模式 (WYSIWYG)

```
┌─────────────────────────────────────┐
│                                     │
│     contentEditable div             │
│     (实时渲染 Markdown)              │
│                                     │
│  输入 → onInput → 获取文本           │
│       → onChange 回调                │
│                                     │
└─────────────────────────────────────┘
```

特点：
- 使用 `contentEditable` 实现富文本编辑
- 实时渲染 Markdown 为 HTML
- 光标位置保持（简化实现）

### 分栏模式 (Split)

```
┌──────────────────┬──────────────────┐
│                  │                  │
│  Monaco Editor   │   Preview Pane   │
│  (源码编辑)       │   (实时预览)      │
│                  │                  │
│  onChange ──────→│  render(content) │
│                  │                  │
└──────────────────┴──────────────────┘
```

特点：
- 左侧 Monaco 编辑器编辑源码
- 右侧预览面板实时渲染
- 同步滚动（可扩展）

### 源码模式 (Source)

```
┌─────────────────────────────────────┐
│                                     │
│        Monaco Editor                │
│        (全屏源码编辑)                │
│                                     │
└─────────────────────────────────────┘
```

特点：
- Monaco 编辑器全屏显示
- 适合高级用户和复杂格式调整
- 完整的语法高亮和编辑器功能

## IPC 通信

### 安全模型

使用 `contextIsolation: true` 和预加载脚本确保安全：

```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // 只暴露必要的 API
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  // ...
});
```

### IPC API 列表

| API | 方向 | 说明 |
|-----|------|------|
| `readFile` | 渲染→主 | 读取文件内容 |
| `writeFile` | 渲染→主 | 写入文件内容 |
| `showOpenDialog` | 渲染→主 | 显示打开文件对话框 |
| `showSaveDialog` | 渲染→主 | 显示保存文件对话框 |
| `windowMinimize` | 渲染→主 | 最小化窗口 |
| `windowMaximize` | 渲染→主 | 最大化/还原窗口 |
| `windowClose` | 渲染→主 | 关闭窗口 |
| `windowIsMaximized` | 渲染→主 | 检查窗口是否最大化 |

## 主题系统

### 主题切换机制

```typescript
// 主题状态
const [theme, setTheme] = useState<Theme>('dark');

// 应用主题
useEffect(() => {
  document.documentElement.className = theme;
  localStorage.setItem('md-editor-theme', theme);
}, [theme]);
```

### CSS 变量策略

使用 CSS 类选择器实现主题切换：

```css
/* 默认暗色主题 */
body { background: #1e2028; color: #e6edf3; }

/* 亮色主题 */
body.light { background: #ffffff; color: #24292f; }
```

## 性能优化

### 1. 防抖处理

Markdown 解析使用防抖避免频繁重绘：

```typescript
// 在 WysiwygEditor 中
const handleInput = () => {
  // 使用 ref 跟踪内容变化
  if (isUpdatingRef.current) return;
  lastContentRef.current = text;
  onChange(text);
};
```

### 2. Monaco Editor 优化

```typescript
const editorOptions = {
  minimap: { enabled: false },      // 禁用小地图
  scrollBeyondLastLine: false,      // 禁止滚动超出最后一行
  automaticLayout: true,            // 自动布局
  renderLineHighlight: 'none',      // 禁用行高亮
};
```

### 3. 内容同步优化

使用 ref 跟踪内容变化，避免不必要的更新：

```typescript
const lastContentRef = useRef(content);
const isInternalChange = useRef(false);

// 只在内容真正变化时更新
if (lastContentRef.current !== content) {
  lastContentRef.current = content;
  editorRef.current.setValue(content);
}
```

## 文件处理

### Electron 环境

```
用户操作 → showOpenDialog → 选择文件 → readFile → 返回内容
         → showSaveDialog → 选择路径 → writeFile → 保存成功
```

### Web 环境（降级处理）

```
用户操作 → input[type="file"] → 选择文件 → FileReader → 读取内容
         → Blob + download → 下载文件
```

## 扩展性设计

### 添加新的编辑模式

1. 在 `types/index.ts` 中添加新模式类型
2. 在 `App.tsx` 中添加模式渲染逻辑
3. 在 `Toolbar.tsx` 中添加模式切换按钮

### 添加新的 IPC 功能

1. 在 `electron/main.js` 中添加 `ipcMain.handle`
2. 在 `electron/preload.js` 中暴露 API
3. 在 `src/types/index.ts` 中更新接口定义

### 添加新主题

1. 在 `App.css` 中添加主题样式
2. 更新 `Theme` 类型定义
3. 在 `Toolbar.tsx` 中添加主题切换逻辑

## 安全考虑

1. **上下文隔离**: 启用 `contextIsolation`
2. **禁用 Node 集成**: `nodeIntegration: false`
3. **预加载脚本**: 只暴露必要的 API
4. **内容安全**: 使用 `dangerouslySetInnerHTML` 时确保内容来自可信源（Markdown 解析）

## 测试策略

### 单元测试

- 组件渲染测试
- 状态管理测试
- 工具函数测试

### 集成测试

- 用户交互流程测试
- IPC 通信测试（模拟）

### 测试工具

- Vitest: 测试运行器
- Testing Library: React 组件测试
- jsdom: DOM 模拟环境
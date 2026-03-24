# 组件 API 文档

本文档详细描述 Markdown Editor 的所有组件接口、类型定义和 Electron API。

## 类型定义

### 核心类型

```typescript
// 主题类型
export type Theme = 'dark' | 'light';

// 编辑模式类型
export type EditMode = 'wysiwyg' | 'split' | 'source';

// 标签页接口
export interface Tab {
  id: string;           // 唯一标识符
  title: string;        // 文件名或标题
  filePath: string | null;  // 文件路径（null 表示未保存）
  content: string;      // Markdown 内容
  isModified: boolean;  // 是否有未保存的修改
}

// 生成唯一 ID
export const generateId: () => string;
```

### Electron API 类型

```typescript
declare global {
  interface Window {
    electronAPI?: {
      // 文件操作
      readFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
      }>;
      
      writeFile: (filePath: string, content: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      
      // 对话框
      showOpenDialog: (options: OpenDialogOptions) => Promise<{
        canceled: boolean;
        filePaths: string[];
      }>;
      
      showSaveDialog: (options: SaveDialogOptions) => Promise<{
        canceled: boolean;
        filePath?: string;
      }>;
      
      // 窗口控制
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<boolean>;  // 返回是否最大化
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
    };
  }
}

// 对话框选项类型
interface OpenDialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: string[];
}

interface SaveDialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  defaultPath?: string;
}
```

## 组件 API

### App

主应用组件，管理全局状态和协调子组件。

**位置**: `src/App.tsx`

**状态**:
| 状态 | 类型 | 说明 |
|------|------|------|
| `tabs` | `Tab[]` | 标签页列表 |
| `activeTabId` | `string` | 当前活动标签页 ID |
| `theme` | `Theme` | 当前主题 |
| `editMode` | `EditMode` | 当前编辑模式 |

**主要方法**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `updateTabContent` | `(id: string, content: string, isModified?: boolean)` | 更新标签页内容 |
| `handleNewTab` | - | 创建新标签页 |
| `handleCloseTab` | `(id: string)` | 关闭标签页 |
| `handleOpenFile` | - | 打开文件对话框 |
| `handleSaveFile` | `(saveAs: boolean)` | 保存文件 |
| `handleExportHTML` | - | 导出为 HTML |

---

### TitleBar

自定义窗口标题栏组件，显示当前文件名和窗口控制按钮。

**位置**: `src/components/TitleBar.tsx`

**Props**:
```typescript
interface TitleBarProps {
  currentTab: Tab | null;  // 当前活动标签页
}
```

**功能**:
- 显示应用图标和当前文件名
- 显示修改状态标记
- 提供最小化、最大化/还原、关闭按钮
- 仅在 Electron 环境下渲染

**示例**:
```tsx
<TitleBar currentTab={activeTab} />
```

---

### Toolbar

工具栏组件，提供文件操作、编辑模式切换和主题切换功能。

**位置**: `src/components/Toolbar.tsx`

**Props**:
```typescript
interface ToolbarProps {
  theme: Theme;                              // 当前主题
  editMode: EditMode;                        // 当前编辑模式
  onThemeChange: (theme: Theme) => void;     // 主题切换回调
  onEditModeChange: (mode: EditMode) => void; // 编辑模式切换回调
  onNewFile: () => void;                     // 新建文件回调
  onOpenFile: () => void;                    // 打开文件回调
  onSaveFile: (saveAs: boolean) => void;     // 保存文件回调
  onExportHTML: () => void;                  // 导出 HTML 回调
}
```

**功能**:
- 新建文件按钮
- 打开文件按钮
- 保存/另存为按钮
- 导出 HTML 按钮
- 编辑模式切换（所见即所得/分栏/源码）
- 主题切换按钮

**示例**:
```tsx
<Toolbar
  theme={theme}
  editMode={editMode}
  onThemeChange={setTheme}
  onEditModeChange={setEditMode}
  onNewFile={handleNewTab}
  onOpenFile={handleOpenFile}
  onSaveFile={handleSaveFile}
  onExportHTML={handleExportHTML}
/>
```

---

### TabBar

标签栏组件，管理多标签页的显示和切换。

**位置**: `src/components/TabBar.tsx`

**Props**:
```typescript
interface TabBarProps {
  tabs: Tab[];                           // 标签页列表
  activeTabId: string | null;            // 当前活动标签页 ID
  onTabClick: (id: string) => void;      // 标签页点击回调
  onTabClose: (id: string) => void;      // 标签页关闭回调
  onNewTab: () => void;                  // 新建标签页回调
}
```

**功能**:
- 显示所有打开的标签页
- 高亮当前活动标签页
- 显示修改状态标记（圆点）
- 关闭标签页按钮
- 新建标签页按钮

**示例**:
```tsx
<TabBar
  tabs={tabs}
  activeTabId={activeTabId}
  onTabClick={setActiveTabId}
  onTabClose={handleCloseTab}
  onNewTab={handleNewTab}
/>
```

---

### WysiwygEditor

所见即所得编辑器组件，提供类似 Typora 的沉浸式编辑体验。

**位置**: `src/components/WysiwygEditor.tsx`

**Props**:
```typescript
interface WysiwygEditorProps {
  content: string;                       // Markdown 内容
  onChange: (content: string) => void;   // 内容变化回调
  theme: Theme;                          // 当前主题
}
```

**功能**:
- 使用 `contentEditable` 实现富文本编辑
- 实时渲染 Markdown 为 HTML
- Tab 键插入空格
- 光标位置保持

**实现细节**:
- 使用 `markdown-it` 解析 Markdown
- 使用 ref 跟踪内容变化，避免循环更新
- 简化的光标位置恢复逻辑

**示例**:
```tsx
<WysiwygEditor
  content={activeTab.content}
  onChange={(content) => updateTabContent(activeTab.id, content)}
  theme={theme}
/>
```

---

### MonacoEditor

Monaco 编辑器封装组件，提供源码编辑功能。

**位置**: `src/components/MonacoEditor.tsx`

**Props**:
```typescript
interface MonacoEditorProps {
  content: string;                       // Markdown 内容
  onChange: (content: string) => void;   // 内容变化回调
  theme: Theme;                          // 当前主题
}
```

**功能**:
- Monaco 编辑器集成
- Markdown 语法高亮
- 自动布局
- 内容同步（支持外部更新）

**编辑器配置**:
```typescript
const editorOptions = {
  minimap: { enabled: false },           // 禁用小地图
  fontSize: 14,                          // 字体大小
  fontFamily: 'Consolas, "Courier New", monospace',
  lineNumbers: 'on',                     // 显示行号
  wordWrap: 'on',                        // 自动换行
  scrollBeyondLastLine: false,           // 禁止滚动超出最后一行
  automaticLayout: true,                 // 自动布局
  renderLineHighlight: 'none',           // 禁用行高亮
  cursorSmoothCaretAnimation: 'on',     // 平滑光标动画
};
```

**示例**:
```tsx
<MonacoEditor
  content={activeTab.content}
  onChange={(content) => updateTabContent(activeTab.id, content)}
  theme={theme}
/>
```

---

### PreviewPane

Markdown 预览面板组件，渲染 Markdown 为 HTML。

**位置**: `src/components/PreviewPane.tsx`

**Props**:
```typescript
interface PreviewPaneProps {
  content: string;   // Markdown 内容
  theme: Theme;       // 当前主题
}
```

**功能**:
- 使用 `markdown-it` 渲染 Markdown
- 支持暗色/亮色主题样式
- 完整的 Markdown 语法支持

**Markdown 配置**:
```typescript
new MarkdownIt({
  html: true,         // 允许 HTML
  linkify: true,      // 自动链接
  typographer: true,  // 智能引号
  breaks: true,       // 换行转 <br>
});
```

**示例**:
```tsx
<PreviewPane content={activeTab.content} theme={theme} />
```

---

### Icons

SVG 图标组件集合。

**位置**: `src/components/Icons.tsx`

**导出图标**:
| 图标名 | 说明 |
|--------|------|
| `Icons.File` | 文件图标 |
| `Icons.Folder` | 文件夹图标 |
| `Icons.Save` | 保存图标 |
| `Icons.Export` | 导出图标 |
| `Icons.Sun` | 太阳图标（亮色主题） |
| `Icons.Moon` | 月亮图标（暗色主题） |
| `Icons.Edit` | 编辑图标 |

**示例**:
```tsx
import { Icons } from './components';

<button>
  <Icons.File />
</button>
```

---

## 快捷键

应用支持以下键盘快捷键：

| 快捷键 | 功能 | 实现位置 |
|--------|------|----------|
| `Ctrl + N` | 新建文件/标签页 | `App.tsx` |
| `Ctrl + O` | 打开文件 | `App.tsx` |
| `Ctrl + S` | 保存文件 | `App.tsx` |
| `Ctrl + Shift + S` | 另存为 | `App.tsx` |
| `Ctrl + W` | 关闭当前标签页 | `App.tsx` |
| `Ctrl + Tab` | 切换到下一个标签页 | `App.tsx` |
| `Tab` | 插入空格（编辑器中） | `WysiwygEditor.tsx` |

**实现方式**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handleSaveFile(e.shiftKey);
          break;
        // ...
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dependencies]);
```

---

## 主题样式

### CSS 类名

| 类名 | 说明 |
|------|------|
| `dark` (默认) | 暗色主题 |
| `light` | 亮色主题 |

### 主题应用

```typescript
// 应用主题到根元素
document.documentElement.className = theme;

// CSS 选择器
body { /* 暗色主题样式 */ }
body.light { /* 亮色主题样式 */ }
```

### 持久化

主题选择自动保存到 `localStorage`：

```typescript
// 保存
localStorage.setItem('md-editor-theme', theme);

// 读取（在组件初始化时）
const savedTheme = localStorage.getItem('md-editor-theme');
```

---

## 使用示例

### 基本使用

```tsx
import App from './App';

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

### 自定义组件

```tsx
// 创建自定义工具栏按钮
import { Icons } from './components';

function CustomToolbar() {
  return (
    <div className="toolbar">
      <button onClick={handleCustomAction}>
        <Icons.Edit />
        自定义操作
      </button>
    </div>
  );
}
```

### 扩展 Electron API

```typescript
// 在 preload.js 中添加新 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 现有 API...
  
  // 新增 API
  customAction: (param) => ipcRenderer.invoke('custom-action', param),
});

// 在 main.js 中添加 handler
ipcMain.handle('custom-action', async (event, param) => {
  // 处理逻辑
  return result;
});

// 在类型定义中更新
declare global {
  interface Window {
    electronAPI?: {
      // 现有 API...
      customAction: (param: any) => Promise<any>;
    };
  }
}
```
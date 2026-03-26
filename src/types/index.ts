// Electron API 类型定义
declare global {
  interface Window {
    electronAPI?: {
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      readImageFile: (filePath: string) => Promise<{ success: boolean; base64?: string; mimeType?: string; size?: number; error?: string }>;
      saveImageFile: (dirPath: string, fileName: string, base64Data: string, mimeType: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
      showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>;
      exportPDF: (htmlContent: string, title: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<boolean>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
    };
  }
}

// 标签页接口
export interface Tab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  isModified: boolean;
}

// 主题类型
export type Theme = 'dark' | 'light';

// 工具栏组件 Props
export interface ToolbarProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onSaveFile: (saveAs: boolean) => void;
  onExportHTML: () => void;
  onExportPDF: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenFiles: () => void;
  onSettings?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

// 标题栏组件 Props
export interface TitleBarProps {
  currentTab: Tab | null;
}

// 标签栏组件 Props
export interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

// 所见即所得编辑器 Props
export interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
  theme: Theme;
}

// Monaco 编辑器 Props
export interface MonacoEditorProps {
  content: string;
  onChange: (content: string) => void;
  theme: Theme;
}

// 预览面板 Props
export interface PreviewPaneProps {
  content: string;
  theme: Theme;
}

// 生成唯一 ID
export const generateId = () => Math.random().toString(36).substring(2, 9);
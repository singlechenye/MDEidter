import { useState, useRef, useEffect, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import { Toolbar, MonacoEditor, PreviewPane, CommandPalette, ShortcutHelp, ContextMenu, ToastContainer, toast, Settings, settingsManager } from './components';
import type { Tab, Theme } from './types';
import { generateId } from './types';
import { editorManager } from './utils/editorManager';
import './App.css';

function App() {
  // 标签页状态
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: generateId(),
      title: 'Untitled',
      filePath: null,
      content: '# Welcome to Markdown Editor\n\nThis is a **lightweight**, **high-performance** Markdown editor.\n\n## Features\n\n- 🚀 **Monaco Editor** - VS Code style editor\n- ⚡ **Live Preview** - WYSIWYG\n- 🎨 **Syntax Highlighting** - Full Markdown support\n- 💾 **File Operations** - Save/Open files\n- 📑 **Multi-tab** - Edit multiple files simultaneously',
      isModified: false,
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [theme, setTheme] = useState<Theme>('dark');
  const [layoutMode, setLayoutMode] = useState<'split' | 'editor-full' | 'preview-full'>('split');
  const [splitPosition, setSplitPosition] = useState(50); // 分栏比例，默认 50%

  // 切换布局模式
  const toggleLayoutMode = useCallback(() => {
    setLayoutMode(prev => {
      if (prev === 'split') return 'editor-full';
      if (prev === 'editor-full') return 'preview-full';
      return 'split';
    });
  }, []);

  // 拖动分隔线
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSplitPosition = splitPosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const containerWidth = document.querySelector('.split-container')?.clientWidth || window.innerWidth;
      const deltaX = moveEvent.clientX - startX;
      const percentageDelta = (deltaX / containerWidth) * 100;
      const newPosition = Math.max(20, Math.min(80, startSplitPosition + percentageDelta)); // 限制在 20%-80%
      setSplitPosition(newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitPosition]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const mdParser = useRef<MarkdownIt>(new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }));

  // 检测鼠标位置显示/隐藏工具栏
  const toolbarRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 60; // 顶部 60px 区域触发显示

      // 检查鼠标是否在工具栏区域内
      const isInToolbar = toolbarRef.current?.contains(e.target as Node);

      // 清除之前的隐藏定时器
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (e.clientY <= threshold || isInToolbar) {
        setIsToolbarVisible(true);
      } else {
        // 延迟隐藏，给用户时间移动到工具栏
        hideTimeoutRef.current = window.setTimeout(() => {
          setIsToolbarVisible(false);
        }, 300);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 获取当前活动标签
  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  // 主题切换
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('md-editor-theme', theme);
  }, [theme]);

  // 更新标签内容
  const updateTabContent = useCallback((id: string, content: string, isModified: boolean = true) => {
    setTabs(prev => prev.map(tab =>
      tab.id === id
        ? { ...tab, content, isModified }
        : tab
    ));
  }, []);

  // 插入文本到编辑器
  const handleInsertText = useCallback((text: string, cursorOffset?: number) => {
    if (!activeTab) return;

    // 通过 editorManager 插入文本
    editorManager.insertText(text, cursorOffset);
  }, [activeTab]);

  // 包裹选中文本
  const handleWrapSelection = useCallback((before: string, after: string) => {
    if (!activeTab) return;

    // 通过 editorManager 包裹选中文本
    editorManager.wrapSelection(before, after);
  }, [activeTab]);

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setIsContextMenuOpen(true);
  }, []);

  // 监听原生 contextmenu 事件（用于 Monaco Editor）
  const mainContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleNativeContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setIsContextMenuOpen(true);
    };

    mainContent.addEventListener('contextmenu', handleNativeContextMenu);
    return () => {
      mainContent.removeEventListener('contextmenu', handleNativeContextMenu);
    };
  }, []);

  // 压缩和调整图片尺寸
  const resizeAndCompressImage = useCallback(async (file: File): Promise<{ blob: Blob; width: number; height: number }> => {
    const settings = settingsManager.getSettings();
    const sizeMode = settings.imageSizeMode || 'auto';
    const maxWidth = settings.imageMaxWidth || 800;
    const maxHeight = settings.imageMaxHeight || 600;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let width: number;
        let height: number;

        if (sizeMode === 'fixed') {
          // 固定尺寸模式
          width = maxWidth;
          height = maxHeight;
        } else {
          // 自适应模式 - 按比例缩放
          let originalWidth = img.width;
          let originalHeight = img.height;

          // 如果图片尺寸在限制内，保持原尺寸
          if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
            width = originalWidth;
            height = originalHeight;
          } else {
            // 计算缩放比例
            const ratioW = maxWidth / originalWidth;
            const ratioH = maxHeight / originalHeight;
            const ratio = Math.min(ratioW, ratioH);

            width = Math.round(originalWidth * ratio);
            height = Math.round(originalHeight * ratio);
          }
        }

        // 创建 Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width, height });
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          outputType,
          0.92
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }, []);

  // 处理图片文件并插入
  const processAndInsertImage = useCallback(async (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // 检查文件大小 (限制 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    const settings = settingsManager.getSettings();
    const altText = file.name.replace(/\.[^/.]+$/, '');

    // 获取图片保存路径
    const imageSavePath = settings.imageSavePath;

    if (!imageSavePath) {
      // 没有设置保存路径，提示用户
      toast.info('Please set image save path in Settings');
      setIsSettingsOpen(true);
      return;
    }

    try {
      // 压缩和调整图片尺寸
      const { blob, width, height } = await resizeAndCompressImage(file);

      // 生成唯一文件名
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const newFileName = `img_${timestamp}_${randomStr}.${ext}`;

      if (window.electronAPI) {
        // Electron 环境 - 保存到本地文件
        // 读取压缩后的 blob 为 ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // 转换为 base64 用于传输
        let binary = '';
        uint8Array.forEach(byte => binary += String.fromCharCode(byte));
        const base64Data = btoa(binary);

        // 调用 Electron API 保存图片
        const result = await window.electronAPI.saveImageFile(
          imageSavePath,
          newFileName,
          base64Data,
          blob.type
        );

        if (result.success && result.filePath) {
          // 使用 HTML img 标签设置宽高
          const markdown = `<img src="${result.filePath}" width="${width}" height="${height}" alt="${altText}">`;
          editorManager.insertText(markdown);
          toast.success(`Image saved (${width}x${height})`);
        } else {
          toast.error('Failed to save image: ' + (result.error || 'Unknown error'));
        }
      } else {
        // Web 环境 - 使用路径
        const filePath = `${imageSavePath}/${newFileName}`.replace(/\\/g, '/');
        const markdown = `<img src="${filePath}" width="${width}" height="${height}" alt="${altText}">`;
        editorManager.insertText(markdown);
        toast.success(`Image path inserted (${width}x${height})`);
        toast.info('Note: In web mode, please manually copy the image to the specified path');
      }
    } catch (error) {
      toast.error('Failed to process image');
      console.error(error);
    }
  }, [resizeAndCompressImage]);

  // 粘贴事件处理 - 使用捕获阶段确保在 Monaco Editor 之前处理
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // 查找图片项
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          e.stopPropagation();
          const file = item.getAsFile();
          if (file) {
            processAndInsertImage(file);
          }
          return;
        }
      }
    };

    // 使用捕获阶段
    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [processAndInsertImage]);

  // 拖拽事件处理
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // 检查是否真的离开了窗口
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // 处理所有图片文件
      let imageCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          processAndInsertImage(file);
          imageCount++;
        }
      }

      if (imageCount === 0) {
        toast.info('Please drop image files only');
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, [processAndInsertImage]);

  // 新建标签
  const handleNewTab = useCallback(() => {
    const newTab: Tab = {
      id: generateId(),
      title: 'Untitled',
      filePath: null,
      content: '# New Document\n\nStart editing...',
      isModified: false,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setIsCommandPaletteOpen(false);
  }, []);

  // 关闭标签
  const handleCloseTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab?.isModified) {
      if (!confirm(`"${tab.title}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);

      // 如果关闭的是最后一个标签，创建新的空白标签
      if (newTabs.length === 0) {
        const newTab: Tab = {
          id: generateId(),
          title: 'Untitled',
          filePath: null,
          content: '# New Document\n\nStart editing...',
          isModified: false,
        };
        setActiveTabId(newTab.id);
        return [newTab];
      }

      // 如果关闭的是当前标签，切换到其他标签
      if (id === activeTabId) {
        const index = prev.findIndex(t => t.id === id);
        const newActiveIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }
      return newTabs;
    });
  }, [tabs, activeTabId]);

  // 打开文件
  const handleOpenFile = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Open Markdown File',
        filters: [
          { name: 'Markdown Files', extensions: ['md', 'markdown'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        for (const filePath of result.filePaths) {
          const fileResult = await window.electronAPI.readFile(filePath);
          if (fileResult.success && fileResult.content !== undefined) {
            const fileName = filePath.split(/[\\/]/).pop() || 'Untitled';
            const newTab: Tab = {
              id: generateId(),
              title: fileName,
              filePath,
              content: fileResult.content,
              isModified: false,
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
          } else {
            alert(`Failed to open file: ${fileResult.error}`);
          }
        }
      }
    } else {
      // Web 环境
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown';
      input.multiple = true;

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const content = await file.text();
            const newTab: Tab = {
              id: generateId(),
              title: file.name,
              filePath: file.name,
              content,
              isModified: false,
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
          }
        }
      };

      input.click();
    }
  };

  // 保存文件
  const handleSaveFile = async (saveAs: boolean = false) => {
    if (!activeTab) return;

    if (window.electronAPI) {
      let filePath = activeTab.filePath;

      if (!filePath || saveAs) {
        const result = await window.electronAPI.showSaveDialog({
          title: 'Save Markdown File',
          filters: [
            { name: 'Markdown Files', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          defaultPath: activeTab.filePath || 'untitled.md'
        });

        if (result.canceled) return;
        filePath = result.filePath || null;
      }

      if (filePath && window.electronAPI) {
        const result = await window.electronAPI.writeFile(filePath, activeTab.content);
        if (result.success) {
          const fileName = filePath.split(/[\\/]/).pop() || 'Untitled';
          setTabs(prev => prev.map(tab =>
            tab.id === activeTab.id
              ? { ...tab, filePath, title: fileName, isModified: false }
              : tab
          ));
        } else {
          alert(`Save failed: ${result.error}`);
        }
      }
    } else {
      // Web 环境 - 下载文件
      const blob = new Blob([activeTab.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeTab.title || 'document.md';
      a.click();
      URL.revokeObjectURL(url);
      setTabs(prev => prev.map(tab =>
        tab.id === activeTab.id ? { ...tab, isModified: false } : tab
      ));
    }
  };

  // 导出 HTML
  const handleExportHTML = () => {
    if (!activeTab) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${activeTab.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.8;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
            color: ${theme === 'dark' ? '#d4d4d4' : '#333333'};
          }
          h1, h2, h3, h4, h5, h6 {
            color: ${theme === 'dark' ? '#75beff' : '#0066cc'};
            margin-top: 1.5em;
          }
          a { color: ${theme === 'dark' ? '#3794ff' : '#0066cc'}; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { background: ${theme === 'dark' ? '#2d2d30' : '#f4f4f4'}; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; }
          pre { background: ${theme === 'dark' ? '#1e1e1e' : '#f8f8f8'}; padding: 15px; border-radius: 5px; overflow-x: auto; margin: 1.5em 0; }
          blockquote { border-left: 4px solid ${theme === 'dark' ? '#75beff' : '#0066cc'}; padding: 0.5em 1em; margin: 1em 0; background: ${theme === 'dark' ? '#252526' : '#f0f0f0'}; }
          table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
          th, td { border: 1px solid ${theme === 'dark' ? '#3e3e42' : '#ddd'}; padding: 8px 12px; text-align: left; }
          th { background: ${theme === 'dark' ? '#252526' : '#f5f5f5'}; font-weight: bold; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${mdParser.current.render(activeTab.content)}
      </body>
      </html>
    `;

    if (window.electronAPI) {
      window.electronAPI.showSaveDialog({
        title: 'Export HTML',
        filters: [{ name: 'HTML Files', extensions: ['html'] }],
        defaultPath: `${activeTab.title.replace(/\.md$/, '')}.html`
      }).then(result => {
        if (!result.canceled && result.filePath && window.electronAPI) {
          window.electronAPI.writeFile(result.filePath, htmlContent);
          toast.success('HTML exported successfully!');
        }
      });
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab.title.replace(/\.md$/, '')}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('HTML exported successfully!');
    }
  };

  // 导出 PDF
  const handleExportPDF = async () => {
    if (!activeTab) return;

    const htmlContent = mdParser.current.render(activeTab.content);
    const title = activeTab.title.replace(/\.md$/, '');

    if (window.electronAPI) {
      const result = await window.electronAPI.exportPDF(htmlContent, title);
      if (result.success) {
        toast.success('PDF exported successfully!');
      } else if (!result.canceled) {
        toast.error('Failed to export PDF: ' + result.error);
      }
    } else {
      toast.info('PDF export is only available in the desktop app');
    }
  };

  // 撤销
  const handleUndo = useCallback(() => {
    editorManager.undo();
  }, []);

  // 重做
  const handleRedo = useCallback(() => {
    editorManager.redo();
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc 关闭快捷键帮助
      if (e.key === 'Escape') {
        if (isShortcutHelpOpen) {
          setIsShortcutHelpOpen(false);
          return;
        }
        if (isContextMenuOpen) {
          setIsContextMenuOpen(false);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSaveFile(e.shiftKey);
            break;
          case 'o':
            e.preventDefault();
            handleOpenFile();
            break;
          case 'n':
            e.preventDefault();
            handleNewTab();
            break;
          case 'p':
            e.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
            break;
          case 'w':
            e.preventDefault();
            if (activeTab) handleCloseTab(activeTab.id);
            break;
          case 'tab':
            e.preventDefault();
            // 切换到下一个标签
            const currentIndex = tabs.findIndex(t => t.id === activeTabId);
            const nextIndex = (currentIndex + 1) % tabs.length;
            setActiveTabId(tabs[nextIndex].id);
            break;
          case '1':
            e.preventDefault();
            toggleLayoutMode();
            break;
          case '2':
            e.preventDefault();
            toggleLayoutMode();
            break;
          case '3':
            e.preventDefault();
            toggleLayoutMode();
            break;
          case 'b':
            e.preventDefault();
            handleWrapSelection('**', '**');
            break;
          case 'i':
            e.preventDefault();
            handleWrapSelection('*', '*');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeTabId, tabs, isShortcutHelpOpen, isContextMenuOpen, handleWrapSelection]);

  // 切换标签时关闭命令面板
  const handleTabClick = useCallback((id: string) => {
    setActiveTabId(id);
    setIsCommandPaletteOpen(false);
  }, []);

  // 窗口控制
  const handleMinimize = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowMinimize();
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowMaximize();
    }
  }, []);

  const handleClose = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowClose();
    }
  }, []);

  return (
    <div className="app">
      {/* 顶部拖拽区域 */}
      <div className="window-drag-area" />

      {/* 悬浮毛玻璃工具栏 - 自动隐藏 */}
      <div
        ref={toolbarRef}
        className={`floating-toolbar ${isToolbarVisible ? 'visible' : ''}`}
      >
        <Toolbar
          theme={theme}
          onThemeChange={setTheme}
          onSaveFile={handleSaveFile}
          onExportHTML={handleExportHTML}
          onExportPDF={handleExportPDF}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenFiles={() => setIsCommandPaletteOpen(true)}
          onSettings={() => setIsSettingsOpen(true)}
          onMinimize={window.electronAPI ? handleMinimize : undefined}
          onMaximize={window.electronAPI ? handleMaximize : undefined}
          onClose={window.electronAPI ? handleClose : undefined}
        />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={handleTabClick}
        onTabClose={handleCloseTab}
        onNewTab={handleNewTab}
        onOpenFile={handleOpenFile}
      />

      {/* 主内容区域 */}
      <div ref={mainContentRef} className="main-content" onContextMenu={handleContextMenu}>
        {activeTab && (
          <>
            {layoutMode === 'editor-full' ? (
              <div className="editor-pane full">
                <MonacoEditor
                  key={activeTab.id}
                  content={activeTab.content}
                  onChange={(content) => updateTabContent(activeTab.id, content)}
                  theme={theme}
                />
              </div>
            ) : layoutMode === 'preview-full' ? (
              <div className="preview-pane full">
                <PreviewPane content={activeTab.content} theme={theme} />
              </div>
            ) : (
              <div className="split-container">
                <div className="split-pane editor-pane" style={{ width: `${splitPosition}%` }}>
                  <MonacoEditor
                    key={activeTab.id}
                    content={activeTab.content}
                    onChange={(content) => updateTabContent(activeTab.id, content)}
                    theme={theme}
                  />
                </div>
                <div 
                  className="split-divider draggable-divider"
                  onMouseDown={startDrag}
                />
                <div className="split-pane preview-pane" style={{ width: `${100 - splitPosition}%` }}>
                  <PreviewPane content={activeTab.content} theme={theme} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 拖拽遮罩 */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-content">
            <span className="drag-icon">📷</span>
            <span className="drag-text">Drop image here</span>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {isContextMenuOpen && (
        <ContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          onInsert={handleInsertText}
          onWrapSelection={handleWrapSelection}
          onClose={() => setIsContextMenuOpen(false)}
        />
      )}

      {/* 右下角帮助按钮 */}
      <button
        className="help-fab"
        onClick={() => setIsShortcutHelpOpen(true)}
        title="快捷键帮助"
      >
        ?
      </button>

      {/* 快捷键帮助面板 */}
      <ShortcutHelp
        isOpen={isShortcutHelpOpen}
        onClose={() => setIsShortcutHelpOpen(false)}
      />

      {/* 设置面板 */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  );
}

export default App;
import { useState, useRef, useEffect, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import { Toolbar, WysiwygEditor, MonacoEditor, PreviewPane, CommandPalette, ShortcutHelp } from './components';
import type { Tab, Theme, EditMode } from './types';
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
  const [editMode, setEditMode] = useState<EditMode>('wysiwyg');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);

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
          alert('HTML exported successfully!');
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
        alert('PDF exported successfully!');
      } else if (!result.canceled) {
        alert('Failed to export PDF: ' + result.error);
      }
    } else {
      alert('PDF export is only available in the desktop app.');
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
      if (e.key === 'Escape' && isShortcutHelpOpen) {
        setIsShortcutHelpOpen(false);
        return;
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
            setEditMode('wysiwyg');
            break;
          case '2':
            e.preventDefault();
            setEditMode('split');
            break;
          case '3':
            e.preventDefault();
            setEditMode('source');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeTabId, tabs, isShortcutHelpOpen]);

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
          editMode={editMode}
          onThemeChange={setTheme}
          onEditModeChange={setEditMode}
          onSaveFile={handleSaveFile}
          onExportHTML={handleExportHTML}
          onExportPDF={handleExportPDF}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenFiles={() => setIsCommandPaletteOpen(true)}
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
      <div className="main-content">
        {activeTab && (
          <>
            {editMode === 'wysiwyg' && (
              <WysiwygEditor
                key={activeTab.id}
                content={activeTab.content}
                onChange={(content) => updateTabContent(activeTab.id, content)}
                theme={theme}
              />
            )}

            {editMode === 'split' && (
              <div className="split-container">
                <div className="split-pane editor-pane">
                  <MonacoEditor
                    key={activeTab.id}
                    content={activeTab.content}
                    onChange={(content) => updateTabContent(activeTab.id, content)}
                    theme={theme}
                  />
                </div>
                <div className="split-divider" />
                <div className="split-pane preview-pane">
                  <PreviewPane content={activeTab.content} theme={theme} />
                </div>
              </div>
            )}

            {editMode === 'source' && (
              <div className="editor-pane full">
                <MonacoEditor
                  key={activeTab.id}
                  content={activeTab.content}
                  onChange={(content) => updateTabContent(activeTab.id, content)}
                  theme={theme}
                />
              </div>
            )}
          </>
        )}
      </div>

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
    </div>
  );
}

export default App;
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Tab } from '../types';
import { Icons } from './Icons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onOpenFile: () => void;
}

function CommandPalette({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onTabSelect,
  onNewTab,
  onOpenFile
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 过滤文件列表
  const filteredTabs = tabs.filter(tab =>
    tab.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      // 自动聚焦
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTabs.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTabs[selectedIndex]) {
          onTabSelect(filteredTabs[selectedIndex].id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredTabs, selectedIndex, onTabSelect, onClose]);

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={handleOverlayClick}>
      <div className="command-palette" onKeyDown={handleKeyDown}>
        {/* 搜索框 */}
        <div className="command-search">
          <Icons.Search />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div className="command-actions">
          <button 
            className="command-action-btn"
            onClick={() => {
              onNewTab();
              onClose();
            }}
            title="New File (Ctrl+N)"
          >
            <Icons.Plus />
            <span>新建</span>
            <kbd>⌘N</kbd>
          </button>
          <button 
            className="command-action-btn"
            onClick={() => {
              onOpenFile();
              onClose();
            }}
            title="Open File (Ctrl+O)"
          >
            <Icons.Folder />
            <span>打开</span>
            <kbd>⌘O</kbd>
          </button>
        </div>

        {/* 文件列表 */}
        <div className="command-list">
          {filteredTabs.length === 0 ? (
            <div className="command-empty">No files found</div>
          ) : (
            filteredTabs.map((tab, index) => (
              <div
                key={tab.id}
                className={`command-item ${tab.id === activeTabId ? 'active' : ''} ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  onTabSelect(tab.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="command-item-icon">
                  <Icons.File />
                </span>
                <span className="command-item-name">{tab.title}</span>
                {tab.isModified && <span className="command-item-modified" />}
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="command-footer">
          <span><kbd>↓</kbd><kbd>↑</kbd> 选择</span>
          <span><kbd>↵</kbd> 打开</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
import { useState, useEffect } from 'react';
import type { TitleBarProps } from '../types';

// 标题栏组件
function TitleBar({ currentTab }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI?.windowIsMaximized) {
        const maximized = await window.electronAPI.windowIsMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    if (window.electronAPI?.windowMinimize) {
      await window.electronAPI.windowMinimize();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI?.windowMaximize) {
      const maximized = await window.electronAPI.windowMaximize();
      setIsMaximized(maximized);
    }
  };

  const handleClose = async () => {
    if (window.electronAPI?.windowClose) {
      await window.electronAPI.windowClose();
    }
  };

  const isElectron = !!window.electronAPI?.windowMinimize;
  if (!isElectron) return null;

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <svg className="titlebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="titlebar-title">
          {currentTab ? currentTab.title : '未命名'}
          {currentTab?.isModified && <span className="modified-dot"> •</span>}
          {' - Markdown Editor'}
        </span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn minimize" onClick={handleMinimize} title="最小化">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect fill="currentColor" width="10" height="1" x="1" y="6" />
          </svg>
        </button>
        <button className="titlebar-btn maximize" onClick={handleMaximize} title={isMaximized ? '还原' : '最大化'}>
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect fill="none" stroke="currentColor" width="7" height="7" x="1" y="4" strokeWidth="1" />
              <polyline fill="none" stroke="currentColor" points="3,4 3,1 10,1 10,8 7,8" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect fill="none" stroke="currentColor" width="9" height="9" x="1.5" y="1.5" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path fill="currentColor" d="M6.707 6l3.147-3.146a.5.5 0 0 0-.708-.708L6 5.293 2.854 2.146a.5.5 0 1 0-.708.708L5.293 6l-3.147 3.146a.5.5 0 0 0 .708.708L6 6.707l3.146 3.147a.5.5 0 0 0 .708-.708L6.707 6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
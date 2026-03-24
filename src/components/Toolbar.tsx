import { Icons } from './Icons';
import type { ToolbarProps } from '../types';

// 工具栏组件 - 只返回内部内容，外层容器由父组件控制
function Toolbar({
  theme,
  editMode,
  onThemeChange,
  onEditModeChange,
  onSaveFile,
  onExportHTML,
  onExportPDF,
  onUndo,
  onRedo,
  onOpenFiles,
  onMinimize,
  onMaximize,
  onClose
}: ToolbarProps) {
  return (
    <div className="toolbar-inner">
      <div className="toolbar-group">
        <button onClick={onOpenFiles} title="Files (Ctrl+P)"><Icons.Menu /></button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={onUndo} title="Undo (Ctrl+Z)"><Icons.Undo /></button>
        <button onClick={onRedo} title="Redo (Ctrl+Y)"><Icons.Redo /></button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group edit-modes">
        <button
          className={editMode === 'wysiwyg' ? 'active' : ''}
          onClick={() => onEditModeChange('wysiwyg')}
          title="WYSIWYG"
        >
          WYS
        </button>
        <button
          className={editMode === 'split' ? 'active' : ''}
          onClick={() => onEditModeChange('split')}
          title="Split View"
        >
          SPLIT
        </button>
        <button
          className={editMode === 'source' ? 'active' : ''}
          onClick={() => onEditModeChange('source')}
          title="Source Code"
        >
          SRC
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={() => onSaveFile(false)} title="Save (Ctrl+S)"><Icons.Save /></button>
        <button onClick={onExportHTML} title="Export HTML"><Icons.Export /></button>
        <button onClick={onExportPDF} title="Export PDF"><Icons.PDF /></button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <button onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
          {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
        </button>
      </div>

      {/* 窗口控制按钮 */}
      {(onMinimize || onMaximize || onClose) && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group window-controls">
            {onMinimize && (
              <button onClick={onMinimize} title="Minimize" className="window-btn minimize-btn">
                <Icons.Minimize />
              </button>
            )}
            {onMaximize && (
              <button onClick={onMaximize} title="Maximize" className="window-btn maximize-btn">
                <Icons.Maximize />
              </button>
            )}
            {onClose && (
              <button onClick={onClose} title="Close" className="window-btn close-btn">
                <Icons.Close />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Toolbar;
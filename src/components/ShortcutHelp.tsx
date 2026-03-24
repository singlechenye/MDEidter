import { Icons } from './Icons';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: '文件操作', items: [
    { key: 'Ctrl+N', desc: '新建文件' },
    { key: 'Ctrl+O', desc: '打开文件' },
    { key: 'Ctrl+S', desc: '保存文件' },
    { key: 'Ctrl+Shift+S', desc: '另存为' },
  ]},
  { category: '编辑操作', items: [
    { key: 'Ctrl+Z', desc: '撤销' },
    { key: 'Ctrl+Y', desc: '重做' },
    { key: 'Ctrl+B', desc: '加粗' },
    { key: 'Ctrl+I', desc: '斜体' },
  ]},
  { category: '视图切换', items: [
    { key: 'Ctrl+P', desc: '打开文件列表' },
    { key: 'Ctrl+1', desc: 'WYSIWYG 模式' },
    { key: 'Ctrl+2', desc: '分栏模式' },
    { key: 'Ctrl+3', desc: '源码模式' },
  ]},
  { category: '其他', items: [
    { key: '?', desc: '显示快捷键帮助' },
    { key: 'Esc', desc: '关闭面板' },
  ]},
];

function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="shortcut-help-overlay" onClick={onClose}>
      <div className="shortcut-help-panel" onClick={e => e.stopPropagation()}>
        <div className="shortcut-help-header">
          <h3>快捷键指引</h3>
          <button className="shortcut-close-btn" onClick={onClose}>
            <Icons.Close />
          </button>
        </div>
        <div className="shortcut-help-content">
          {shortcuts.map(group => (
            <div key={group.category} className="shortcut-group">
              <div className="shortcut-category">{group.category}</div>
              {group.items.map(item => (
                <div key={item.key} className="shortcut-item">
                  <kbd className="shortcut-key">{item.key}</kbd>
                  <span className="shortcut-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="shortcut-help-footer">
          按 <kbd>Esc</kbd> 或 <kbd>?</kbd> 关闭
        </div>
      </div>
    </div>
  );
}

export default ShortcutHelp;
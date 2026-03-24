import type { Tab } from '../types';
import { Icons } from './Icons';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onOpenFile: () => void;
}

function SideDrawer({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  onOpenFile
}: SideDrawerProps) {
  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div className="drawer-overlay" onClick={onClose} />
      )}

      {/* 抽屉 */}
      <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Files</span>
          <button className="drawer-close" onClick={onClose}>
            <Icons.Close />
          </button>
        </div>

        <div className="drawer-content">
          {/* 文件操作按钮 */}
          <div className="drawer-actions">
            <button className="drawer-action-btn" onClick={onNewTab} title="New File (Ctrl+N)">
              <Icons.File />
              <span>New</span>
            </button>
            <button className="drawer-action-btn" onClick={onOpenFile} title="Open File (Ctrl+O)">
              <Icons.Folder />
              <span>Open</span>
            </button>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-header">
              <span>Open Files</span>
            </div>

            <div className="drawer-file-list">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`drawer-file-item ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => onTabClick(tab.id)}
                >
                  <span className="file-icon"><Icons.File /></span>
                  <span className="file-name">
                    {tab.title}
                    {tab.isModified && <span className="file-modified"> •</span>}
                  </span>
                  <button
                    className="file-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                    title="Close"
                  >
                    <Icons.Close />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SideDrawer;
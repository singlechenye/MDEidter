import type { TabBarProps } from '../types';

// 标签栏组件
function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab
}: TabBarProps) {
  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="tab-title">
              {tab.title}
              {tab.isModified && <span className="tab-modified"> •</span>}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Close"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button className="new-tab-btn" onClick={onNewTab} title="New Tab">
        +
      </button>
    </div>
  );
}

export default TabBar;
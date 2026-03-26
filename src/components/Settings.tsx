import { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// 默认设置
const DEFAULT_SETTINGS = {
  imageSavePath: '',
  imageSizeMode: 'auto' as 'fixed' | 'auto',  // fixed: 固定尺寸, auto: 自适应
  imageMaxWidth: 800,
  imageMaxHeight: 600,
};

// 设置管理
export const settingsManager = {
  getSettings: () => {
    try {
      const saved = localStorage.getItem('md-editor-settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings: (settings: typeof DEFAULT_SETTINGS) => {
    try {
      localStorage.setItem('md-editor-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getImageSavePath: () => {
    const settings = settingsManager.getSettings();
    return settings.imageSavePath;
  },

  getImageSizeMode: () => {
    const settings = settingsManager.getSettings();
    return settings.imageSizeMode;
  },

  getImageMaxWidth: () => {
    const settings = settingsManager.getSettings();
    return settings.imageMaxWidth;
  },

  getImageMaxHeight: () => {
    const settings = settingsManager.getSettings();
    return settings.imageMaxHeight;
  },
};

function Settings({ isOpen, onClose }: SettingsProps) {
  const [imageSavePath, setImageSavePath] = useState('');
  const [imageSizeMode, setImageSizeMode] = useState<'fixed' | 'auto'>('auto');
  const [imageMaxWidth, setImageMaxWidth] = useState(800);
  const [imageMaxHeight, setImageMaxHeight] = useState(600);

  // 加载设置
  useEffect(() => {
    const settings = settingsManager.getSettings();
    setImageSavePath(settings.imageSavePath);
    setImageSizeMode(settings.imageSizeMode);
    setImageMaxWidth(settings.imageMaxWidth);
    setImageMaxHeight(settings.imageMaxHeight);
  }, [isOpen]);

  // 选择目录
  const handleSelectPath = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Select Image Save Folder',
        properties: ['openDirectory', 'createDirectory'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setImageSavePath(result.filePaths[0]);
      }
    } else {
      const path = prompt('Enter image save path:', imageSavePath);
      if (path !== null) {
        setImageSavePath(path);
      }
    }
  };

  // 保存设置
  const handleSave = () => {
    settingsManager.saveSettings({
      imageSavePath,
      imageSizeMode,
      imageMaxWidth: Number(imageMaxWidth),
      imageMaxHeight: Number(imageMaxHeight),
    });
    onClose();
  };

  // 重置设置
  const handleReset = () => {
    setImageSavePath('');
    setImageSizeMode('auto');
    setImageMaxWidth(800);
    setImageMaxHeight(600);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          {/* 图片保存路径 */}
          <div className="settings-section">
            <h3>Image Storage</h3>

            <div className="settings-option">
              <label className="settings-label">Image Save Folder</label>
              <div className="settings-path-input">
                <input
                  type="text"
                  value={imageSavePath}
                  onChange={(e) => setImageSavePath(e.target.value)}
                  placeholder="Select a folder to save images..."
                  readOnly={!!window.electronAPI}
                />
                <button onClick={handleSelectPath}>
                  {window.electronAPI ? 'Browse...' : 'Set Path'}
                </button>
              </div>
              <p className="settings-hint">
                {window.electronAPI
                  ? 'Images will be saved to this folder and referenced by absolute path.'
                  : 'In web mode, enter a path like "images" or "assets/images".'}
              </p>
            </div>
          </div>

          {/* 图片尺寸设置 */}
          <div className="settings-section">
            <h3>Image Size</h3>

            <div className="settings-option">
              <label className="settings-label">Size Mode</label>
              <div className="settings-radio-group">
                <label className="settings-radio">
                  <input
                    type="radio"
                    name="imageSizeMode"
                    checked={imageSizeMode === 'auto'}
                    onChange={() => setImageSizeMode('auto')}
                  />
                  <span className="radio-label">
                    <strong>Auto (Max Size)</strong>
                    <small>Images will be scaled down if larger than max size</small>
                  </span>
                </label>
                <label className="settings-radio">
                  <input
                    type="radio"
                    name="imageSizeMode"
                    checked={imageSizeMode === 'fixed'}
                    onChange={() => setImageSizeMode('fixed')}
                  />
                  <span className="radio-label">
                    <strong>Fixed Size</strong>
                    <small>All images will be resized to specified dimensions</small>
                  </span>
                </label>
              </div>
            </div>

            {imageSizeMode === 'auto' && (
              <div className="settings-option">
                <label className="settings-label">Max Dimensions</label>
                <div className="settings-dimensions">
                  <div className="dimension-input">
                    <span>Width</span>
                    <input
                      type="number"
                      value={imageMaxWidth}
                      onChange={(e) => setImageMaxWidth(Number(e.target.value))}
                      min={100}
                      max={4000}
                      step={50}
                    />
                    <span className="input-unit">px</span>
                  </div>
                  <div className="dimension-input">
                    <span>Height</span>
                    <input
                      type="number"
                      value={imageMaxHeight}
                      onChange={(e) => setImageMaxHeight(Number(e.target.value))}
                      min={100}
                      max={4000}
                      step={50}
                    />
                    <span className="input-unit">px</span>
                  </div>
                </div>
                <p className="settings-hint">
                  Images larger than these dimensions will be scaled proportionally.
                </p>
              </div>
            )}

            {imageSizeMode === 'fixed' && (
              <div className="settings-option">
                <label className="settings-label">Fixed Dimensions</label>
                <div className="settings-dimensions">
                  <div className="dimension-input">
                    <span>Width</span>
                    <input
                      type="number"
                      value={imageMaxWidth}
                      onChange={(e) => setImageMaxWidth(Number(e.target.value))}
                      min={50}
                      max={4000}
                      step={50}
                    />
                    <span className="input-unit">px</span>
                  </div>
                  <div className="dimension-input">
                    <span>Height</span>
                    <input
                      type="number"
                      value={imageMaxHeight}
                      onChange={(e) => setImageMaxHeight(Number(e.target.value))}
                      min={50}
                      max={4000}
                      step={50}
                    />
                    <span className="input-unit">px</span>
                  </div>
                </div>
                <p className="settings-hint">
                  All images will be resized to exactly these dimensions.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-btn secondary" onClick={handleReset}>
            Reset
          </button>
          <button className="settings-btn primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
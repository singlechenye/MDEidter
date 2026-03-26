import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

// 支持的代码语言
const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'plaintext', label: 'Plain Text' },
];

// 图片信息接口
interface ImageInfo {
  name: string;
  size: number;
  base64: string;
  mimeType: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onInsert: (text: string, cursorOffset?: number) => void;
  onWrapSelection: (before: string, after: string) => void;
  onClose: () => void;
}

function ContextMenu({ x, y, onInsert, onWrapSelection, onClose }: ContextMenuProps) {
  const [showHeadingSubmenu, setShowHeadingSubmenu] = useState(false);
  const [showCodeSubmenu, setShowCodeSubmenu] = useState(false);
  const [showListSubmenu, setShowListSubmenu] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // 图片相关状态
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 计算菜单位置，确保不超出屏幕
  const menuStyle = {
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - 400),
  };

  // 标题
  const handleHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    onInsert(prefix, prefix.length);
    onClose();
  };

  // 代码块
  const handleCodeBlock = (language: string) => {
    const template = `\`\`\`${language}\ncode here\n\`\`\``;
    onInsert(template, template.indexOf('code here'));
    onClose();
  };

  // 表格
  const handleTable = () => {
    const header = '| ' + Array(tableCols).fill('Header').join(' | ') + ' |';
    const separator = '| ' + Array(tableCols).fill('---').join(' | ') + ' |';
    const rows = Array(tableRows - 1)
      .fill(null)
      .map(() => '| ' + Array(tableCols).fill('Cell').join(' | ') + ' |')
      .join('\n');
    const table = `${header}\n${separator}\n${rows}`;
    onInsert(table);
    setShowTableDialog(false);
    onClose();
  };

  // 链接
  const handleLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      onInsert(`[${text}](${linkUrl})`);
    }
    setShowLinkDialog(false);
    setLinkText('');
    setLinkUrl('');
    onClose();
  };

  // 选择本地图片
  const handleSelectImage = async () => {
    if (window.electronAPI) {
      // Electron 环境
      const result = await window.electronAPI.showOpenDialog({
        title: 'Select Image',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileResult = await window.electronAPI.readImageFile(filePath);
        if (fileResult.success && fileResult.base64 !== undefined) {
          const fileName = filePath.split(/[\\/]/).pop() || 'image';
          
          setSelectedImage({
            name: fileName,
            size: fileResult.size || 0,
            base64: fileResult.base64,
            mimeType: fileResult.mimeType || 'image/png'
          });
          setImagePreview(`data:${fileResult.mimeType};base64,${fileResult.base64}`);
          setImageAlt(fileName.replace(/\.[^/.]+$/, ''));
        } else {
          // 使用 toast 提示错误
          console.error('Failed to read image:', fileResult.error);
        }
      }
    } else {
      // Web 环境 - 触发文件选择
      fileInputRef.current?.click();
    }
  };

  // Web 环境文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage({
          name: file.name,
          size: file.size,
          base64: base64.split(',')[1],
          mimeType: file.type
        });
        setImagePreview(base64);
        setImageAlt(file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // 重置以便再次选择
  };

  // 插入图片
  const handleImage = () => {
    if (imageMode === 'url' && imageUrl) {
      onInsert(`![${imageAlt || 'image'}](${imageUrl})`);
    } else if (imageMode === 'file' && selectedImage) {
      const base64Url = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;
      onInsert(`![${imageAlt || 'image'}](${base64Url})`);
    }
    
    // 重置状态
    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
    setSelectedImage(null);
    setImagePreview('');
    setImageMode('url');
    onClose();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <div ref={menuRef} className="context-menu" style={menuStyle}>
        {/* 标题 */}
        <div
          className="context-menu-item has-submenu"
          onMouseEnter={() => setShowHeadingSubmenu(true)}
          onMouseLeave={() => setShowHeadingSubmenu(false)}
        >
          <span className="menu-icon"><Icons.Heading /></span>
          <span className="menu-label">Heading</span>
          <span className="menu-arrow">▶</span>
          {showHeadingSubmenu && (
            <div className="context-submenu heading-submenu">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div
                  key={level}
                  className={`context-menu-item heading-item-${level}`}
                  onClick={() => handleHeading(level)}
                >
                  <span className="menu-label">Heading {level}</span>
                  <span className="menu-shortcut">{'#'.repeat(level)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="context-menu-divider" />

        {/* 文本格式 */}
        <div className="context-menu-item" onClick={() => { onWrapSelection('**', '**'); onClose(); }}>
          <span className="menu-icon"><Icons.Bold /></span>
          <span className="menu-label">Bold</span>
          <span className="menu-shortcut">Ctrl+B</span>
        </div>
        <div className="context-menu-item" onClick={() => { onWrapSelection('*', '*'); onClose(); }}>
          <span className="menu-icon"><Icons.Italic /></span>
          <span className="menu-label">Italic</span>
          <span className="menu-shortcut">Ctrl+I</span>
        </div>
        <div className="context-menu-item" onClick={() => { onWrapSelection('~~', '~~'); onClose(); }}>
          <span className="menu-icon"><Icons.Strikethrough /></span>
          <span className="menu-label">Strikethrough</span>
        </div>
        <div className="context-menu-item" onClick={() => { onWrapSelection('`', '`'); onClose(); }}>
          <span className="menu-icon"><Icons.Code /></span>
          <span className="menu-label">Inline Code</span>
        </div>

        <div className="context-menu-divider" />

        {/* 代码块 */}
        <div
          className="context-menu-item has-submenu"
          onMouseEnter={() => setShowCodeSubmenu(true)}
          onMouseLeave={() => setShowCodeSubmenu(false)}
        >
          <span className="menu-icon"><Icons.CodeBlock /></span>
          <span className="menu-label">Code Block</span>
          <span className="menu-arrow">▶</span>
          {showCodeSubmenu && (
            <div className="context-submenu code-submenu">
              {CODE_LANGUAGES.map((lang) => (
                <div
                  key={lang.value}
                  className="context-menu-item"
                  onClick={() => handleCodeBlock(lang.value)}
                >
                  <span className="menu-label">{lang.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="context-menu-divider" />

        {/* 链接和图片 */}
        <div className="context-menu-item" onClick={() => setShowLinkDialog(true)}>
          <span className="menu-icon"><Icons.Link /></span>
          <span className="menu-label">Insert Link</span>
        </div>
        <div className="context-menu-item" onClick={() => setShowImageDialog(true)}>
          <span className="menu-icon"><Icons.Image /></span>
          <span className="menu-label">Insert Image</span>
        </div>

        <div className="context-menu-divider" />

        {/* 列表 */}
        <div
          className="context-menu-item has-submenu"
          onMouseEnter={() => setShowListSubmenu(true)}
          onMouseLeave={() => setShowListSubmenu(false)}
        >
          <span className="menu-icon"><Icons.List /></span>
          <span className="menu-label">List</span>
          <span className="menu-arrow">▶</span>
          {showListSubmenu && (
            <div className="context-submenu">
              <div className="context-menu-item" onClick={() => { onInsert('- '); onClose(); }}>
                <span className="menu-icon"><Icons.List /></span>
                <span className="menu-label">Bullet List</span>
              </div>
              <div className="context-menu-item" onClick={() => { onInsert('1. '); onClose(); }}>
                <span className="menu-icon"><Icons.ListOrdered /></span>
                <span className="menu-label">Numbered List</span>
              </div>
              <div className="context-menu-item" onClick={() => { onInsert('- [ ] '); onClose(); }}>
                <span className="menu-icon"><Icons.ListCheck /></span>
                <span className="menu-label">Task List</span>
              </div>
            </div>
          )}
        </div>

        {/* 引用 */}
        <div className="context-menu-item" onClick={() => { onInsert('> '); onClose(); }}>
          <span className="menu-icon"><Icons.Quote /></span>
          <span className="menu-label">Quote</span>
        </div>

        {/* 表格 */}
        <div className="context-menu-item" onClick={() => setShowTableDialog(true)}>
          <span className="menu-icon"><Icons.Table /></span>
          <span className="menu-label">Insert Table</span>
        </div>

        <div className="context-menu-divider" />

        {/* 分割线 */}
        <div className="context-menu-item" onClick={() => { onInsert('\n\n---\n\n'); onClose(); }}>
          <span className="menu-icon"><Icons.HorizontalRule /></span>
          <span className="menu-label">Horizontal Rule</span>
        </div>
      </div>

      {/* 链接对话框 */}
      {showLinkDialog && (
        <div className="context-dialog-overlay" onClick={() => setShowLinkDialog(false)}>
          <div className="context-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Insert Link</h3>
            <input
              type="text"
              placeholder="Link text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={() => setShowLinkDialog(false)}>Cancel</button>
              <button className="primary" onClick={handleLink}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* 图片对话框 */}
      {showImageDialog && (
        <div className="context-dialog-overlay" onClick={() => setShowImageDialog(false)}>
          <div className="context-dialog image-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Insert Image</h3>
            
            {/* 模式切换 */}
            <div className="image-mode-tabs">
              <button 
                className={imageMode === 'url' ? 'active' : ''} 
                onClick={() => setImageMode('url')}
              >
                From URL
              </button>
              <button 
                className={imageMode === 'file' ? 'active' : ''} 
                onClick={() => setImageMode('file')}
              >
                From File
              </button>
            </div>

            {/* URL 模式 */}
            {imageMode === 'url' && (
              <>
                <input
                  type="text"
                  placeholder="Alt text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
                <input
                  type="url"
                  placeholder="Image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  autoFocus
                />
              </>
            )}

            {/* 文件模式 */}
            {imageMode === 'file' && (
              <div className="image-file-section">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                {selectedImage ? (
                  <div className="selected-image-info">
                    {imagePreview && (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      </div>
                    )}
                    <div className="image-details">
                      <span className="image-name">{selectedImage.name}</span>
                      <span className="image-size">{formatFileSize(selectedImage.size)}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Alt text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                    />
                    <button className="change-image-btn" onClick={handleSelectImage}>
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div className="select-image-btn" onClick={handleSelectImage}>
                    <span className="select-icon">📷</span>
                    <span className="select-text">Click to select image</span>
                    <span className="select-hint">PNG, JPG, GIF, WEBP, SVG, BMP</span>
                  </div>
                )}
              </div>
            )}

            <div className="dialog-buttons">
              <button onClick={() => {
                setShowImageDialog(false);
                setSelectedImage(null);
                setImagePreview('');
                setImageMode('url');
              }}>Cancel</button>
              <button 
                className="primary" 
                onClick={handleImage}
                disabled={imageMode === 'url' ? !imageUrl : !selectedImage}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 表格对话框 */}
      {showTableDialog && (
        <div className="context-dialog-overlay" onClick={() => setShowTableDialog(false)}>
          <div className="context-dialog table-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Insert Table</h3>
            <div className="table-size-row">
              <label>
                Rows:
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
                />
              </label>
              <label>
                Columns:
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                />
              </label>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowTableDialog(false)}>Cancel</button>
              <button className="primary" onClick={handleTable}>
                Insert {tableRows}×{tableCols} Table
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ContextMenu;
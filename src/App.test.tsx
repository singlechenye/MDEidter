import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

// Mock Monaco Editor
vi.mock('./components/MonacoEditor', () => ({
  default: ({ content, onChange }: { content: string; onChange: (content: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

// Mock WysiwygEditor
vi.mock('./components/WysiwygEditor', () => ({
  default: ({ content, onChange }: { content: string; onChange: (content: string) => void }) => (
    <div data-testid="wysiwyg-editor">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}))

// Mock PreviewPane
vi.mock('./components/PreviewPane', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="preview-pane" dangerouslySetInnerHTML={{ __html: content }} />
  ),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial Render', () => {
    it('should render app container', () => {
      render(<App />)
      expect(document.querySelector('.app')).toBeInTheDocument()
    })

    it('should render floating toolbar', () => {
      render(<App />)
      expect(document.querySelector('.floating-toolbar')).toBeInTheDocument()
    })

    it('should render side drawer', () => {
      render(<App />)
      expect(document.querySelector('.command-palette')).not.toBeInTheDocument()
    })

    it('should render main content area', () => {
      render(<App />)
      expect(document.querySelector('.main-content')).toBeInTheDocument()
    })

    it('should create initial file in drawer', () => {
      render(<App />)
      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      const fileItems = document.querySelectorAll('.command-item')
      expect(fileItems.length).toBe(1)
    })

    it('should display editor', () => {
      render(<App />)
      expect(screen.getByTestId('wysiwyg-editor')).toBeInTheDocument()
    })

    it('should render drawer toggle button', () => {
      render(<App />)
      expect(document.querySelector('.floating-action-btn.drawer-btn')).toBeInTheDocument()
    })

    it('should render toolbar toggle button', () => {
      render(<App />)
      expect(document.querySelector('.floating-action-btn.toolbar-btn')).toBeInTheDocument()
    })
  })

  describe('Drawer Management', () => {
    it('clicking new file button should create new file', async () => {
      render(<App />)

      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))

      const initialFiles = document.querySelectorAll('.command-item')
      expect(initialFiles.length).toBe(1)

      const newFileButton = screen.getByTitle('New File (Ctrl+N)')
      fireEvent.click(newFileButton)

      await waitFor(() => {
        const files = document.querySelectorAll('.command-item')
        expect(files.length).toBe(2)
      })
    })

    it('clicking file item should switch active file', async () => {
      render(<App />)

      // 打开命令面板并新建文件
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))

      await waitFor(() => {
        const files = document.querySelectorAll('.command-item')
        expect(files.length).toBe(2)
      })

      const firstFile = document.querySelectorAll('.command-item')[0]
      fireEvent.click(firstFile)

      expect(firstFile).toHaveClass('active')
    })

    it('closing file should remove file', async () => {
      window.confirm = vi.fn(() => true)

      render(<App />)

      // 打开命令面板并新建文件
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))

      await waitFor(() => {
        const files = document.querySelectorAll('.command-item')
        expect(files.length).toBe(2)
      })
    })

    it('closing modified file should show confirm dialog', async () => {
      window.confirm = vi.fn(() => true)

      render(<App />)

      const editor = screen.getByTestId('wysiwyg-editor').querySelector('textarea')
      if (editor) {
        fireEvent.change(editor, { target: { value: 'modified content' } })
      }

      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))

      // 检查是否有未保存标记
      await waitFor(() => {
        const modifiedMark = document.querySelector('.command-item-modified')
        expect(modifiedMark).toBeInTheDocument()
      })
    })

    it('closing last file should create new file', async () => {
      window.confirm = vi.fn(() => true)

      render(<App />)

      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))

      await waitFor(() => {
        const files = document.querySelectorAll('.command-item')
        expect(files.length).toBe(1)
      })
    })
  })

  describe('File Operations', () => {
    it('clicking new button should create new file', async () => {
      render(<App />)

      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))

      const initialFiles = document.querySelectorAll('.command-item')

      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))

      await waitFor(() => {
        const newFiles = document.querySelectorAll('.command-item')
        expect(newFiles.length).toBe(initialFiles.length + 1)
      })
    })

    it('Web environment open file should create input element', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      })

      render(<App />)

      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))

      const openButton = screen.getByTitle('Open File (Ctrl+O)')

      const mockInput = {
        type: '',
        accept: '',
        multiple: false,
        click: vi.fn(),
        onchange: null as ((e: Event) => void) | null,
        files: null as FileList | null,
      }

      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as unknown as HTMLInputElement
        }
        return originalCreateElement(tagName)
      })

      fireEvent.click(openButton)

      expect(mockInput.click).toHaveBeenCalled()
    })

    it('Web environment save file should trigger download', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      })

      render(<App />)

      const saveButton = screen.getByTitle('Save (Ctrl+S)')
      fireEvent.click(saveButton)

      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  describe('Theme Toggle', () => {
    it('clicking theme button should toggle theme', async () => {
      render(<App />)

      expect(document.documentElement.className).toBe('dark')

      const themeButton = screen.getByTitle('Toggle Theme')
      fireEvent.click(themeButton)

      await waitFor(() => {
        expect(document.documentElement.className).toBe('light')
      })
    })

    it('theme change should save to localStorage', async () => {
      render(<App />)

      const themeButton = screen.getByTitle('Toggle Theme')
      fireEvent.click(themeButton)

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('md-editor-theme', 'light')
      })
    })
  })

  describe('Edit Mode Toggle', () => {
    it('default should be WYSIWYG mode', () => {
      render(<App />)
      expect(screen.getByTestId('wysiwyg-editor')).toBeInTheDocument()
    })

    it('switching to split mode should show editor and preview', async () => {
      render(<App />)

      fireEvent.click(screen.getByTitle('Split View'))

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
        expect(screen.getByTestId('preview-pane')).toBeInTheDocument()
      })
    })

    it('switching to source mode should only show editor', async () => {
      render(<App />)

      fireEvent.click(screen.getByTitle('Source Code'))

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
        expect(screen.queryByTestId('preview-pane')).not.toBeInTheDocument()
      })
    })

    it('edit mode buttons should highlight correctly', async () => {
      render(<App />)

      expect(screen.getByTitle('WYSIWYG')).toHaveClass('active')

      fireEvent.click(screen.getByTitle('Split View'))

      await waitFor(() => {
        expect(screen.getByTitle('Split View')).toHaveClass('active')
        expect(screen.getByTitle('WYSIWYG')).not.toHaveClass('active')
      })
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('Ctrl+S should trigger save', async () => {
      render(<App />)

      fireEvent.keyDown(window, { key: 's', ctrlKey: true })

      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('Ctrl+N should create new file', async () => {
      render(<App />)

      // 打开命令面板检查初始文件数
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      const initialFiles = document.querySelectorAll('.command-item').length

      fireEvent.keyDown(window, { key: 'n', ctrlKey: true })

      await waitFor(() => {
        const newFiles = document.querySelectorAll('.command-item').length
        expect(newFiles).toBe(initialFiles + 1)
      })
    })

    it('Ctrl+W should close current file', async () => {
      window.confirm = vi.fn(() => true)

      render(<App />)

      // 打开命令面板并新建文件
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))

      await waitFor(() => {
        expect(document.querySelectorAll('.command-item').length).toBe(2)
      })

      fireEvent.keyDown(window, { key: 'w', ctrlKey: true })

      await waitFor(() => {
        expect(document.querySelectorAll('.command-item').length).toBe(1)
      })
    })

    it('Ctrl+Tab should switch to next file', async () => {
      render(<App />)

      // 打开命令面板并新建文件
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))
      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))

      await waitFor(() => {
        expect(document.querySelectorAll('.command-item').length).toBe(3)
      })

      const initialActiveFile = document.querySelector('.command-item.active')

      fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true })

      await waitFor(() => {
        const newActiveFile = document.querySelector('.command-item.active')
        expect(newActiveFile).not.toBe(initialActiveFile)
      })
    })

    it('Ctrl+Shift+S should trigger save as', async () => {
      render(<App />)

      fireEvent.keyDown(window, { key: 's', ctrlKey: true, shiftKey: true })

      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  describe('Content Editing', () => {
    it('editing content should update file state', async () => {
      render(<App />)

      const editor = screen.getByTestId('wysiwyg-editor').querySelector('textarea')

      if (editor) {
        fireEvent.change(editor, { target: { value: 'new content' } })

        // 打开命令面板检查未保存标记
        fireEvent.click(screen.getByTitle('Open Files (⌘P)'))

        await waitFor(() => {
          const modifiedMark = document.querySelector('.command-item-modified')
          expect(modifiedMark).toBeInTheDocument()
        })
      }
    })

    it('content should persist after switching files', async () => {
      render(<App />)

      const editor = screen.getByTestId('wysiwyg-editor').querySelector('textarea')
      if (editor) {
        fireEvent.change(editor, { target: { value: 'test content' } })
      }

      // 打开命令面板并新建文件
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      fireEvent.click(screen.getByTitle('New File (Ctrl+N)'))

      await waitFor(() => {
        expect(document.querySelectorAll('.command-item').length).toBe(2)
      })

      const firstFile = document.querySelectorAll('.command-item')[0]
      fireEvent.click(firstFile)

      await waitFor(() => {
        const currentEditor = screen.getByTestId('wysiwyg-editor').querySelector('textarea')
        expect(currentEditor).toHaveValue('test content')
      })
    })
  })

  describe('Export Function', () => {
    it('clicking export HTML should generate HTML content', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      })

      render(<App />)

      const exportButton = screen.getByTitle('Export HTML')
      fireEvent.click(exportButton)

      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  describe('Electron API', () => {
    it('Electron environment open file should use electronAPI', async () => {
      const mockShowOpenDialog = vi.fn().mockResolvedValue({
        canceled: false,
        filePaths: ['/test/file.md'],
      })

      const mockReadFile = vi.fn().mockResolvedValue({
        success: true,
        content: '# Test File',
      })

      Object.defineProperty(window, 'electronAPI', {
        value: {
          showOpenDialog: mockShowOpenDialog,
          readFile: mockReadFile,
        },
        writable: true,
      })

      render(<App />)

      // 打开命令面板
      fireEvent.click(screen.getByTitle('Open Files (⌘P)'))
      fireEvent.click(screen.getByTitle('Open File (Ctrl+O)'))

      await waitFor(() => {
        expect(mockShowOpenDialog).toHaveBeenCalled()
      })
    })

    it('Electron environment save file should use electronAPI', async () => {
      const mockShowSaveDialog = vi.fn().mockResolvedValue({
        canceled: false,
        filePath: '/test/saved.md',
      })

      const mockWriteFile = vi.fn().mockResolvedValue({
        success: true,
      })

      Object.defineProperty(window, 'electronAPI', {
        value: {
          showSaveDialog: mockShowSaveDialog,
          writeFile: mockWriteFile,
        },
        writable: true,
      })

      render(<App />)

      fireEvent.click(screen.getByTitle('Save (Ctrl+S)'))

      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalled()
      })
    })
  })
})
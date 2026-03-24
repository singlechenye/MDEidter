import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../Toolbar'
import type { Theme, EditMode } from '../../types'

describe('Toolbar', () => {
  const defaultProps = {
    theme: 'dark' as Theme,
    editMode: 'wysiwyg' as EditMode,
    onThemeChange: vi.fn(),
    onEditModeChange: vi.fn(),
    onSaveFile: vi.fn(),
    onExportHTML: vi.fn(),
    onExportPDF: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onOpenFiles: vi.fn(),
  }

  describe('渲染测试', () => {
    it('应该渲染保存和导出按钮', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.getByTitle('Save (Ctrl+S)')).toBeInTheDocument()
      expect(screen.getByTitle('Export HTML')).toBeInTheDocument()
    })

    it('应该渲染撤销和重做按钮', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument()
      expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument()
    })

    it('应该渲染编辑模式切换按钮', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.getByTitle('WYSIWYG')).toBeInTheDocument()
      expect(screen.getByTitle('Split View')).toBeInTheDocument()
      expect(screen.getByTitle('Source Code')).toBeInTheDocument()
    })

    it('应该渲染主题切换按钮', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.getByTitle('Toggle Theme')).toBeInTheDocument()
    })

    it('应该高亮当前编辑模式', () => {
      render(<Toolbar {...defaultProps} editMode="split" />)

      const splitButton = screen.getByTitle('Split View')
      expect(splitButton).toHaveClass('active')
    })

    it('应该显示正确的主题图标（暗色主题）', () => {
      render(<Toolbar {...defaultProps} theme="dark" />)

      const sunIcon = screen.getByTitle('Toggle Theme').querySelector('circle')
      expect(sunIcon).toBeInTheDocument()
    })

    it('应该显示正确的主题图标（亮色主题）', () => {
      render(<Toolbar {...defaultProps} theme="light" />)

      const moonIcon = screen.getByTitle('Toggle Theme').querySelector('path')
      expect(moonIcon).toBeInTheDocument()
    })
  })

  describe('文件操作测试', () => {
    it('点击保存按钮应该触发 onSaveFile(false)', () => {
      const onSaveFile = vi.fn()
      render(<Toolbar {...defaultProps} onSaveFile={onSaveFile} />)

      fireEvent.click(screen.getByTitle('Save (Ctrl+S)'))

      expect(onSaveFile).toHaveBeenCalledWith(false)
    })

    it('点击导出 HTML 按钮应该触发 onExportHTML', () => {
      const onExportHTML = vi.fn()
      render(<Toolbar {...defaultProps} onExportHTML={onExportHTML} />)

      fireEvent.click(screen.getByTitle('Export HTML'))

      expect(onExportHTML).toHaveBeenCalledTimes(1)
    })
  })

  describe('撤销重做测试', () => {
    it('点击撤销按钮应该触发 onUndo', () => {
      const onUndo = vi.fn()
      render(<Toolbar {...defaultProps} onUndo={onUndo} />)

      fireEvent.click(screen.getByTitle('Undo (Ctrl+Z)'))

      expect(onUndo).toHaveBeenCalledTimes(1)
    })

    it('点击重做按钮应该触发 onRedo', () => {
      const onRedo = vi.fn()
      render(<Toolbar {...defaultProps} onRedo={onRedo} />)

      fireEvent.click(screen.getByTitle('Redo (Ctrl+Y)'))

      expect(onRedo).toHaveBeenCalledTimes(1)
    })
  })

  describe('编辑模式切换测试', () => {
    it('点击 WYS 按钮应该触发 onEditModeChange', () => {
      const onEditModeChange = vi.fn()
      render(<Toolbar {...defaultProps} editMode="split" onEditModeChange={onEditModeChange} />)

      fireEvent.click(screen.getByTitle('WYSIWYG'))

      expect(onEditModeChange).toHaveBeenCalledWith('wysiwyg')
    })

    it('点击 Split 按钮应该触发 onEditModeChange', () => {
      const onEditModeChange = vi.fn()
      render(<Toolbar {...defaultProps} editMode="wysiwyg" onEditModeChange={onEditModeChange} />)

      fireEvent.click(screen.getByTitle('Split View'))

      expect(onEditModeChange).toHaveBeenCalledWith('split')
    })

    it('点击 Src 按钮应该触发 onEditModeChange', () => {
      const onEditModeChange = vi.fn()
      render(<Toolbar {...defaultProps} editMode="wysiwyg" onEditModeChange={onEditModeChange} />)

      fireEvent.click(screen.getByTitle('Source Code'))

      expect(onEditModeChange).toHaveBeenCalledWith('source')
    })

    it('WYS 模式应该高亮对应按钮', () => {
      render(<Toolbar {...defaultProps} editMode="wysiwyg" />)

      const wysiwygButton = screen.getByTitle('WYSIWYG')
      expect(wysiwygButton).toHaveClass('active')

      const splitButton = screen.getByTitle('Split View')
      expect(splitButton).not.toHaveClass('active')

      const sourceButton = screen.getByTitle('Source Code')
      expect(sourceButton).not.toHaveClass('active')
    })

    it('Split 模式应该高亮对应按钮', () => {
      render(<Toolbar {...defaultProps} editMode="split" />)

      const wysiwygButton = screen.getByTitle('WYSIWYG')
      expect(wysiwygButton).not.toHaveClass('active')

      const splitButton = screen.getByTitle('Split View')
      expect(splitButton).toHaveClass('active')

      const sourceButton = screen.getByTitle('Source Code')
      expect(sourceButton).not.toHaveClass('active')
    })

    it('Src 模式应该高亮对应按钮', () => {
      render(<Toolbar {...defaultProps} editMode="source" />)

      const wysiwygButton = screen.getByTitle('WYSIWYG')
      expect(wysiwygButton).not.toHaveClass('active')

      const splitButton = screen.getByTitle('Split View')
      expect(splitButton).not.toHaveClass('active')

      const sourceButton = screen.getByTitle('Source Code')
      expect(sourceButton).toHaveClass('active')
    })
  })

  describe('主题切换测试', () => {
    it('暗色主题下点击应该切换到亮色主题', () => {
      const onThemeChange = vi.fn()
      render(<Toolbar {...defaultProps} theme="dark" onThemeChange={onThemeChange} />)

      fireEvent.click(screen.getByTitle('Toggle Theme'))

      expect(onThemeChange).toHaveBeenCalledWith('light')
    })

    it('亮色主题下点击应该切换到暗色主题', () => {
      const onThemeChange = vi.fn()
      render(<Toolbar {...defaultProps} theme="light" onThemeChange={onThemeChange} />)

      fireEvent.click(screen.getByTitle('Toggle Theme'))

      expect(onThemeChange).toHaveBeenCalledWith('dark')
    })
  })

  describe('按钮组测试', () => {
    it('编辑模式切换按钮应该在同一个组内', () => {
      render(<Toolbar {...defaultProps} />)

      const editModesGroup = document.querySelector('.edit-modes')
      expect(editModesGroup).toBeInTheDocument()
      expect(editModesGroup?.querySelector('[title="WYSIWYG"]')).toBeInTheDocument()
      expect(editModesGroup?.querySelector('[title="Split View"]')).toBeInTheDocument()
      expect(editModesGroup?.querySelector('[title="Source Code"]')).toBeInTheDocument()
    })
  })

  describe('窗口控制按钮测试', () => {
    it('当提供窗口控制回调时应该渲染窗口控制按钮', () => {
      render(
        <Toolbar
          {...defaultProps}
          onMinimize={vi.fn()}
          onMaximize={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTitle('Minimize')).toBeInTheDocument()
      expect(screen.getByTitle('Maximize')).toBeInTheDocument()
      expect(screen.getByTitle('Close')).toBeInTheDocument()
    })

    it('当不提供窗口控制回调时不应该渲染窗口控制按钮', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.queryByTitle('Minimize')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Maximize')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Close')).not.toBeInTheDocument()
    })

    it('点击最小化按钮应该触发 onMinimize', () => {
      const onMinimize = vi.fn()
      render(<Toolbar {...defaultProps} onMinimize={onMinimize} />)

      fireEvent.click(screen.getByTitle('Minimize'))

      expect(onMinimize).toHaveBeenCalledTimes(1)
    })

    it('点击最大化按钮应该触发 onMaximize', () => {
      const onMaximize = vi.fn()
      render(<Toolbar {...defaultProps} onMaximize={onMaximize} />)

      fireEvent.click(screen.getByTitle('Maximize'))

      expect(onMaximize).toHaveBeenCalledTimes(1)
    })

    it('点击关闭按钮应该触发 onClose', () => {
      const onClose = vi.fn()
      render(<Toolbar {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByTitle('Close'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
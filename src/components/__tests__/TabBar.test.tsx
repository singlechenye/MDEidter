import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TabBar from '../TabBar'
import type { Tab } from '../../types'

describe('TabBar', () => {
  const mockTabs: Tab[] = [
    { id: 'tab-1', title: '文档1.md', filePath: '/path/doc1.md', content: '# Doc 1', isModified: false },
    { id: 'tab-2', title: '文档2.md', filePath: '/path/doc2.md', content: '# Doc 2', isModified: true },
    { id: 'tab-3', title: '未命名', filePath: null, content: '', isModified: false },
  ]

  const defaultProps = {
    tabs: mockTabs,
    activeTabId: 'tab-1',
    onTabClick: vi.fn(),
    onTabClose: vi.fn(),
    onNewTab: vi.fn(),
  }

  describe('渲染测试', () => {
    it('应该渲染所有标签页', () => {
      render(<TabBar {...defaultProps} />)
      
      expect(screen.getByText('文档1.md')).toBeInTheDocument()
      expect(screen.getByText('文档2.md')).toBeInTheDocument()
      expect(screen.getByText('未命名')).toBeInTheDocument()
    })

    it('应该高亮当前活动的标签页', () => {
      render(<TabBar {...defaultProps} activeTabId="tab-2" />)
      
      const activeTab = screen.getByText('文档2.md').closest('.tab')
      expect(activeTab).toHaveClass('active')
    })

    it('应该显示修改标记', () => {
      render(<TabBar {...defaultProps} />)
      
      // 文档2 有修改标记
      const modifiedTab = screen.getByText('文档2.md').parentElement
      expect(modifiedTab).toHaveTextContent('•')
    })

    it('应该显示新建标签按钮', () => {
      render(<TabBar {...defaultProps} />)
      
      expect(screen.getByTitle('New Tab')).toBeInTheDocument()
    })

    it('每个标签页应该有关闭按钮', () => {
      render(<TabBar {...defaultProps} />)
      
      const closeButtons = screen.getAllByTitle('Close')
      expect(closeButtons).toHaveLength(3)
    })
  })

  describe('交互测试', () => {
    it('点击标签页应该触发 onTabClick', () => {
      const onTabClick = vi.fn()
      render(<TabBar {...defaultProps} onTabClick={onTabClick} />)
      
      fireEvent.click(screen.getByText('文档2.md'))
      
      expect(onTabClick).toHaveBeenCalledWith('tab-2')
    })

    it('点击关闭按钮应该触发 onTabClose', () => {
      const onTabClose = vi.fn()
      render(<TabBar {...defaultProps} onTabClose={onTabClose} />)
      
      const closeButtons = screen.getAllByTitle('Close')
      fireEvent.click(closeButtons[1]) // 点击第二个标签的关闭按钮
      
      expect(onTabClose).toHaveBeenCalledWith('tab-2')
    })

    it('点击关闭按钮不应该触发 onTabClick', () => {
      const onTabClick = vi.fn()
      const onTabClose = vi.fn()
      render(<TabBar {...defaultProps} onTabClick={onTabClick} onTabClose={onTabClose} />)
      
      const closeButtons = screen.getAllByTitle('Close')
      fireEvent.click(closeButtons[0])
      
      expect(onTabClick).not.toHaveBeenCalled()
      expect(onTabClose).toHaveBeenCalled()
    })

    it('点击新建按钮应该触发 onNewTab', () => {
      const onNewTab = vi.fn()
      render(<TabBar {...defaultProps} onNewTab={onNewTab} />)
      
      fireEvent.click(screen.getByTitle('New Tab'))
      
      expect(onNewTab).toHaveBeenCalled()
    })
  })

  describe('边界情况', () => {
    it('应该处理空标签列表', () => {
      render(<TabBar {...defaultProps} tabs={[]} activeTabId={null} />)
      
      expect(screen.getByTitle('New Tab')).toBeInTheDocument()
    })

    it('应该处理长文件名', () => {
      const longNameTab: Tab[] = [
        { 
          id: 'tab-long', 
          title: '这是一个非常非常非常非常非常长的文件名用于测试显示效果.md', 
          filePath: '/path/long.md', 
          content: '', 
          isModified: false 
        },
      ]
      
      render(<TabBar {...defaultProps} tabs={longNameTab} activeTabId="tab-long" />)
      
      expect(screen.getByText('这是一个非常非常非常非常非常长的文件名用于测试显示效果.md')).toBeInTheDocument()
    })

    it('应该正确处理无 filePath 的标签', () => {
      const noPathTabs: Tab[] = [
        { id: 'tab-nopath', title: '未命名', filePath: null, content: '', isModified: false },
      ]
      
      render(<TabBar {...defaultProps} tabs={noPathTabs} activeTabId="tab-nopath" />)
      
      expect(screen.getByText('未命名')).toBeInTheDocument()
    })
  })

  describe('样式测试', () => {
    it('活动标签应该有 active 类', () => {
      render(<TabBar {...defaultProps} activeTabId="tab-1" />)
      
      const tabElement = screen.getByText('文档1.md').closest('.tab')
      
      expect(tabElement).toHaveClass('active')
    })

    it('非活动标签不应该有 active 类', () => {
      render(<TabBar {...defaultProps} activeTabId="tab-1" />)
      
      const inactiveTab = screen.getByText('文档2.md').closest('.tab')
      expect(inactiveTab).not.toHaveClass('active')
    })
  })
})
import { useRef } from 'react';
import MarkdownIt from 'markdown-it';
import type { PreviewPaneProps } from '../types';

// 预览组件
function PreviewPane({
  content,
  theme
}: PreviewPaneProps) {
  const mdParser = useRef<MarkdownIt>(new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }));

  return (
    <div className={`preview-pane ${theme}`}>
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: mdParser.current.render(content) }}
      />
    </div>
  );
}

export default PreviewPane;
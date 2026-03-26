import { useRef, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import type { PreviewPaneProps } from '../types';

// 将 Windows 绝对路径转换为 file:// URL
function convertLocalPathToUrl(path: string): string {
  // 检测 Windows 绝对路径 (如 C:\path 或 C:/path)
  const windowsPathRegex = /^[a-zA-Z]:[/\\]/;
  if (windowsPathRegex.test(path)) {
    // 将反斜杠转换为正斜杠，并添加 file:/// 前缀
    return 'file:///' + path.replace(/\\/g, '/');
  }
  return path;
}

// 处理 Markdown 内容中的本地图片路径
function processLocalImagePaths(content: string): string {
  // 匹配 Markdown 图片语法 ![alt](path)
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, path) => {
    const convertedPath = convertLocalPathToUrl(path);
    return `![${alt}](${convertedPath})`;
  });
}

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

  // 处理本地图片路径
  const processedContent = useMemo(() => {
    return processLocalImagePaths(content);
  }, [content]);

  return (
    <div className={`preview-pane ${theme}`}>
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: mdParser.current.render(processedContent) }}
      />
    </div>
  );
}

export default PreviewPane;
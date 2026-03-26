import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';
import type { MonacoEditorProps } from '../types';
import { editorManager } from '../utils/editorManager';

// Base64 图片正则
const BASE64_IMAGE_REGEX = /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+\)/g;

// Monaco 编辑器包装组件
function MonacoEditorWrapper({
  content,
  onChange,
  theme
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const lastContentRef = useRef(content);

  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    renderLineHighlight: 'none',
    cursorSmoothCaretAnimation: 'on',
    folding: true,
    foldingStrategy: 'auto',
    foldingHighlight: true,
    showFoldingControls: 'always',
    contextmenu: false, // 禁用 Monaco 默认右键菜单，使用自定义菜单
  };

  // 外部内容更新（切换标签页等）
  useEffect(() => {
    if (editorRef.current && content !== lastContentRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== content) {
        editorRef.current.setValue(content);
        lastContentRef.current = content;
      }
    }
  }, [content]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    lastContentRef.current = content;
    editorManager.setMonacoEditor(editor);

    // 注册自定义折叠范围提供者
    const foldingProvider = monaco.languages.registerFoldingRangeProvider('markdown', {
      provideFoldingRanges: (model): languages.FoldingRange[] => {
        const ranges: languages.FoldingRange[] = [];
        const text = model.getValue();

        const regex = new RegExp(BASE64_IMAGE_REGEX.source, 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
          if (match[0].length > 200) {
            const startPos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + match[0].length);

            // 确保折叠范围有效
            if (startPos.lineNumber < endPos.lineNumber) {
              ranges.push({
                start: startPos.lineNumber,
                end: endPos.lineNumber,
                kind: monaco.languages.FoldingRangeKind.Region
              });
            } else if (startPos.lineNumber === endPos.lineNumber) {
              // 同一行，创建一个虚拟的折叠范围
              ranges.push({
                start: startPos.lineNumber,
                end: endPos.lineNumber,
                kind: monaco.languages.FoldingRangeKind.Region
              });
            }
          }
        }

        return ranges;
      }
    });

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      lastContentRef.current = value;
      onChange(value);
    });

    // 存储以便清理
    (editor as any)._foldingProvider = foldingProvider;

    // 在原生 DOM 上监听右键事件，确保自定义菜单能正常工作
    const domNode = editor.getDomNode();
    if (domNode) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 创建新的事件并派发到父元素
        const newEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        domNode.parentElement?.dispatchEvent(newEvent);
      };
      domNode.addEventListener('contextmenu', handleContextMenu, true);
      (editor as any)._contextMenuHandler = handleContextMenu;
    }
  };

  // 组件卸载时注销编辑器
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        const foldingProvider = (editorRef.current as any)._foldingProvider;
        if (foldingProvider) {
          foldingProvider.dispose();
        }
        const contextMenuHandler = (editorRef.current as any)._contextMenuHandler;
        if (contextMenuHandler) {
          const domNode = editorRef.current.getDomNode();
          if (domNode) {
            domNode.removeEventListener('contextmenu', contextMenuHandler, true);
          }
        }
      }
      editorManager.setMonacoEditor(null);
    };
  }, []);

  return (
    <div
      style={{ height: '100%', width: '100%' }}
      onContextMenu={() => {
        // 不阻止冒泡，让事件传播到 App.tsx 的 handleContextMenu
      }}
    >
      <Editor
        height="100%"
        defaultLanguage="markdown"
        defaultValue={content}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={editorOptions}
        onMount={handleEditorDidMount}
        loading={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#8b949e' : '#6e7681'
          }}>
            Loading editor...
          </div>
        }
      />
    </div>
  );
}

export default MonacoEditorWrapper;
import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { MonacoEditorProps } from '../types';
import { editorManager } from '../utils/editorManager';

// Monaco 编辑器包装组件
function MonacoEditorWrapper({
  content,
  onChange,
  theme
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lastContentRef = useRef(content);

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineNumbers: 'on' as const,
    wordWrap: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    renderLineHighlight: 'none' as const,
    cursorSmoothCaretAnimation: 'on' as const,
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

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    lastContentRef.current = content;
    editorManager.setMonacoEditor(editor);

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      lastContentRef.current = value;
      onChange(value);
    });
  };

  // 组件卸载时注销编辑器
  useEffect(() => {
    return () => {
      editorManager.setMonacoEditor(null);
    };
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      defaultValue={content}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      options={editorOptions}
      onMount={handleEditorDidMount}
    />
  );
}

export default MonacoEditorWrapper;
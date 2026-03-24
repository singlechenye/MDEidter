import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultHighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap, undo, redo } from '@codemirror/commands';
import type { WysiwygEditorProps } from '../types';
import { editorManager } from '../utils/editorManager';

// 自定义主题
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#24292f',
    height: '100%'
  },
  '.cm-content': {
    caretColor: '#24292f',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6',
    padding: '24px 0'
  },
  '.cm-cursor': {
    borderLeftColor: '#24292f'
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#b3d7ff'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)'
  },
  '.cm-gutters': {
    backgroundColor: '#ffffff',
    color: '#8b949e',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 16px',
    minWidth: '48px'
  },
  '.cm-heading1': { fontSize: '2em', fontWeight: '600', color: '#24292f' },
  '.cm-heading2': { fontSize: '1.5em', fontWeight: '600', color: '#24292f' },
  '.cm-heading3': { fontSize: '1.25em', fontWeight: '600', color: '#24292f' },
  '.cm-strong': { fontWeight: '600' },
  '.cm-emphasis': { fontStyle: 'italic' },
  '.cm-strikethrough': { textDecoration: 'line-through' },
  '.cm-link': { color: '#818cf8', textDecoration: 'underline' },
  '.cm-url': { color: '#818cf8' },
  '.cm-quote': { color: '#6e7681', fontStyle: 'italic' },
  '.cm-list': { color: '#818cf8' },
  '.cm-meta': { color: '#818cf8' }
}, { dark: false });

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e2028',
    color: '#c9d1d9',
    height: '100%'
  },
  '.cm-content': {
    caretColor: '#c9d1d9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6',
    padding: '24px 0'
  },
  '.cm-cursor': {
    borderLeftColor: '#c9d1d9'
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(129, 140, 248, 0.3)'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  '.cm-gutters': {
    backgroundColor: '#1e2028',
    color: '#4d5363',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 16px',
    minWidth: '48px'
  },
  '.cm-heading1': { fontSize: '2em', fontWeight: '600', color: '#e6edf3' },
  '.cm-heading2': { fontSize: '1.5em', fontWeight: '600', color: '#e6edf3' },
  '.cm-heading3': { fontSize: '1.25em', fontWeight: '600', color: '#e6edf3' },
  '.cm-strong': { fontWeight: '600', color: '#e6edf3' },
  '.cm-emphasis': { fontStyle: 'italic', color: '#a5b4fc' },
  '.cm-strikethrough': { textDecoration: 'line-through' },
  '.cm-link': { color: '#818cf8', textDecoration: 'underline' },
  '.cm-url': { color: '#818cf8' },
  '.cm-quote': { color: '#6e7681', fontStyle: 'italic' },
  '.cm-list': { color: '#818cf8' },
  '.cm-meta': { color: '#818cf8' }
}, { dark: true });

// 创建编辑器
function WysiwygEditor({ content, onChange, theme }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastContentRef = useRef(content);

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        lastContentRef.current = newContent;
        onChange(newContent);
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        markdown({
          base: markdownLanguage,
          codeLanguages: languages
        }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          ...historyKeymap,
          { key: 'Mod-z', run: undo },
          { key: 'Mod-y', run: redo },
          { key: 'Mod-Shift-z', run: redo },
          { key: 'Tab', run: (view) => {
            view.dispatch(view.state.replaceSelection('  '));
            return true;
          }}
        ]),
        updateListener,
        EditorView.lineWrapping,
        theme === 'dark' ? darkTheme : lightTheme,
        oneDark
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;
    lastContentRef.current = content;
    editorManager.setCodeMirrorView(view);

    return () => {
      editorManager.setCodeMirrorView(null);
      view.destroy();
      viewRef.current = null;
    };
  }, [theme]);

  // 外部内容更新（切换标签页等）
  useEffect(() => {
    if (viewRef.current && content !== lastContentRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: content
          }
        });
        lastContentRef.current = content;
      }
    }
  }, [content]);

  return (
    <div
      ref={editorRef}
      className={`wysiwyg-editor-cm ${theme}`}
      style={{ height: '100%', overflow: 'auto' }}
    />
  );
}

export default WysiwygEditor;
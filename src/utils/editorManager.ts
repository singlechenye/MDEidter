import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import type { editor } from 'monaco-editor';

// 编辑器管理器
class EditorManager {
  private codeMirrorView: EditorView | null = null;
  private monacoEditor: editor.IStandaloneCodeEditor | null = null;
  private listeners: Set<() => void> = new Set();

  setCodeMirrorView(view: EditorView | null) {
    this.codeMirrorView = view;
    this.notify();
  }

  setMonacoEditor(editor: editor.IStandaloneCodeEditor | null) {
    this.monacoEditor = editor;
    this.notify();
  }

  getCodeMirrorView() {
    return this.codeMirrorView;
  }

  getMonacoEditor() {
    return this.monacoEditor;
  }

  // 撤销
  undo(): boolean {
    if (this.codeMirrorView) {
      return undo(this.codeMirrorView);
    }
    if (this.monacoEditor) {
      this.monacoEditor.trigger('toolbar', 'undo', null);
      return true;
    }
    return false;
  }

  // 重做
  redo(): boolean {
    if (this.codeMirrorView) {
      return redo(this.codeMirrorView);
    }
    if (this.monacoEditor) {
      this.monacoEditor.trigger('toolbar', 'redo', null);
      return true;
    }
    return false;
  }

  // 订阅变化
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

// 全局实例
export const editorManager = new EditorManager();
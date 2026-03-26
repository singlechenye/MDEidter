import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';

// 编辑器管理器
class EditorManager {
  private codeMirrorView: EditorView | null = null;
  private monacoEditor: any = null;
  private listeners: Set<() => void> = new Set();

  setCodeMirrorView(view: EditorView | null) {
    this.codeMirrorView = view;
    this.notify();
  }

  setMonacoEditor(editor: any) {
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

  // 插入文本
  insertText(text: string, cursorOffset?: number): boolean {
    // 使用 Monaco Editor
    if (this.monacoEditor) {
      const position = this.monacoEditor.getPosition();
      if (position) {
        const selection = this.monacoEditor.getSelection();
        const range = selection || new (window as any).monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);

        this.monacoEditor.executeEdits('insert', [{
          range,
          text,
          forceMoveMarkers: true,
        }]);

        if (cursorOffset !== undefined) {
          const lines = text.substring(0, cursorOffset).split('\n');
          const newLine = position.lineNumber + lines.length - 1;
          const newColumn = lines.length === 1 ? position.column + cursorOffset : lines[lines.length - 1].length + 1;
          this.monacoEditor.setPosition({ lineNumber: newLine, column: newColumn });
        }

        this.monacoEditor.focus();
        return true;
      }
    }

    // 使用 CodeMirror
    if (this.codeMirrorView) {
      const { from, to } = this.codeMirrorView.state.selection.main;
      const insertPos = cursorOffset !== undefined ? from + cursorOffset : from + text.length;

      this.codeMirrorView.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: insertPos },
      });

      this.codeMirrorView.focus();
      return true;
    }

    return false;
  }

  // 包裹选中文本
  wrapSelection(before: string, after: string): boolean {
    // 使用 Monaco Editor
    if (this.monacoEditor) {
      const selection = this.monacoEditor.getSelection();
      const model = this.monacoEditor.getModel();
      if (selection && model) {
        const selectedText = model.getValueInRange(selection);
        const newText = before + selectedText + after;

        this.monacoEditor.executeEdits('format', [{
          range: selection,
          text: newText,
        }]);

        if (!selectedText) {
          const position = this.monacoEditor.getPosition();
          if (position) {
            this.monacoEditor.setPosition({
              lineNumber: position.lineNumber,
              column: position.column - after.length,
            });
          }
        }

        this.monacoEditor.focus();
        return true;
      }
    }

    // 使用 CodeMirror
    if (this.codeMirrorView) {
      const { from, to } = this.codeMirrorView.state.selection.main;
      const selectedText = this.codeMirrorView.state.sliceDoc(from, to);
      const newText = before + selectedText + after;
      const cursorPos = selectedText ? from + newText.length : from + before.length;

      this.codeMirrorView.dispatch({
        changes: { from, to, insert: newText },
        selection: { anchor: cursorPos },
      });

      this.codeMirrorView.focus();
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
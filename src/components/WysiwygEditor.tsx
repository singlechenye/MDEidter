import { useEffect, useRef } from 'react';
import { RangeSetBuilder, Decoration, EditorView, ViewPlugin, WidgetType, EditorState, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '../utils/cmImports';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultHighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap, undo, redo } from '@codemirror/commands';
import type { WysiwygEditorProps } from '../types';
import { editorManager } from '../utils/editorManager';

// ============ Image Related ============

const BASE64_IMAGE_REGEX = /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)\)/g;
const LOCAL_IMAGE_REGEX = /!\[([^\]]*)\]\(([a-zA-Z]:[/\\][^)]+)\)/g;
const HTML_IMG_REGEX = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;

function convertLocalPathToUrl(path: string): string {
  const windowsPathRegex = /^[a-zA-Z]:[/\\]/;
  if (windowsPathRegex.test(path)) {
    return 'file:///' + path.replace(/\\/g, '/');
  }
  return path;
}

function extractAttr(attrs: string, name: string): string | null {
  const regex = new RegExp(name + '=["\']([^"\']+)["\']', 'i');
  const match = attrs.match(regex);
  return match ? match[1] : null;
}

class Base64ImageWidget extends WidgetType {
  constructor(
    readonly altText: string,
    readonly mimeType: string,
    readonly base64Data: string
  ) {
    super();
  }

  toDOM() {
    const container = document.createElement('span');
    container.className = 'cm-image-preview-container';
    const img = document.createElement('img');
    img.src = 'data:image/' + this.mimeType + ';base64,' + this.base64Data;
    img.alt = this.altText;
    img.className = 'cm-image-preview';
    container.appendChild(img);
    return container;
  }

  eq(other: Base64ImageWidget) {
    return this.base64Data === other.base64Data && this.altText === other.altText;
  }

  ignoreEvent() {
    return false;
  }
}

class LocalImageWidget extends WidgetType {
  constructor(
    readonly altText: string,
    readonly filePath: string,
    readonly width?: string,
    readonly height?: string
  ) {
    super();
  }

  toDOM() {
    const container = document.createElement('span');
    container.className = 'cm-image-preview-container';
    const img = document.createElement('img');
    img.src = convertLocalPathToUrl(this.filePath);
    img.alt = this.altText || 'image';
    img.className = 'cm-image-preview';
    if (this.width) {
      img.style.width = this.width + 'px';
      img.style.maxWidth = 'none';
    }
    if (this.height) {
      img.style.height = this.height + 'px';
      img.style.maxHeight = 'none';
    }
    container.appendChild(img);
    return container;
  }

  eq(other: LocalImageWidget) {
    return this.filePath === other.filePath && this.altText === other.altText;
  }

  ignoreEvent() {
    return false;
  }
}

// ============ WYSIWYG Decorations ============

const hideMark = Decoration.mark({ class: 'cm-hidden-mark' });
const boldMark = Decoration.mark({ class: 'cm-wysiwyg-bold' });
const italicMark = Decoration.mark({ class: 'cm-wysiwyg-italic' });
const strikeMark = Decoration.mark({ class: 'cm-wysiwyg-strike' });
const codeMark = Decoration.mark({ class: 'cm-wysiwyg-code' });
const linkTextMark = Decoration.mark({ class: 'cm-wysiwyg-link-text' });
const headingMark = Decoration.mark({ class: 'cm-wysiwyg-heading-mark' });
const listMark = Decoration.mark({ class: 'cm-wysiwyg-list-mark' });
const quoteMark = Decoration.mark({ class: 'cm-wysiwyg-quote-mark' });
const hrMark = Decoration.mark({ class: 'cm-wysiwyg-hr' });

const heading1Mark = Decoration.mark({ class: 'cm-wysiwyg-h1' });
const heading2Mark = Decoration.mark({ class: 'cm-wysiwyg-h2' });
const heading3Mark = Decoration.mark({ class: 'cm-wysiwyg-h3' });
const heading4Mark = Decoration.mark({ class: 'cm-wysiwyg-h4' });
const heading5Mark = Decoration.mark({ class: 'cm-wysiwyg-h5' });
const heading6Mark = Decoration.mark({ class: 'cm-wysiwyg-h6' });

function getHeadingMark(level: number): Decoration {
  switch (level) {
    case 1: return heading1Mark;
    case 2: return heading2Mark;
    case 3: return heading3Mark;
    case 4: return heading4Mark;
    case 5: return heading5Mark;
    case 6: return heading6Mark;
    default: return heading1Mark;
  }
}

interface DecRange {
  from: number;
  to: number;
  decoration: Decoration;
}

function isOnActiveLine(state: EditorState, pos: number): boolean {
  const selection = state.selection.main;
  const lineAtPos = state.doc.lineAt(pos);
  const lineAtAnchor = state.doc.lineAt(selection.anchor);
  const lineAtHead = state.doc.lineAt(selection.head);
  const fromLine = Math.min(lineAtAnchor.number, lineAtHead.number);
  const toLine = Math.max(lineAtAnchor.number, lineAtHead.number);
  return lineAtPos.number >= fromLine && lineAtPos.number <= toLine;
}

function buildWysiwygDecorations(state: EditorState) {
  const builder = new RangeSetBuilder<Decoration>();
  const text = state.doc.toString();
  const decorations: DecRange[] = [];
  let match;

  // 1. Headings # ## ###
  const headingRegex = /^(#{1,6})\s/gm;
  while ((match = headingRegex.exec(text)) !== null) {
    const level = match[1].length;
    const from = match.index;
    const to = match.index + match[1].length + 1;
    
    if (!isOnActiveLine(state, from)) {
      decorations.push({ from, to, decoration: hideMark });
    } else {
      decorations.push({ from, to, decoration: headingMark });
    }
    
    const line = state.doc.lineAt(from);
    const contentFrom = to;
    const contentTo = line.to;
    if (contentFrom < contentTo) {
      decorations.push({ from: contentFrom, to: contentTo, decoration: getHeadingMark(level) });
    }
  }

  // 2. Bold **text** or __text__
  const boldRegex = /(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g;
  while ((match = boldRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const marker = match[1];
    const content = match[2];
    
    decorations.push({ from: match.index, to: match.index + marker.length, decoration: hideMark });
    decorations.push({ from: match.index + marker.length, to: match.index + marker.length + content.length, decoration: boldMark });
    decorations.push({ from: match.index + marker.length + content.length, to: match.index + fullMatch.length, decoration: hideMark });
  }

  // 3. Italic *text* or _text_
  const italicRegex = /(?<!\*|_)(\*|_)(?=\S)(.+?)(?<=\S)\1(?!\*|_)/g;
  while ((match = italicRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const content = match[2];

    decorations.push({ from: match.index, to: match.index + 1, decoration: hideMark });
    decorations.push({ from: match.index + 1, to: match.index + 1 + content.length, decoration: italicMark });
    decorations.push({ from: match.index + 1 + content.length, to: match.index + fullMatch.length, decoration: hideMark });
  }

  // 4. Strikethrough ~~text~~
  const strikeRegex = /~~(?=\S)(.+?)(?<=\S)~~/g;
  while ((match = strikeRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    
    decorations.push({ from: match.index, to: match.index + 2, decoration: hideMark });
    decorations.push({ from: match.index + 2, to: match.index + 2 + content.length, decoration: strikeMark });
    decorations.push({ from: match.index + 2 + content.length, to: match.index + fullMatch.length, decoration: hideMark });
  }

  // 5. Inline code `code`
  const inlineCodeRegex = /`([^`]+)`/g;
  while ((match = inlineCodeRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    
    decorations.push({ from: match.index, to: match.index + 1, decoration: hideMark });
    decorations.push({ from: match.index + 1, to: match.index + 1 + content.length, decoration: codeMark });
    decorations.push({ from: match.index + 1 + content.length, to: match.index + fullMatch.length, decoration: hideMark });
  }

  // 6. Links [text](url)
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = linkRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const linkText = match[1];
    const url = match[2];
    const textStart = match.index + 1;
    const textEnd = textStart + linkText.length;
    const urlStart = textEnd + 2;
    const urlEnd = urlStart + url.length;
    
    decorations.push({ from: match.index, to: match.index + 1, decoration: hideMark });
    decorations.push({ from: textStart, to: textEnd, decoration: linkTextMark });
    decorations.push({ from: textEnd, to: textEnd + 2, decoration: hideMark });
    decorations.push({ from: urlStart, to: urlEnd, decoration: hideMark });
    decorations.push({ from: urlEnd, to: match.index + fullMatch.length, decoration: hideMark });
  }

  // 7. Unordered lists - * +
  const ulRegex = /^(\s*)([-*+])\s/gm;
  while ((match = ulRegex.exec(text)) !== null) {
    const indent = match[1];
    const from = match.index + indent.length;
    const to = from + 1;
    
    if (!isOnActiveLine(state, from)) {
      decorations.push({ from, to, decoration: hideMark });
    } else {
      decorations.push({ from, to, decoration: listMark });
    }
  }

  // 8. Ordered lists 1. 2.
  const olRegex = /^(\s*)(\d+)\.\s/gm;
  while ((match = olRegex.exec(text)) !== null) {
    const indent = match[1];
    const num = match[2];
    const from = match.index + indent.length;
    const to = from + num.length + 1;
    
    if (!isOnActiveLine(state, from)) {
      decorations.push({ from, to, decoration: hideMark });
    } else {
      decorations.push({ from, to, decoration: listMark });
    }
  }

  // 9. Task lists - [ ] or - [x]
  const taskRegex = /^(\s*)[-*+]\s\[([ xX])\]/gm;
  while ((match = taskRegex.exec(text)) !== null) {
    const indent = match[1];
    const from = match.index + indent.length;
    const to = from + 6;
    
    if (!isOnActiveLine(state, from)) {
      decorations.push({ from, to, decoration: hideMark });
    } else {
      decorations.push({ from, to, decoration: listMark });
    }
  }

  // 10. Blockquote >
  const quoteRegex = /^(>\s?)/gm;
  while ((match = quoteRegex.exec(text)) !== null) {
    const from = match.index;
    const to = match.index + match[1].length;
    
    if (!isOnActiveLine(state, from)) {
      decorations.push({ from, to, decoration: hideMark });
    } else {
      decorations.push({ from, to, decoration: quoteMark });
    }
  }

  // 11. Horizontal rule --- *** ___
  const hrRegex = /^(---|\*\*\*|___)$/gm;
  while ((match = hrRegex.exec(text)) !== null) {
    const from = match.index;
    const to = match.index + match[1].length;
    decorations.push({ from, to, decoration: hrMark });
  }

  // 12. Images
  processImageDecorations(text, decorations);

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);

  let pos = 0;
  for (const dec of decorations) {
    if (dec.from >= pos) {
      builder.add(dec.from, dec.to, dec.decoration);
      pos = dec.to;
    }
  }

  return builder.finish();
}

function processImageDecorations(text: string, decorations: DecRange[]) {
  let match;

  const htmlImgRegex = new RegExp(HTML_IMG_REGEX.source, 'gi');
  while ((match = htmlImgRegex.exec(text)) !== null) {
    const from = match.index;
    const to = match.index + match[0].length;
    const beforeSrc = match[1] || '';
    const filePath = match[2];
    const afterSrc = match[3] || '';

    const allAttrs = beforeSrc + ' ' + afterSrc;
    const altText = extractAttr(allAttrs, 'alt') || 'image';
    const width = extractAttr(allAttrs, 'width');
    const height = extractAttr(allAttrs, 'height');

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new LocalImageWidget(altText, filePath, width || undefined, height || undefined),
        block: false
      })
    });
  }

  const base64Regex = new RegExp(BASE64_IMAGE_REGEX.source, 'g');
  while ((match = base64Regex.exec(text)) !== null) {
    const from = match.index;
    const to = match.index + match[0].length;
    const altText = match[1] || 'image';
    const mimeType = match[2];
    const base64Data = match[3];

    if (base64Data.length > 200) {
      decorations.push({
        from,
        to,
        decoration: Decoration.replace({
          widget: new Base64ImageWidget(altText, mimeType, base64Data),
          block: false
        })
      });
    }
  }

  const localRegex = new RegExp(LOCAL_IMAGE_REGEX.source, 'g');
  while ((match = localRegex.exec(text)) !== null) {
    const from = match.index;
    const to = match.index + match[0].length;
    const altText = match[1] || 'image';
    const filePath = match[2];

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new LocalImageWidget(altText, filePath),
        block: false
      })
    });
  }
}

// ============ Theme Styles ============

const wysiwygStyles = EditorView.theme({
  '.cm-hidden-mark': {
    fontSize: '0 !important',
    width: '0 !important',
    display: 'inline-block',
    overflow: 'hidden',
    color: 'transparent !important'
  },
  
  '.cm-wysiwyg-bold': {
    fontWeight: '700'
  },
  
  '.cm-wysiwyg-italic': {
    fontStyle: 'italic'
  },
  
  '.cm-wysiwyg-strike': {
    textDecoration: 'line-through',
    opacity: '0.7'
  },
  
  '.cm-wysiwyg-code': {
    fontFamily: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.9em',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(110, 118, 129, 0.2)'
  },
  
  '.cm-wysiwyg-link-text': {
    color: '#818cf8',
    textDecoration: 'underline',
    cursor: 'pointer'
  },
  
  '.cm-wysiwyg-h1': { fontSize: '2em', fontWeight: '700', lineHeight: '1.3' },
  '.cm-wysiwyg-h2': { fontSize: '1.6em', fontWeight: '600', lineHeight: '1.35' },
  '.cm-wysiwyg-h3': { fontSize: '1.35em', fontWeight: '600', lineHeight: '1.4' },
  '.cm-wysiwyg-h4': { fontSize: '1.15em', fontWeight: '600', lineHeight: '1.45' },
  '.cm-wysiwyg-h5': { fontSize: '1em', fontWeight: '600', lineHeight: '1.5' },
  '.cm-wysiwyg-h6': { fontSize: '0.9em', fontWeight: '600', lineHeight: '1.5', opacity: '0.8' },
  
  '.cm-wysiwyg-heading-mark': {
    color: '#818cf8',
    opacity: '0.6'
  },
  
  '.cm-wysiwyg-list-mark': {
    color: '#818cf8',
    fontWeight: 'bold'
  },
  
  '.cm-wysiwyg-quote-mark': {
    color: '#818cf8',
    opacity: '0.6'
  },
  
  '.cm-wysiwyg-hr': {
    display: 'inline-block',
    width: '100%',
    height: '2px',
    backgroundColor: 'rgba(129, 140, 248, 0.3)',
    fontSize: '0',
    lineHeight: '0',
    marginTop: '8px',
    marginBottom: '8px'
  },
  
  '.cm-image-preview-container': {
    display: 'inline-block',
    verticalAlign: 'middle',
    margin: '4px 0'
  },
  '.cm-image-preview': {
    maxWidth: '300px',
    maxHeight: '200px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer'
  }
}, { dark: true });

const lightWysiwygStyles = EditorView.theme({
  '.cm-wysiwyg-code': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)'
  },
  '.cm-wysiwyg-link-text': {
    color: '#6366f1'
  },
  '.cm-wysiwyg-heading-mark': {
    color: '#6366f1'
  },
  '.cm-wysiwyg-list-mark': {
    color: '#6366f1'
  },
  '.cm-wysiwyg-quote-mark': {
    color: '#6366f1'
  },
  '.cm-wysiwyg-hr': {
    backgroundColor: 'rgba(0, 0, 0, 0.15)'
  },
  '.cm-image-preview': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  }
}, { dark: false });

const baseTheme = EditorView.theme({
  '&': {
    height: '100%'
  },
  '.cm-content': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '1.7',
    padding: '24px 0'
  },
  '.cm-line': {
    padding: '0 16px'
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: '#6e7681',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 16px',
    minWidth: '48px'
  }
});

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e2028',
    color: '#c9d1d9'
  },
  '.cm-content': {
    caretColor: '#c9d1d9'
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
    color: '#4d5363'
  }
}, { dark: true });

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#24292f'
  },
  '.cm-content': {
    caretColor: '#24292f'
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
    color: '#8b949e'
  }
}, { dark: false });

// ============ Editor Component ============

function WysiwygEditor({ content, onChange, theme }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastContentRef = useRef(content);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        lastContentRef.current = newContent;
        onChange(newContent);
      }
    });

    const wysiwygPlugin = ViewPlugin.fromClass(class {
      decorations: any;

      constructor(view: EditorView) {
        this.decorations = buildWysiwygDecorations(view.state);
      }

      update(update: any) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildWysiwygDecorations(update.state);
        }
      }
    }, {
      decorations: (v: any) => v.decorations
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
        baseTheme,
        theme === 'dark' ? darkTheme : lightTheme,
        theme === 'dark' ? wysiwygStyles : [wysiwygStyles, lightWysiwygStyles],
        oneDark,
        wysiwygPlugin
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
      className={'wysiwyg-editor-cm ' + theme}
      style={{ height: '100%', overflow: 'auto' }}
    />
  );
}

export default WysiwygEditor;
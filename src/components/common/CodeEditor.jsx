import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

// Estilo de destaque simplificado
const jsStyle = {
  "keyword": "#8954A8",
  "comment": "#9E9E9E",
  "string": "#2E7D32",
  "number": "#E67C73",
  "operator": "#5C6BC0",
  "variableName": "#2196F3",
  "propertyName": "#0288D1",
  "function": "#F57C00",
  "typeName": "#D81B60",
  "punctuation": "#616161"
};

// Snippets para o Postman
const postmanSnippets = [
  {
    label: "pm.test",
    detail: "Create a Postman test",
    info: "Add a test assertion",
    type: "function",
    apply: "pm.test('Test name', function() {\n  pm.expect(pm.response.code).to.equal(200);\n});"
  },
  {
    label: "pm.expect",
    detail: "Postman expectation",
    info: "Add an expectation",
    type: "function",
    apply: "pm.expect(value).to.equal(expected);"
  },
  {
    label: "pm.environment.set",
    detail: "Set environment variable",
    info: "Set a variable in the current environment",
    type: "function",
    apply: "pm.environment.set('variable_key', 'variable_value');"
  },
  {
    label: "pm.globals.set",
    detail: "Set global variable",
    info: "Set a global variable",
    type: "function",
    apply: "pm.globals.set('variable_key', 'variable_value');"
  },
  {
    label: "pm.variables.get",
    detail: "Get variable",
    info: "Get a variable value",
    type: "function",
    apply: "pm.variables.get('variable_key');"
  },
  {
    label: "pm.response.json",
    detail: "Get response JSON",
    info: "Get response body as JSON",
    type: "property",
    apply: "pm.response.json()"
  }
];

const CodeEditor = ({ value, onChange, placeholder = '', height = '300px' }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    // Configuração inicial do editor
    if (!editorRef.current) return;

    // Criar o estado do editor
    const startState = EditorState.create({
      doc: value || '',
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        javascript(),
        syntaxHighlighting(defaultHighlightStyle),
        highlightActiveLine(),
        EditorView.updateListener.of(update => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height,
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          '.cm-content': {
            padding: '10px',
          },
          '.cm-gutters': {
            backgroundColor: '#f8fafc',
            border: 'none',
            borderRight: '1px solid #e2e8f0',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#f1f5f9',
          },
          '.cm-activeLine': {
            backgroundColor: '#f1f5f9',
          },
          '.cm-cursor': {
            borderLeftColor: '#3b82f6',
          },
          '&.cm-focused': {
            outline: 'none',
            border: '1px solid #3b82f6',
          },
          '.cm-line': {
            padding: '0 10px',
          },
        }),
        EditorState.tabSize.of(2),
      ],
    });

    // Criar a visualização do editor
    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Limpar ao desmontar
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, []);

  // Atualizar o conteúdo do editor quando o valor mudar externamente
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const currentPos = viewRef.current.state.selection.main.head;
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value || '',
        },
        selection: { anchor: Math.min(currentPos, value?.length || 0) },
      });
      viewRef.current.dispatch(transaction);
    }
  }, [value]);

  return <div ref={editorRef} className="code-editor" style={{ height }} />;
};

export default CodeEditor;

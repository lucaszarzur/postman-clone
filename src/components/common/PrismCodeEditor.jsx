import { useState, useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

const PrismCodeEditor = ({ value, onChange, placeholder = '', height = '300px' }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  // Atualizar o valor local quando o valor externo mudar
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);

  // Aplicar syntax highlighting
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = localValue ? Prism.highlight(localValue, Prism.languages.javascript, 'javascript') : '';

      // Se não houver conteúdo e não estiver focado, mostrar o placeholder
      if (!localValue && !isFocused && previewRef.current) {
        previewRef.current.innerHTML = `<span class="placeholder">${placeholder}</span>`;
      }
    }
  }, [localValue, isFocused, placeholder]);

  // Sincronizar a posição de rolagem entre textarea e preview
  useEffect(() => {
    const syncScroll = () => {
      if (previewRef.current && textareaRef.current) {
        previewRef.current.scrollTop = textareaRef.current.scrollTop;
        previewRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', syncScroll);
      return () => textarea.removeEventListener('scroll', syncScroll);
    }
  }, []);

  // Lidar com mudanças no textarea
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Lidar com a tecla Tab
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();

      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      // Inserir dois espaços no lugar do Tab
      const newValue = localValue.substring(0, start) + '  ' + localValue.substring(end);
      setLocalValue(newValue);

      // Mover o cursor para depois dos espaços inseridos
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);

      if (onChange) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="prism-code-editor" style={{ height, position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="prism-code-textarea"
        spellCheck="false"
        autoComplete="off"
        autoCapitalize="off"
      />
      <pre ref={previewRef} className="prism-code-preview language-javascript">
        {/* O conteúdo será preenchido pelo Prism */}
      </pre>
    </div>
  );
};

export default PrismCodeEditor;

import { useState, useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

const JsonEditor = ({ value, onChange, placeholder = '', height = '300px', autoFormat = false }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  
  // Formatar JSON
  const formatJson = (jsonString) => {
    try {
      if (!jsonString.trim()) return '';
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonString;
    }
  };
  
  // Verificar se é JSON válido
  const validateJson = (jsonString) => {
    if (!jsonString.trim()) return true;
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Atualizar o valor local quando o valor externo mudar
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
      setIsValidJson(validateJson(value || ''));
    }
  }, [value]);
  
  // Aplicar syntax highlighting
  useEffect(() => {
    if (previewRef.current) {
      // Verificar se é JSON válido
      const isValid = validateJson(localValue);
      setIsValidJson(isValid);
      
      // Aplicar highlighting
      if (localValue) {
        previewRef.current.innerHTML = Prism.highlight(
          localValue, 
          Prism.languages.json, 
          'json'
        );
      } else if (!isFocused) {
        previewRef.current.innerHTML = `<span class="placeholder">${placeholder}</span>`;
      } else {
        previewRef.current.innerHTML = '';
      }
      
      // Adicionar classe de erro se não for JSON válido
      if (!isValid && localValue.trim()) {
        previewRef.current.classList.add('json-invalid');
      } else {
        previewRef.current.classList.remove('json-invalid');
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
  
  // Lidar com a tecla Tab e outras teclas especiais
  const handleKeyDown = (e) => {
    // Tab - inserir dois espaços
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      const newValue = localValue.substring(0, start) + '  ' + localValue.substring(end);
      setLocalValue(newValue);
      
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
      
      if (onChange) {
        onChange(newValue);
      }
    }
    
    // Ctrl+Shift+F ou Ctrl+Alt+L - formatar JSON
    if ((e.ctrlKey && e.shiftKey && e.key === 'F') || 
        (e.ctrlKey && e.altKey && e.key === 'l') || 
        (e.ctrlKey && e.altKey && e.key === 'L')) {
      e.preventDefault();
      
      try {
        const formatted = formatJson(localValue);
        setLocalValue(formatted);
        if (onChange) {
          onChange(formatted);
        }
      } catch (err) {
        // Ignorar erro de formatação
      }
    }
  };
  
  // Formatar JSON ao perder o foco, se autoFormat estiver ativado
  const handleBlur = () => {
    setIsFocused(false);
    
    if (autoFormat && isValidJson && localValue.trim()) {
      try {
        const formatted = formatJson(localValue);
        setLocalValue(formatted);
        if (onChange) {
          onChange(formatted);
        }
      } catch (err) {
        // Ignorar erro de formatação
      }
    }
  };
  
  return (
    <div className="prism-code-editor json-editor" style={{ height }}>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className="prism-code-textarea"
        spellCheck="false"
        autoComplete="off"
        autoCapitalize="off"
        data-valid-json={isValidJson}
      />
      <pre ref={previewRef} className="prism-code-preview language-json">
        {/* O conteúdo será preenchido pelo Prism */}
      </pre>
      
      {!isValidJson && localValue.trim() && (
        <div className="json-error-indicator" title="Invalid JSON">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
          </svg>
        </div>
      )}
      
      <div className="json-format-button" title="Format JSON (Ctrl+Shift+F)" onClick={() => {
        if (localValue.trim()) {
          try {
            const formatted = formatJson(localValue);
            setLocalValue(formatted);
            if (onChange) {
              onChange(formatted);
            }
          } catch (err) {
            // Ignorar erro de formatação
          }
        }
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </div>
    </div>
  );
};

export default JsonEditor;

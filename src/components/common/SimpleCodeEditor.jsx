import { useState, useRef, useEffect } from 'react';

const SimpleCodeEditor = ({ value, onChange, placeholder = '', height = '300px' }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const textareaRef = useRef(null);
  
  // Atualizar o valor local quando o valor externo mudar
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);
  
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
    <div className="code-editor-container" style={{ height }}>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="code-editor-textarea"
        style={{ 
          height: '100%',
          width: '100%',
          padding: '10px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#1e293b',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.375rem',
          resize: 'none',
          outline: 'none',
        }}
        spellCheck="false"
      />
    </div>
  );
};

export default SimpleCodeEditor;

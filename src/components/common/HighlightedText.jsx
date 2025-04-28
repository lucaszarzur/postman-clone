import React from 'react';

/**
 * Componente para destacar partes específicas de um texto
 *
 * @param {Object} props
 * @param {string} props.text - O texto a ser exibido
 * @param {RegExp} props.pattern - O padrão para destacar (regex)
 * @param {string|function} props.highlightClassName - Classe CSS ou função que retorna classe CSS para o destaque
 * @param {function} props.renderHighlight - Função opcional para renderizar o destaque personalizado
 * @param {function} props.transformMatch - Função opcional para transformar o texto do match antes de exibi-lo
 */
const HighlightedText = ({
  text,
  pattern,
  highlightClassName = "bg-blue-100 text-blue-800 px-1 rounded",
  renderHighlight,
  transformMatch
}) => {
  if (!text) return null;

  // Dividir o texto em partes que correspondem e não correspondem ao padrão
  const parts = text.split(pattern);
  const matches = text.match(pattern) || [];

  return (
    <span>
      {parts.map((part, i) => {
        // Renderizar a parte normal do texto
        const output = [<span key={`part-${i}`}>{part}</span>];

        // Se houver uma correspondência após esta parte, renderizá-la destacada
        if (matches[i]) {
          const match = matches[i];
          const displayText = transformMatch ? transformMatch(match) : match;

          if (renderHighlight) {
            // Usar renderização personalizada se fornecida
            output.push(renderHighlight(displayText, match, i));
          } else {
            // Usar classe CSS para destacar
            const className = typeof highlightClassName === 'function'
              ? highlightClassName(match, i)
              : highlightClassName;

            output.push(
              <span key={`match-${i}`} className={className}>
                {displayText}
              </span>
            );
          }
        }

        return output;
      })}
    </span>
  );
};

export default HighlightedText;

import { useState } from 'react';
import { useTest } from '../../hooks/useTest';
import { isNumericValue } from '../../utils/validators';

const ParameterForm = () => {
  const {
    testParameters,
    addParameterSet,
    addMultipleParameterSets,
    updateParameterSet,
    removeParameterSet,
    toggleParameterSet,
    toggleAllParameterSets,
    clearParameterSets,
    isRunning
  } = useTest();

  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Estado para armazenar mensagens de erro
  const [errorMessage, setErrorMessage] = useState('');

  // Função para processar o texto colado e criar parâmetros
  const processBulkInput = () => {
    if (!bulkText.trim()) {
      return;
    }

    setErrorMessage(''); // Limpar mensagens de erro anteriores

    // Divide o texto em linhas
    const lines = bulkText.split('\n').filter(line => line.trim());

    // Para cada linha, tenta extrair origin e destination
    const newParams = [];
    const invalidLines = [];

    lines.forEach((line, index) => {
      // Limpa a linha
      const cleanLine = line.trim();

      // Tenta diferentes separadores
      const separators = [';', ',', '\t', '|'];
      let validPair = false;

      for (const separator of separators) {
        if (cleanLine.includes(separator)) {
          const parts = cleanLine.split(separator);
          if (parts.length >= 2) {
            const origin = parts[0].trim();
            const destination = parts[1].trim();

            // Verificar se ambos são valores numéricos
            if (isNumericValue(origin) && isNumericValue(destination)) {
              newParams.push({
                origin,
                destination,
                enabled: true
              });
              validPair = true;
              break;
            } else {
              invalidLines.push({
                line: cleanLine,
                reason: `Valores devem ser numéricos. Encontrado: origin=${origin}, destination=${destination}`
              });
            }
          }
        }
      }

      if (!validPair && !invalidLines.some(item => item.line === cleanLine)) {
        invalidLines.push({
          line: cleanLine,
          reason: 'Formato inválido. Use o formato "número;número"'
        });
      }
    });

    // Mostrar mensagens de erro para linhas inválidas
    if (invalidLines.length > 0) {
      const errorMsg = `Linhas inválidas encontradas:\n${invalidLines.map(item => `- ${item.line}: ${item.reason}`).join('\n')}`;
      setErrorMessage(errorMsg);
      console.error(errorMsg);
    }

    // Adiciona os novos parâmetros
    if (newParams.length > 0) {
      console.log(`Adicionando ${newParams.length} parâmetros:`, newParams);

      // Limpa os parâmetros existentes se o usuário quiser
      if (testParameters.length > 0) {
        const shouldClear = window.confirm(
          'Do you want to clear existing parameters before adding new ones?'
        );
        if (shouldClear) {
          clearParameterSets();
          // Adiciona todos os novos parâmetros de uma vez
          setTimeout(() => {
            addMultipleParameterSets(newParams);
          }, 0);
        } else {
          // Adiciona os novos parâmetros aos existentes
          addMultipleParameterSets(newParams);
        }
      } else {
        // Se não houver parâmetros existentes, adiciona os novos
        addMultipleParameterSets(newParams);
      }

      // Limpa o campo de texto e fecha o formulário apenas se não houver erros
      if (invalidLines.length === 0) {
        setBulkText('');
        setShowBulkInput(false);
      }
    } else if (lines.length > 0) {
      setErrorMessage('Nenhum par válido encontrado. Todos os valores devem ser numéricos no formato "número;número".');
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Test Parameters</h3>
        <div className="space-x-2">
          <button
            onClick={addParameterSet}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add Parameter Set
          </button>
          <button
            onClick={() => setShowBulkInput(!showBulkInput)}
            disabled={isRunning}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            Bulk Add
          </button>
          <button
            onClick={clearParameterSets}
            disabled={isRunning || testParameters.length === 0}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Formulário para adicionar múltiplos parâmetros */}
      {showBulkInput && (
        <div className="mb-4 p-3 border border-gray-200 rounded bg-gray-50">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste multiple origin/destination pairs (one per line)
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="14199;3155&#10;3155;14199&#10;14199;2500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-32"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: "origin;destination" (one pair per line, supports separators: ; , | tab)
            </p>
            <p className="mt-1 text-xs text-blue-600 font-semibold">
              <strong>Note:</strong> Only numeric IDs are accepted (e.g., "14199;3155")
            </p>
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs whitespace-pre-line">
                {errorMessage}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowBulkInput(false)}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={processBulkInput}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Parameters
            </button>
          </div>
        </div>
      )}

      {testParameters.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No parameter sets defined. Click "Add Parameter Set" to start.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Botões para selecionar/desmarcar todos */}
          <div className="flex justify-end space-x-2 mb-2">
            <button
              onClick={() => toggleAllParameterSets(true)}
              disabled={isRunning}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              Select All
            </button>
            <button
              onClick={() => toggleAllParameterSets(false)}
              disabled={isRunning}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Deselect All
            </button>
          </div>

          {testParameters.map((param, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 p-2 rounded border ${
                param.enabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-70'
              }`}
            >
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={() => toggleParameterSet(index)}
                  disabled={isRunning}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex-grow grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Origin</label>
                  <input
                    type="text"
                    value={param.origin}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || isNumericValue(value)) {
                        updateParameterSet(index, 'origin', value);
                      }
                    }}
                    disabled={isRunning || !param.enabled}
                    placeholder="Origin ID (numeric)"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Destination</label>
                  <input
                    type="text"
                    value={param.destination}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || isNumericValue(value)) {
                        updateParameterSet(index, 'destination', value);
                      }
                    }}
                    disabled={isRunning || !param.enabled}
                    placeholder="Destination ID (numeric)"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => removeParameterSet(index)}
                  disabled={isRunning}
                  className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParameterForm;

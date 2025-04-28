import { useState, useEffect, useRef } from 'react';
import { useConsole, LOG_TYPES } from '../../contexts/ConsoleContext';

const ConsoleViewer = () => {
  const {
    isOpen,
    filter,
    getFilteredLogs,
    clearLogs,
    setFilterType,
    closeConsole
  } = useConsole();
  
  const [logs, setLogs] = useState([]);
  const consoleRef = useRef(null);
  
  // Atualizar logs quando o filtro mudar ou novos logs forem adicionados
  useEffect(() => {
    setLogs(getFilteredLogs());
  }, [getFilteredLogs]);
  
  // Rolar para o final quando novos logs forem adicionados
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = 0;
    }
  }, [logs]);
  
  if (!isOpen) return null;
  
  // Formatar timestamp
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  // Obter classe CSS com base no tipo de log
  const getLogClass = (type) => {
    switch (type) {
      case LOG_TYPES.INFO:
        return 'text-blue-600';
      case LOG_TYPES.REQUEST:
        return 'text-purple-600';
      case LOG_TYPES.RESPONSE:
        return 'text-green-600';
      case LOG_TYPES.ERROR:
        return 'text-red-600';
      case LOG_TYPES.WARNING:
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };
  
  // Obter ícone com base no tipo de log
  const getLogIcon = (type) => {
    switch (type) {
      case LOG_TYPES.INFO:
        return 'ℹ️';
      case LOG_TYPES.REQUEST:
        return '↗️';
      case LOG_TYPES.RESPONSE:
        return '↙️';
      case LOG_TYPES.ERROR:
        return '❌';
      case LOG_TYPES.WARNING:
        return '⚠️';
      default:
        return '📝';
    }
  };
  
  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Cabeçalho do console */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-100">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-700 mr-4">Console</h3>
          
          {/* Filtros */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 text-xs rounded ${
                filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.INFO)}
              className={`px-2 py-1 text-xs rounded ${
                filter === LOG_TYPES.INFO ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.REQUEST)}
              className={`px-2 py-1 text-xs rounded ${
                filter === LOG_TYPES.REQUEST ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Request
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.RESPONSE)}
              className={`px-2 py-1 text-xs rounded ${
                filter === LOG_TYPES.RESPONSE ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Response
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.ERROR)}
              className={`px-2 py-1 text-xs rounded ${
                filter === LOG_TYPES.ERROR ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Error
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.WARNING)}
              className={`px-2 py-1 text-xs rounded ${
                filter === LOG_TYPES.WARNING ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Warning
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear
          </button>
          <button
            onClick={closeConsole}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Conteúdo do console */}
      <div 
        ref={consoleRef}
        className="h-48 overflow-y-auto font-mono text-xs p-2"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No logs to display
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex">
                <div className="text-gray-500 mr-2">{formatTime(log.timestamp)}</div>
                <div className={`${getLogClass(log.type)} flex-1`}>
                  <span className="mr-2">{getLogIcon(log.type)}</span>
                  <span>{log.message}</span>
                  
                  {log.details && (
                    <details className="mt-1 ml-6 text-gray-700">
                      <summary className="cursor-pointer text-gray-500">Details</summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                        {typeof log.details === 'string' 
                          ? log.details 
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsoleViewer;

import React, { useState, useRef, useEffect } from 'react';
import { useConsole, LOG_TYPES } from '../../contexts/ConsoleContext';
import { FaSearch, FaTrash, FaTimes, FaChevronUp, FaChevronDown, FaTerminal } from 'react-icons/fa';

const Console = () => {
  const {
    isOpen,
    toggleConsole,
    clearLogs,
    getFilteredLogs,
    filter,
    setFilterType
  } = useConsole();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogs, setExpandedLogs] = useState({});
  const consoleRef = useRef(null);

  // Filtrar logs com base no termo de pesquisa
  const filteredLogs = getFilteredLogs().filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Alternar a expansão de um log
  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  // Formatar timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Obter cor com base no tipo de log
  const getLogTypeColor = (type) => {
    switch (type) {
      case LOG_TYPES.INFO:
        return 'text-blue-500';
      case LOG_TYPES.REQUEST:
        return 'text-green-500';
      case LOG_TYPES.RESPONSE:
        return 'text-purple-500';
      case LOG_TYPES.ERROR:
        return 'text-red-500';
      case LOG_TYPES.WARNING:
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  // Rolar para o final quando novos logs são adicionados
  useEffect(() => {
    if (consoleRef.current && isOpen) {
      consoleRef.current.scrollTop = 0;
    }
  }, [filteredLogs.length, isOpen]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 flex items-center justify-between border-t border-gray-700 z-50">
        <button
          onClick={toggleConsole}
          className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          <FaTerminal className="mr-1" />
          <span>Console</span>
        </button>
        <div className="text-xs text-gray-400">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white border-t border-gray-700 z-50 flex flex-col" style={{ height: '30vh' }}>
      {/* Cabeçalho do console */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleConsole}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            <FaTerminal className="mr-1" />
            <span>Console</span>
          </button>

          {/* Filtros */}
          <div className="flex space-x-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.INFO)}
              className={`px-2 py-1 rounded ${filter === LOG_TYPES.INFO ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Info
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.REQUEST)}
              className={`px-2 py-1 rounded ${filter === LOG_TYPES.REQUEST ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Request
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.RESPONSE)}
              className={`px-2 py-1 rounded ${filter === LOG_TYPES.RESPONSE ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Response
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.ERROR)}
              className={`px-2 py-1 rounded ${filter === LOG_TYPES.ERROR ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Error
            </button>
            <button
              onClick={() => setFilterType(LOG_TYPES.WARNING)}
              className={`px-2 py-1 rounded ${filter === LOG_TYPES.WARNING ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Warning
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Pesquisa */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 text-white text-xs px-3 py-1 rounded pl-8 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          </div>

          {/* Botões de ação */}
          <button
            onClick={clearLogs}
            className="p-1 text-gray-400 hover:text-white"
            title="Clear console"
          >
            <FaTrash size={14} />
          </button>
          <button
            onClick={toggleConsole}
            className="p-1 text-gray-400 hover:text-white"
            title="Close console"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Corpo do console */}
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto text-xs"
        style={{ maxHeight: 'calc(30vh - 40px)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No logs to display
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-2 hover:bg-gray-750">
                <div
                  className="flex items-start cursor-pointer"
                  onClick={() => toggleLogExpansion(log.id)}
                >
                  <div className="flex-shrink-0 mr-2">
                    {expandedLogs[log.id] ? (
                      <FaChevronDown size={10} className="mt-1 text-gray-400" />
                    ) : (
                      <FaChevronUp size={10} className="mt-1 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-shrink-0 mr-2 text-gray-400">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div className={`flex-shrink-0 mr-2 uppercase font-bold ${getLogTypeColor(log.type)}`}>
                    {log.type}
                  </div>
                  <div className="flex-1 truncate">
                    {log.message}
                  </div>
                </div>

                {expandedLogs[log.id] && log.details && (
                  <div className="mt-2 ml-6 p-2 bg-gray-900 rounded overflow-x-auto">
                    <pre className="text-gray-300">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details, null, 2)
                        : log.details}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Console;

import { createContext, useContext, useState, useCallback } from 'react';

// Criar o contexto
export const ConsoleContext = createContext();

// Hook personalizado para usar o contexto
export const useConsole = () => useContext(ConsoleContext);

// Tipos de logs
export const LOG_TYPES = {
  INFO: 'info',
  REQUEST: 'request',
  RESPONSE: 'response',
  ERROR: 'error',
  WARNING: 'warning'
};

// Provedor do contexto
export const ConsoleProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'info', 'request', 'response', 'error', 'warning'

  // Adicionar um log
  const addLog = useCallback((type, message, details = null) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date(),
      type,
      message,
      details
    };

    setLogs(prevLogs => [newLog, ...prevLogs]);
    return newLog.id;
  }, []);

  // Limpar todos os logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Abrir o console
  const openConsole = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Fechar o console
  const closeConsole = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Alternar o estado do console
  const toggleConsole = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Definir o filtro
  const setFilterType = useCallback((filterType) => {
    setFilter(filterType);
  }, []);

  // Obter logs filtrados
  const getFilteredLogs = useCallback(() => {
    if (filter === 'all') {
      return logs;
    }
    return logs.filter(log => log.type === filter);
  }, [logs, filter]);

  // Funções de log específicas
  const logInfo = useCallback((message, details = null) => {
    return addLog(LOG_TYPES.INFO, message, details);
  }, [addLog]);

  const logRequest = useCallback((message, details = null) => {
    return addLog(LOG_TYPES.REQUEST, message, details);
  }, [addLog]);

  const logResponse = useCallback((message, details = null) => {
    return addLog(LOG_TYPES.RESPONSE, message, details);
  }, [addLog]);

  const logError = useCallback((message, details = null) => {
    return addLog(LOG_TYPES.ERROR, message, details);
  }, [addLog]);

  const logWarning = useCallback((message, details = null) => {
    return addLog(LOG_TYPES.WARNING, message, details);
  }, [addLog]);

  // Função genérica de log para uso externo
  const log = useCallback((type, message, details = null) => {
    if (!Object.values(LOG_TYPES).includes(type)) {
      console.warn(`Invalid log type: ${type}`);
      type = LOG_TYPES.INFO;
    }
    return addLog(type, message, details);
  }, [addLog]);

  return (
    <ConsoleContext.Provider
      value={{
        logs,
        isOpen,
        filter,
        addLog,
        clearLogs,
        openConsole,
        closeConsole,
        toggleConsole,
        setFilterType,
        getFilteredLogs,
        logInfo,
        logRequest,
        logResponse,
        logError,
        logWarning,
        log // Adicionar a função genérica de log
      }}
    >
      {children}
    </ConsoleContext.Provider>
  );
};

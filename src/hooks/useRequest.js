import { useState, useCallback } from 'react';

export const useRequest = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // This function now accepts both the request data and an optional response
  // If response is provided, it means the request was already sent by another utility
  const sendRequest = useCallback((requestData, responseData = null) => {
    if (responseData) {
      // If response is provided, just update the state
      console.log('useRequest: Atualizando resposta:', responseData);
      setLoading(false);
      setResponse(responseData);
      setError(responseData.error || null);
      return;
    }

    // Otherwise, set loading state
    setLoading(true);
    setError(null);

    // The actual request sending is now handled by the requestRunner utility
    // This hook now primarily manages state
  }, []);

  // Função para limpar a resposta
  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    response,
    error,
    sendRequest,
    clearResponse
  };
};

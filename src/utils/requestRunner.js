import axios from 'axios';
import { runTests } from './testRunner';
import { proxyUrl, proxyHeaders } from './corsProxy';
import { LOG_TYPES } from '../contexts/ConsoleContext';

// Função para extrair o domínio de uma URL
export const extractDomain = (url) => {
  try {
    if (!url) return null;

    // Se a URL já é um caminho relativo para o proxy, não tem domínio
    if (url.startsWith('/api-gateway')) {
      const originalUrl = url.replace('/api-gateway', '');
      try {
        return new URL(originalUrl).hostname;
      } catch {
        return null;
      }
    }

    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Erro ao extrair domínio:', error);
    return null;
  }
};

/**
 * Replace variables in a string with their values
 * @param {string} str - The string containing variables
 * @param {Function} getVariable - Function to get variable values
 * @returns {string} - The string with variables replaced
 */
export const replaceVariables = (str, getVariable) => {
  if (!str) return str;

  return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const value = getVariable(varName.trim());
    return value !== null ? value : match;
  });
};

/**
 * Run a pre-request script
 * @param {string} script - The pre-request script to run
 * @param {Object} context - The context object with request and environment data
 */
export const runPreRequestScript = (script, context) => {
  if (!script) return;

  try {
    // Create a pm object similar to Postman's
    const pm = {
      environment: {
        set: context.setEnvironmentVariable,
        get: context.getVariable
      },
      globals: {
        set: context.setGlobalVariable,
        get: context.getVariable
      },
      variables: {
        get: context.getVariable
      },
      request: {
        url: context.request.url,
        method: context.request.method,
        headers: context.request.headers,
        body: context.request.data
      }
    };

    // Execute the script
    new Function('pm', script)(pm);
  } catch (error) {
    console.error('Error in pre-request script:', error);
  }
};

/**
 * Send a request and run tests
 * @param {Object} requestData - The request data
 * @param {Object} context - The context object with environment functions
 * @returns {Promise<Object>} - The response with test results
 */
export const sendRequest = async (requestData, context) => {
  try {
    const startTime = Date.now();

    // Obter a função de log do contexto, se disponível
    const logger = context?.logger;

    // Process pre-request script if available
    if (requestData.event) {
      const preRequestEvent = requestData.event.find(e => e.listen === 'prerequest');
      if (preRequestEvent && preRequestEvent.script) {
        const script = Array.isArray(preRequestEvent.script.exec)
          ? preRequestEvent.script.exec.join('\\n')
          : preRequestEvent.script.exec;

        runPreRequestScript(script, {
          ...context,
          request: requestData
        });
      }
    }

    // Replace variables in URL, headers, and body
    let url = replaceVariables(requestData.url, context.getVariable);

    // Aplicar proxy à URL para contornar problemas de CORS
    const originalUrl = url;
    url = proxyUrl(url);
    console.log(`Usando proxy: ${originalUrl} -> ${url}`);

    // Registrar a requisição no console
    if (logger) {
      logger(LOG_TYPES.REQUEST, `${requestData.method} ${originalUrl}`, {
        method: requestData.method,
        url: originalUrl,
        proxiedUrl: url,
        headers: requestData.header,
        body: requestData.body
      });
    }

    const headers = {};

    if (requestData.header) {
      requestData.header.forEach(h => {
        if (h.disabled) return;
        headers[h.key] = replaceVariables(h.value, context.getVariable);
      });
    }

    // Aplicar modificações de cabeçalhos para o proxy CORS
    const modifiedHeaders = proxyHeaders(headers);

    let data = null;
    if (requestData.body) {
      if (requestData.body.mode === 'raw') {
        data = replaceVariables(requestData.body.raw, context.getVariable);

        // If content-type is application/json, parse the JSON
        const contentType = headers['Content-Type'] || headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
          try {
            data = JSON.parse(data);
          } catch (error) {
            console.warn('Failed to parse JSON body:', error);
          }
        }
      } else if (requestData.body.mode === 'urlencoded') {
        const formData = new URLSearchParams();
        requestData.body.urlencoded.forEach(param => {
          if (!param.disabled) {
            formData.append(param.key, replaceVariables(param.value, context.getVariable));
          }
        });
        data = formData;
      } else if (requestData.body.mode === 'formdata') {
        const formData = new FormData();
        requestData.body.formdata.forEach(param => {
          if (!param.disabled) {
            formData.append(param.key, replaceVariables(param.value, context.getVariable));
          }
        });
        data = formData;
      }
    }

    // Processar variáveis de ambiente nas credenciais de autenticação
    let authHeader = {};
    if (context.auth) {
      // Substituir variáveis nas credenciais de autenticação
      let username = context.auth.username;
      let password = context.auth.password;

      // Se as credenciais contêm variáveis, substituí-las
      if (context.auth.containsVariables || username.includes('{{') || password.includes('{{')) {
        username = replaceVariables(username, context.getVariable);
        password = replaceVariables(password, context.getVariable);

        console.log('Credenciais após substituição de variáveis:', {
          username: username || '[vazio]',
          password: password ? '[preenchido]' : '[vazio]'
        });
      }

      authHeader = {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`
      };
    }

    // Send the request
    const response = await axios({
      method: requestData.method.toLowerCase(),
      url,
      headers: {
        ...modifiedHeaders,
        ...authHeader
      },
      data,
      validateStatus: () => true, // Don't throw on error status codes
      withCredentials: false // Importante para requisições CORS
    });

    const endTime = Date.now();
    response.responseTime = endTime - startTime;

    // Registrar a resposta no console
    if (logger) {
      const logType = response.status >= 400 ? LOG_TYPES.ERROR : LOG_TYPES.RESPONSE;
      logger(logType, `${response.status} ${response.statusText || ''} (${response.responseTime}ms)`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: response.responseTime,
        size: JSON.stringify(response.data).length
      });
    }

    // Process test script if available
    let testResults = null;
    if (requestData.event) {
      const testEvent = requestData.event.find(e => e.listen === 'test');
      if (testEvent && testEvent.script) {
        const script = Array.isArray(testEvent.script.exec)
          ? testEvent.script.exec.join('\\n')
          : testEvent.script.exec;

        testResults = runTests(script, {
          ...context,
          response
        });
      }
    }

    return {
      ...response,
      testResults
    };
  } catch (error) {
    console.error('Request error:', error);

    // Registrar o erro no console
    if (logger) {
      logger(LOG_TYPES.ERROR, `Error: ${error.message}`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        config: error.config,
        isAxiosError: error.isAxiosError,
        response: error.response
      });
    }

    // Criar uma resposta de erro mais detalhada
    const errorResponse = {
      error: error.message,
      status: error.response?.status || 0,
      statusText: error.response?.statusText || 'Error',
      data: error.response?.data || null,
      headers: error.response?.headers || {},
      testResults: null,
      config: error.config || {},
      // Adicionar informações extras para depuração
      errorDetails: {
        name: error.name,
        code: error.code,
        stack: error.stack,
        isAxiosError: error.isAxiosError,
        isNetworkError: error.message.includes('Network Error'),
        isCORSError: error.message.includes('CORS') || error.message.includes('cross-origin')
      }
    };

    return errorResponse;
  }
};



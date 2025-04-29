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

  // Make sure str is a string
  if (typeof str !== 'string') {
    console.warn('replaceVariables called with non-string value:', str);
    return str;
  }

  // Make sure getVariable is a function
  if (typeof getVariable !== 'function') {
    console.warn('replaceVariables called with invalid getVariable function');
    return str;
  }

  return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    try {
      const value = getVariable(varName.trim());
      return value !== null && value !== undefined ? value : match;
    } catch (error) {
      console.error('Error getting variable value:', error);
      return match;
    }
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
    let url;

    // Handle different URL formats in Postman requests
    if (typeof requestData.url === 'string') {
      url = replaceVariables(requestData.url, context.getVariable);
    } else if (requestData.url && requestData.url.raw) {
      // Handle Postman URL object format
      url = replaceVariables(requestData.url.raw, context.getVariable);
    } else {
      console.warn('Invalid URL format in request:', requestData);
      throw new Error('Invalid URL format in request');
    }

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

        // Verificar se já existe um Content-Type nos headers
        const hasContentType = Object.keys(headers).some(key =>
          key.toLowerCase() === 'content-type'
        );

        // Se não houver Content-Type, adicionar um padrão com base no conteúdo
        if (!hasContentType) {
          // Tentar detectar se é JSON
          try {
            JSON.parse(data);
            // Se não lançar erro, é JSON válido
            headers['Content-Type'] = 'application/json';
            console.log('Detected JSON content, adding Content-Type: application/json');
          } catch (e) {
            // Se não for JSON, usar text/plain como padrão
            headers['Content-Type'] = 'text/plain';
            console.log('Using default Content-Type: text/plain for raw body');
          }
        }

        // If content-type is application/json, parse the JSON
        const contentType = headers['Content-Type'] || headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
          try {
            data = JSON.parse(data);
          } catch (error) {
            console.warn('Failed to parse JSON body:', error);
          }
        }

        // Log do tipo de conteúdo e dados
        console.log('Request body processing:', {
          mode: 'raw',
          contentType: headers['Content-Type'] || headers['content-type'],
          dataType: typeof data,
          dataPreview: typeof data === 'string' ? data.substring(0, 100) : JSON.stringify(data).substring(0, 100)
        });
      } else if (requestData.body.mode === 'urlencoded') {
        const formData = new URLSearchParams();
        requestData.body.urlencoded.forEach(param => {
          if (!param.disabled) {
            formData.append(param.key, replaceVariables(param.value, context.getVariable));
          }
        });
        data = formData;

        // Adicionar Content-Type para urlencoded se não existir
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          console.log('Added Content-Type: application/x-www-form-urlencoded');
        }

        // Log do tipo de conteúdo e dados
        console.log('Request body processing:', {
          mode: 'urlencoded',
          contentType: headers['Content-Type'] || headers['content-type'],
          paramCount: requestData.body.urlencoded.length,
          dataPreview: data.toString().substring(0, 100)
        });
      } else if (requestData.body.mode === 'formdata') {
        const formData = new FormData();
        requestData.body.formdata.forEach(param => {
          if (!param.disabled) {
            formData.append(param.key, replaceVariables(param.value, context.getVariable));
          }
        });
        data = formData;

        // O Content-Type para FormData é definido automaticamente pelo navegador
        // com o boundary correto, então não definimos manualmente

        // Log do tipo de conteúdo e dados
        console.log('Request body processing:', {
          mode: 'formdata',
          contentType: 'multipart/form-data (set automatically by browser)',
          paramCount: requestData.body.formdata.length
        });
      }
    }

    // Processar variáveis de ambiente nas credenciais de autenticação
    let authHeader = {};

    // Check if global authentication is enabled
    const enableGlobalAuth = context.getVariable && context.getVariable('enableGlobalAuth') === 'true';
    const userValue = context.getVariable && context.getVariable('user');
    const passwordValue = context.getVariable && context.getVariable('password');

    // Force global auth if credentials exist, even if not explicitly enabled
    const shouldUseGlobalAuth = enableGlobalAuth || (!!userValue && !!passwordValue);

    console.log('Authentication check:', {
      requestHasAuth: !!context.auth,
      globalAuthEnabled: enableGlobalAuth,
      userVariableExists: !!userValue,
      passwordVariableExists: !!passwordValue,
      shouldUseGlobalAuth: shouldUseGlobalAuth
    });

    if (context.auth || shouldUseGlobalAuth) {
      let username = '';
      let password = '';

      if (context.auth) {
        // Use request-specific auth if available
        username = context.auth.username;
        password = context.auth.password;
        console.log('Using request-specific authentication');
      } else if (shouldUseGlobalAuth) {
        // Use global auth variables if enabled or credentials exist
        username = '{{user}}';
        password = '{{password}}';
        console.log('Using global authentication variables');

        // Log direct values for debugging
        if (context.getVariable) {
          const directUser = context.getVariable('user');
          const directPassword = context.getVariable('password');
          console.log('Direct global auth values:', {
            user: directUser || '[not set]',
            passwordSet: !!directPassword
          });
        }
      }

      // Replace variables in credentials
      if (username.includes('{{') || password.includes('{{')) {
        try {
          const originalUsername = username;

          username = replaceVariables(username, context.getVariable);
          password = replaceVariables(password, context.getVariable);

          console.log('Variable substitution:', {
            originalUsername,
            resolvedUsername: username || '[empty]',
            passwordResolved: password ? true : false
          });
        } catch (error) {
          console.error('Error replacing auth variables:', error);
        }
      }

      // Only add auth header if we have credentials
      if (username || password) {
        try {
          // Garantir que username e password não sejam undefined
          const safeUsername = username || '';
          const safePassword = password || '';

          // Criar o header de autenticação Basic
          const base64Credentials = btoa(`${safeUsername}:${safePassword}`);
          authHeader = {
            'Authorization': `Basic ${base64Credentials}`
          };

          console.log('Added Basic Auth header:', {
            username: safeUsername || '[empty]',
            hasPassword: !!safePassword,
            base64Value: base64Credentials,
            authHeader: authHeader.Authorization
          });

          // Verificar se o header foi criado corretamente
          try {
            const decodedCredentials = atob(base64Credentials);
            console.log('Verificação de credenciais:', {
              decodedCredentials: `${safeUsername}:${safePassword.replace(/./g, '*')}`,
              matches: decodedCredentials === `${safeUsername}:${safePassword}`
            });
          } catch (decodeError) {
            console.error('Erro ao decodificar credenciais:', decodeError);
          }
        } catch (error) {
          console.error('Error creating auth header:', error);
        }
      } else {
        console.warn('No credentials available for authentication');
      }
    }

    // Prepare final headers
    const finalHeaders = {
      ...modifiedHeaders,
      ...authHeader
    };

    // Log final request details
    console.log('Sending request with:', {
      method: requestData.method.toLowerCase(),
      url,
      hasAuthHeader: !!authHeader.Authorization,
      headers: Object.keys(finalHeaders)
    });

    // Log detalhado dos cabeçalhos finais
    console.log('Final request headers:', finalHeaders);

    // Send the request
    const response = await axios({
      method: requestData.method.toLowerCase(),
      url,
      headers: finalHeaders,
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

    // Log específico para erro 500
    if (response.status === 500) {
      console.error('ERRO 500 DETECTADO!');
      console.error('URL da requisição:', url);
      console.error('Método:', requestData.method.toLowerCase());
      console.error('Headers:', JSON.stringify(finalHeaders, null, 2));
      console.error('Dados enviados:', JSON.stringify(data, null, 2));
      console.error('Resposta do servidor:', JSON.stringify(response.data, null, 2));
    }

    // Process test script if available
    let testResults = null;
    console.log('Processing test scripts for request:', {
      hasEvent: !!requestData.event,
      eventCount: requestData.event ? requestData.event.length : 0,
      events: requestData.event
    });

    if (requestData.event) {
      const testEvent = requestData.event.find(e => e.listen === 'test');
      console.log('Found test event:', {
        hasTestEvent: !!testEvent,
        testEventDetails: testEvent
      });

      if (testEvent && testEvent.script) {
        console.log('Test script found:', {
          scriptType: typeof testEvent.script,
          hasExec: !!testEvent.script.exec,
          execType: testEvent.script.exec ? (Array.isArray(testEvent.script.exec) ? 'array' : typeof testEvent.script.exec) : 'none'
        });

        // Corrigir o problema com as quebras de linha
        let script;
        if (Array.isArray(testEvent.script.exec)) {
          script = testEvent.script.exec.join('\n');
        } else {
          // Se não for um array, pode ser uma string com \n literais
          script = testEvent.script.exec;
          // Substituir \n literais por quebras de linha reais
          script = script.replace(/\\n/g, '\n');
        }

        console.log('Script após processamento de quebras de linha:', {
          scriptLength: script.length,
          scriptPreview: script.substring(0, 100) + (script.length > 100 ? '...' : ''),
          containsLiteralNewlines: script.includes('\\n')
        });

        console.log('Executing test script:', {
          scriptLength: script.length,
          scriptPreview: script.substring(0, 100) + (script.length > 100 ? '...' : '')
        });

        // Preparar o objeto de requisição para o testRunner
        const requestForTest = {
          ...requestData,
          body: requestData.body || {}
        };

        // Log do objeto de requisição para depuração
        console.log('Request object for test runner:', {
          method: requestForTest.method,
          url: requestForTest.url,
          hasBody: !!requestForTest.body,
          bodyMode: requestForTest.body?.mode,
          bodyPreview: requestForTest.body?.raw
            ? requestForTest.body.raw.substring(0, 100)
            : '[no raw body]'
        });

        // Garantir que o nome da requisição esteja disponível no contexto
        const requestName = requestData.name || 'Unknown';
        console.log('Enviando script para execução com nome da requisição:', requestName);

        // Verificar se o script contém padrões específicos de origem ou destino
        const isOriginScript = script.includes('SALVAR ORIGEM') ||
                              script.includes('origin') ||
                              script.includes('ORIGEM');
        const isDestinationScript = script.includes('SALVAR DESTINO') ||
                                   script.includes('destination') ||
                                   script.includes('DESTINO');

        console.log('Análise do conteúdo do script:', {
          isOriginScript,
          isDestinationScript,
          containsConstCidade: script.includes('const cidade ='),
          scriptPreview: script.substring(0, 150)
        });

        // Extrair os parâmetros de teste do contexto
        const testParameters = {};
        if (context.getVariable) {
          // Obter os valores de origem e destino
          testParameters.origin = context.getVariable('origin');
          testParameters.destination = context.getVariable('destination');
          testParameters.originName = context.getVariable('originName');
          testParameters.destinationName = context.getVariable('destinationName');

          // Verificar se os valores são numéricos
          const isOriginNumeric = testParameters.origin && !isNaN(Number(testParameters.origin));
          const isDestinationNumeric = testParameters.destination && !isNaN(Number(testParameters.destination));

          console.log('Análise de parâmetros numéricos:', {
            origin: testParameters.origin,
            destination: testParameters.destination,
            isOriginNumeric,
            isDestinationNumeric
          });

          // Garantir que origin e destination sejam numéricos quando possível
          if (!isOriginNumeric && testParameters.origin) {
            console.log('Aviso: origin não é numérico:', testParameters.origin);
          }

          if (!isDestinationNumeric && testParameters.destination) {
            console.log('Aviso: destination não é numérico:', testParameters.destination);
          }
        }

        console.log('Parâmetros de teste extraídos para o script:', testParameters);

        testResults = runTests(script, {
          ...context,
          response,
          request: {
            ...requestForTest,
            name: requestName // Garantir que o nome da requisição esteja disponível
          },
          requestName: requestName, // Adicionar o nome da requisição diretamente no contexto
          originalRequestName: requestData.name || 'Unknown', // Nome original da requisição
          parameters: testParameters, // Adicionar os parâmetros de teste diretamente no contexto
          origin: testParameters.origin, // Adicionar origem diretamente no contexto
          destination: testParameters.destination, // Adicionar destino diretamente no contexto
          originName: testParameters.originName, // Adicionar nome da origem diretamente no contexto
          destinationName: testParameters.destinationName // Adicionar nome do destino diretamente no contexto
        });

        console.log('Test results:', {
          hasResults: !!testResults,
          passed: testResults ? testResults.passed : 0,
          failed: testResults ? testResults.failed : 0,
          environmentVariables: testResults ? testResults.environmentVariables : [],
          globalVariables: testResults ? testResults.globalVariables : [],
          scriptModified: testResults.scriptModified || false
        });

        // Log adicional se o script foi modificado
        if (testResults.scriptModified) {
          console.log('Script de teste foi modificado para usar valores dinâmicos');
        }
      }
    }

    return {
      ...response,
      testResults
    };
  } catch (error) {
    console.error('Request error:', error);

    // Registrar o erro no console
    if (context && context.logger) {
      context.logger(LOG_TYPES.ERROR, `Error: ${error.message}`, {
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



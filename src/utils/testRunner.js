import { expect } from 'chai';

/**
 * Run a Postman test script
 * @param {string} script - The test script to run
 * @param {Object} context - The context object with response and environment data
 * @returns {Object} - The test results
 */
// Função para modificar scripts de teste para usar valores dinâmicos
const modifyTestScript = (script, context, requestName) => {
  // Se não temos um script ou não temos parâmetros de teste, retornar o script original
  if (!script || !context.getVariable) {
    console.log('Não foi possível modificar o script: script ou getVariable não disponível');
    return script;
  }

  // Verificar se é um script de origem ou destino - usando múltiplos métodos de detecção

  // 1. Verificar pelo nome da requisição
  let isOriginScript = requestName &&
    (requestName.toUpperCase().includes('ORIGEM') ||
     requestName.toUpperCase().includes('ORIGIN'));

  let isDestinationScript = requestName &&
    (requestName.toUpperCase().includes('DESTINO') ||
     requestName.toUpperCase().includes('DESTINATION'));

  // 2. Verificar pelo conteúdo do script
  if (!isOriginScript && !isDestinationScript) {
    isOriginScript = script.includes('SALVAR ORIGEM') ||
                    (script.includes('origin') && script.includes('const cidade ='));

    isDestinationScript = script.includes('SALVAR DESTINO') ||
                         (script.includes('destination') && script.includes('const cidade ='));
  }

  console.log('Análise detalhada do script de teste:', {
    requestName,
    isOriginScript,
    isDestinationScript,
    scriptLength: script.length,
    scriptPreview: script.substring(0, 150) + '...',
    containsConstCidade: script.includes('const cidade ='),
    containsSalvarOrigem: script.includes('SALVAR ORIGEM'),
    containsSalvarDestino: script.includes('SALVAR DESTINO')
  });

  if (!isOriginScript && !isDestinationScript) {
    console.log('Script não identificado como origem ou destino, não será modificado');
    return script;
  }

  // Obter os valores de origem e destino dos parâmetros de teste
  const originName = context.getVariable('originName');
  const destinationName = context.getVariable('destinationName');

  // Obter os IDs de origem e destino
  const originId = context.getVariable('origin');
  const destinationId = context.getVariable('destination');

  // Verificar se os valores são numéricos
  const isOriginIdNumeric = originId && !isNaN(Number(originId));
  const isDestinationIdNumeric = destinationId && !isNaN(Number(destinationId));

  // Tentar obter valores de outras fontes se não estiverem disponíveis
  const originValueAlt = originName ||
                        (isOriginIdNumeric ? null : originId) ||
                        context.origin ||
                        (context.parameters && context.parameters.originName);

  const destinationValueAlt = destinationName ||
                             (isDestinationIdNumeric ? null : destinationId) ||
                             context.destination ||
                             (context.parameters && context.parameters.destinationName);

  console.log('Análise de valores numéricos:', {
    originId,
    destinationId,
    isOriginIdNumeric,
    isDestinationIdNumeric
  });

  console.log('Valores disponíveis para substituição:', {
    originName,
    destinationName,
    originId,
    destinationId,
    originAlt: originValueAlt,
    destinationAlt: destinationValueAlt,
    contextHasParameters: !!context.parameters
  });

  // Se não temos os valores necessários, tentar usar valores alternativos
  let finalOriginValue = originName || originValueAlt;
  let finalDestinationValue = destinationName || destinationValueAlt;

  if (isOriginScript && !finalOriginValue) {
    console.log('Script de origem, mas nenhum valor de origem disponível');
    return script;
  }
  if (isDestinationScript && !finalDestinationValue) {
    console.log('Script de destino, mas nenhum valor de destino disponível');
    return script;
  }

  // Log dos valores finais que serão usados
  console.log('Valores finais para substituição:', {
    finalOriginValue,
    finalDestinationValue
  });

  // Substituir o valor hardcoded da cidade pelo valor dinâmico
  let modifiedScript = script;
  const cidadeRegex = /const\s+cidade\s*=\s*"[^"]*"/;

  // Verificar se o padrão existe no script
  if (!cidadeRegex.test(script)) {
    console.log('Padrão "const cidade = "..." não encontrado no script');

    // Tentar encontrar outras variações do padrão
    const altRegex1 = /const\s+cidade\s*=\s*'[^']*'/;
    const altRegex2 = /var\s+cidade\s*=\s*"[^"]*"/;
    const altRegex3 = /var\s+cidade\s*=\s*'[^']*'/;
    const altRegex4 = /let\s+cidade\s*=\s*"[^"]*"/;
    const altRegex5 = /let\s+cidade\s*=\s*'[^']*'/;

    if (altRegex1.test(script)) {
      console.log('Encontrado padrão alternativo: const cidade = \'...\'');
      if (isOriginScript && finalOriginValue) {
        modifiedScript = modifiedScript.replace(altRegex1, `const cidade = '${finalOriginValue}'`);
        console.log('Script modificado com padrão alternativo');
        return modifiedScript;
      } else if (isDestinationScript && finalDestinationValue) {
        modifiedScript = modifiedScript.replace(altRegex1, `const cidade = '${finalDestinationValue}'`);
        console.log('Script modificado com padrão alternativo');
        return modifiedScript;
      }
    } else if (altRegex2.test(script)) {
      console.log('Encontrado padrão alternativo: var cidade = "..."');
      if (isOriginScript && finalOriginValue) {
        modifiedScript = modifiedScript.replace(altRegex2, `var cidade = "${finalOriginValue}"`);
        console.log('Script modificado com padrão alternativo');
        return modifiedScript;
      } else if (isDestinationScript && finalDestinationValue) {
        modifiedScript = modifiedScript.replace(altRegex2, `var cidade = "${finalDestinationValue}"`);
        console.log('Script modificado com padrão alternativo');
        return modifiedScript;
      }
    } else {
      // Verificar outros padrões alternativos...
      console.log('Nenhum padrão conhecido encontrado no script');
      console.log('Script original:', script);
      return script;
    }
  }

  if (isOriginScript && finalOriginValue) {
    // Substituir a linha que define a constante cidade
    modifiedScript = modifiedScript.replace(
      cidadeRegex,
      `const cidade = "${finalOriginValue}"`
    );
    console.log('Script de origem modificado para usar:', finalOriginValue);
    console.log('Script modificado:', modifiedScript.substring(0, 200) + '...');
  } else if (isDestinationScript && finalDestinationValue) {
    // Substituir a linha que define a constante cidade
    modifiedScript = modifiedScript.replace(
      cidadeRegex,
      `const cidade = "${finalDestinationValue}"`
    );
    console.log('Script de destino modificado para usar:', finalDestinationValue);
    console.log('Script modificado:', modifiedScript.substring(0, 200) + '...');
  }

  return modifiedScript;
};

export const runTests = (script, context) => {
  if (!script) return { tests: [], passed: 0, failed: 0 };

  // Log do contexto para depuração
  console.log('Test runner context:', {
    hasResponse: !!context.response,
    hasRequest: !!context.request,
    requestBodyType: context.request ? (typeof context.request.body) : 'undefined',
    requestHasRawBody: context.request?.body?.raw ? true : false,
    requestName: context.request?.name || 'Unknown'
  });

  // Extrair o nome da requisição de várias fontes possíveis
  const requestName = context.request?.name ||
                     context.request?.originalName ||
                     context.requestName ||
                     'Unknown';

  console.log('Nome da requisição para modificação do script:', requestName);

  // Modificar o script para usar valores dinâmicos
  const modifiedScript = modifyTestScript(script, context, requestName);

  const testResults = [];
  let passedCount = 0;
  let failedCount = 0;

  try {
    // Track environment variables that are set during test execution
    const setEnvironmentVariables = [];
    const setGlobalVariables = [];

    // Create a pm object similar to Postman's
    const pm = {
      response: {
        json: () => {
          try {
            return typeof context.response.data === 'object'
              ? context.response.data
              : JSON.parse(context.response.data || '{}');
          } catch (e) {
            console.warn('Failed to parse response data as JSON:', e);
            return {};
          }
        },
        text: () => {
          if (typeof context.response.data === 'object') {
            return JSON.stringify(context.response.data);
          }
          return context.response.data || '';
        },
        status: context.response.status,
        code: context.response.status,
        responseTime: context.response.responseTime,
        headers: context.response.headers
      },
      request: {
        // Adicionar propriedades do request que são usadas nos scripts de teste
        body: {
          // Função para obter o corpo da requisição como texto
          get raw() {
            try {
              if (!context.request || !context.request.body) {
                console.warn('Request or request.body is undefined');
                return '{}';
              }

              if (context.request.body.raw) {
                return context.request.body.raw;
              }

              if (context.request.body.mode === 'raw') {
                return context.request.body.raw || '{}';
              }

              // Fallback para outros modos ou quando não há corpo
              return JSON.stringify(context.request.body || {});
            } catch (error) {
              console.error('Error accessing request.body.raw:', error);
              return '{}';
            }
          }
        },
        url: context.request?.url,
        method: context.request?.method,
        headers: context.request?.header || {}
      },
      environment: {
        set: (key, value) => {
          setEnvironmentVariables.push({ key, value });
          if (context.setEnvironmentVariable) {
            context.setEnvironmentVariable(key, value);
            console.log(`Test script set environment variable: ${key} = ${value}`);
          }
        },
        get: context.getVariable
      },
      globals: {
        set: (key, value) => {
          setGlobalVariables.push({ key, value });
          if (context.setGlobalVariable) {
            context.setGlobalVariable(key, value);
            console.log(`Test script set global variable: ${key} = ${value}`);
          }
        },
        get: context.getVariable
      },
      variables: {
        get: context.getVariable
      },
      test: (name, testFn) => {
        try {
          testFn();
          testResults.push({ name, passed: true });
          passedCount++;
        } catch (error) {
          testResults.push({ name, passed: false, error: error.message });
          failedCount++;
        }
      },
      expect
    };

    // Execute the modified script
    new Function('pm', modifiedScript)(pm);

    return {
      tests: testResults,
      passed: passedCount,
      failed: failedCount,
      environmentVariables: setEnvironmentVariables,
      globalVariables: setGlobalVariables,
      scriptModified: modifiedScript !== script // Indicar se o script foi modificado
    };
  } catch (error) {
    console.error('Erro ao executar script de teste:', error);
    console.error('Script que causou o erro:', modifiedScript);

    return {
      tests: [{ name: 'Script execution error', passed: false, error: error.message }],
      passed: 0,
      failed: 1,
      error: error.message,
      scriptModified: modifiedScript !== script // Indicar se o script foi modificado
    };
  }
};

/**
 * Format test results for display
 * @param {Object} results - The test results from runTests
 * @returns {string} - Formatted HTML for displaying test results
 */
export const formatTestResults = (results) => {
  if (!results || !results.tests || results.tests.length === 0) {
    return '<div class="text-gray-500">No tests were run</div>';
  }

  const totalTests = results.passed + results.failed;
  const passPercentage = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;

  let html = `
    <div class="mb-4">
      <div class="text-lg font-semibold">
        Test Results: ${results.passed}/${totalTests} passed (${passPercentage}%)
      </div>
    </div>
  `;

  // Adicionar mensagem se o script foi modificado
  if (results.scriptModified) {
    html += `
      <div class="mb-4">
        <div class="bg-blue-50 text-blue-700 p-2 rounded text-sm">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Script de teste modificado para usar valores dinâmicos dos parâmetros de teste.</span>
          </div>
        </div>
      </div>
    `;
  }

  // Add environment variables section if any were set
  if (results.environmentVariables && results.environmentVariables.length > 0) {
    html += `
      <div class="mb-4">
        <div class="text-md font-semibold mb-2">Environment Variables Set:</div>
        <div class="bg-blue-50 p-3 rounded text-sm">
    `;

    results.environmentVariables.forEach(variable => {
      html += `
        <div class="mb-1">
          <span class="font-medium">${variable.key}:</span>
          <span class="text-blue-700">${variable.value}</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  // Add global variables section if any were set
  if (results.globalVariables && results.globalVariables.length > 0) {
    html += `
      <div class="mb-4">
        <div class="text-md font-semibold mb-2">Global Variables Set:</div>
        <div class="bg-purple-50 p-3 rounded text-sm">
    `;

    results.globalVariables.forEach(variable => {
      html += `
        <div class="mb-1">
          <span class="font-medium">${variable.key}:</span>
          <span class="text-purple-700">${variable.value}</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  html += `<div class="space-y-2">`;

  results.tests.forEach(test => {
    const statusClass = test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const statusIcon = test.passed ? '✓' : '✗';

    html += `
      <div class="p-3 rounded ${statusClass}">
        <div class="flex items-start">
          <div class="mr-2 font-bold">${statusIcon}</div>
          <div>
            <div class="font-medium">${test.name}</div>
            ${test.error ? `<div class="text-sm mt-1">${test.error}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  return html;
};

import { createContext, useState, useContext, useCallback, useRef } from 'react';
import { sendRequest } from '../utils/requestRunner';
import { useEnvironment } from '../hooks/useEnvironment';
import { useConsole } from './ConsoleContext';
import { LOG_TYPES } from './ConsoleContext';
import { isNumericValue } from '../utils/validators';
import { toast } from 'react-toastify';

export const TestContext = createContext();

export const useTest = () => useContext(TestContext);

export const TestProvider = ({ children }) => {
  const [testParameters, setTestParameters] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [requestSequence, setRequestSequence] = useState([]);

  // Use refs to control test execution flow
  const pauseRef = useRef(false);
  const abortControllerRef = useRef(null);

  const { getVariable, setEnvironmentVariable, setGlobalVariable } = useEnvironment();
  const { log } = useConsole();

  // Pause the currently running tests
  const pauseTests = useCallback(() => {
    if (!isRunning || isPaused) return;

    pauseRef.current = true;
    setIsPaused(true);

    if (log) log(LOG_TYPES.INFO, 'Tests paused by user');
    toast.info('Tests paused', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }, [isRunning, isPaused, log]);

  // Resume the paused tests
  const resumeTests = useCallback(() => {
    if (!isRunning || !isPaused) return;

    pauseRef.current = false;
    setIsPaused(false);

    if (log) log(LOG_TYPES.INFO, 'Tests resumed by user');
    toast.info('Tests resumed', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }, [isRunning, isPaused, log]);

  // Add a new parameter set (origin/destination)
  const addParameterSet = useCallback((initialValues = { origin: '', destination: '', enabled: true }) => {
    // Garantir que os valores iniciais sejam numéricos ou vazios
    const validatedValues = {
      ...initialValues,
      origin: initialValues.origin && !isNaN(Number(initialValues.origin)) ? initialValues.origin : '',
      destination: initialValues.destination && !isNaN(Number(initialValues.destination)) ? initialValues.destination : '',
      enabled: initialValues.enabled !== undefined ? initialValues.enabled : true
    };

    setTestParameters([...testParameters, validatedValues]);
  }, [testParameters]);

  // Add multiple parameter sets at once
  const addMultipleParameterSets = useCallback((paramsList) => {
    if (!paramsList || !paramsList.length) return;

    setTestParameters(prev => [...prev, ...paramsList]);
  }, []);

  // Update a parameter set
  const updateParameterSet = useCallback((index, field, value) => {
    const updatedParams = [...testParameters];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    setTestParameters(updatedParams);
  }, [testParameters]);

  // Remove a parameter set
  const removeParameterSet = useCallback((index) => {
    const updatedParams = [...testParameters];
    updatedParams.splice(index, 1);
    setTestParameters(updatedParams);
  }, [testParameters]);

  // Toggle parameter set enabled/disabled
  const toggleParameterSet = useCallback((index) => {
    const updatedParams = [...testParameters];
    updatedParams[index] = {
      ...updatedParams[index],
      enabled: !updatedParams[index].enabled
    };
    setTestParameters(updatedParams);
  }, [testParameters]);

  // Toggle all parameter sets enabled/disabled
  const toggleAllParameterSets = useCallback((enabled = true) => {
    if (testParameters.length === 0) return;

    const updatedParams = testParameters.map(param => ({
      ...param,
      enabled
    }));
    setTestParameters(updatedParams);
  }, [testParameters]);

  // Clear all parameter sets
  const clearParameterSets = useCallback(() => {
    setTestParameters([]);
  }, []);

  // Run tests with all parameter combinations
  const runTests = useCallback(async (request) => {
    if (!request || testParameters.length === 0) {
      if (log) log(LOG_TYPES.ERROR, 'No request or parameters to test');
      return;
    }

    // Filter only enabled parameter sets
    const enabledParams = testParameters.filter(param => param.enabled);
    if (enabledParams.length === 0) {
      if (log) log(LOG_TYPES.ERROR, 'No enabled parameter sets to test');
      return;
    }

    // Reset pause state if it was previously paused
    pauseRef.current = false;
    setIsPaused(false);

    setIsRunning(true);
    setProgress(0);
    setRequestSequence([]);
    setTestResults([]);

    const newResults = [];
    const newSequence = [];

    try {
      for (let i = 0; i < enabledParams.length; i++) {
        // Check if tests have been paused
        while (pauseRef.current) {
          // Wait for 500ms before checking again
          await new Promise(resolve => setTimeout(resolve, 500));

          // If we're no longer running (e.g., tests were stopped), exit the loop
          if (!isRunning) {
            return;
          }
        }

        const param = enabledParams[i];

        // Set environment variables for this test
        if (setEnvironmentVariable) {
          // Verificar se os valores de origem e destino são numéricos ou strings
          const isOriginNumeric = !isNaN(Number(param.origin));
          const isDestinationNumeric = !isNaN(Number(param.destination));

          // Se for numérico, usar como ID, caso contrário, usar como nome
          const originId = isOriginNumeric ? param.origin : null;
          const destinationId = isDestinationNumeric ? param.destination : null;

          const originName = isOriginNumeric ? null : param.origin;
          const destinationName = isDestinationNumeric ? null : param.destination;

          // Definir os IDs de origem e destino (ou null se não for numérico)
          setEnvironmentVariable('origin', originId || param.origin);
          setEnvironmentVariable('destination', destinationId || param.destination);

          // Definir também os nomes das cidades para uso nos scripts de teste
          setEnvironmentVariable('originName', originName || param.origin);
          setEnvironmentVariable('destinationName', destinationName || param.destination);

          // Log para depuração
          console.log('Variáveis de ambiente definidas para o teste:', {
            origin: originId || param.origin,
            destination: destinationId || param.destination,
            originName: originName || param.origin,
            destinationName: destinationName || param.destination,
            isOriginNumeric,
            isDestinationNumeric
          });
        }

        // Log the test being run
        if (log) log(LOG_TYPES.INFO, `Running test with origin: ${param.origin}, destination: ${param.destination}`);

        // Log the request details for debugging
        console.log('Sending request with parameters:', {
          origin: param.origin,
          destination: param.destination,
          requestMethod: request.method,
          requestUrl: request.url
        });

        // Check if global authentication is enabled
        const enableGlobalAuth = getVariable && getVariable('enableGlobalAuth') === 'true';
        const userValue = getVariable && getVariable('user');
        const passwordValue = getVariable && getVariable('password');

        // Force global auth if credentials exist, even if not explicitly enabled
        const shouldUseGlobalAuth = enableGlobalAuth || (!!userValue && !!passwordValue);

        console.log('Test runner - Authentication info:', {
          globalAuthEnabled: enableGlobalAuth,
          userValue: userValue || '[not set]',
          passwordSet: !!passwordValue,
          shouldUseGlobalAuth: shouldUseGlobalAuth
        });

        // Criar uma função getVariable melhorada para o contexto de teste
        const getTestVariable = (key) => {
          // Special handling for our test parameters
          if (key === 'origin') {
            // Verificar se o valor do parâmetro é numérico
            if (isNumericValue(param.origin)) {
              console.log(`Parâmetro origin é numérico: ${param.origin}`);
              return param.origin;
            }
            return param.origin;
          }

          if (key === 'destination') {
            // Verificar se o valor do parâmetro é numérico
            if (isNumericValue(param.destination)) {
              console.log(`Parâmetro destination é numérico: ${param.destination}`);
              return param.destination;
            }
            return param.destination;
          }

          if (key === 'originName') return param.origin;
          if (key === 'destinationName') return param.destination;

          // Log para depuração
          console.log(`Solicitação de variável: ${key}`);

          // Fall back to environment variables
          const value = getVariable ? getVariable(key) : null;
          console.log(`Valor obtido para ${key}: ${value}`);
          return value;
        };

        // Send the request
        const response = await sendRequest(request, {
          getVariable: getTestVariable,
          setEnvironmentVariable: setEnvironmentVariable || (() => {}),
          setGlobalVariable: setGlobalVariable || (() => {}),
          logger: log || (() => {})
        });

        // Add to results
        newResults.push({
          parameters: { ...param },
          response,
          timestamp: new Date().toISOString()
        });

        // Add to sequence
        try {
          newSequence.push({
            url: response.config?.url || 'unknown',
            method: response.config?.method || request.method || 'unknown',
            status: response.status || 0,
            timestamp: new Date().toISOString(),
            parameters: { ...param }
          });
        } catch (seqError) {
          console.error('Error adding to sequence:', seqError);
          // Add a fallback entry
          newSequence.push({
            url: 'error',
            method: request.method || 'unknown',
            status: 0,
            timestamp: new Date().toISOString(),
            parameters: { ...param },
            error: seqError.message
          });
        }

        // Update progress
        setProgress(Math.round(((i + 1) / enabledParams.length) * 100));
        setTestResults([...newResults]);
        setRequestSequence([...newSequence]);
      }

      if (log) log(LOG_TYPES.SUCCESS, `Completed ${newResults.length} tests`);
    } catch (error) {
      if (log) log(LOG_TYPES.ERROR, `Test run error: ${error.message}`);
      console.error('Test run error:', error);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  }, [testParameters, getVariable, setEnvironmentVariable, setGlobalVariable, log]);

  // Run collection requests in sequence
  const runCollectionSequence = useCallback(async (collection) => {
    if (!collection) {
      if (log) log(LOG_TYPES.ERROR, `No collection provided`);
      return;
    }

    // Log collection structure for debugging
    console.log('Collection structure:', {
      name: collection.info.name,
      hasItems: !!collection.item,
      itemCount: collection.item ? collection.item.length : 0,
      firstItemSample: collection.item && collection.item.length > 0 ? {
        name: collection.item[0].name,
        hasRequest: !!collection.item[0].request,
        hasEvent: !!collection.item[0].event,
        hasItems: !!collection.item[0].item
      } : null
    });

    // Extract all requests from the collection
    const extractRequests = (items, path = '') => {
      let result = [];

      for (const item of items) {
        const itemPath = path ? `${path} / ${item.name}` : item.name;

        if (item.request) {
          // Log the item structure for debugging
          console.log('Extracting request from collection item:', {
            name: item.name,
            hasRequest: !!item.request,
            hasEvent: !!item.event,
            eventCount: item.event ? item.event.length : 0,
            eventDetails: item.event
          });

          result.push({
            id: item.id || `request-${result.length}`,
            name: item.name,
            path: itemPath,
            request: item.request,
            event: item.event
          });
        }

        if (item.item && item.item.length > 0) {
          result = [...result, ...extractRequests(item.item, itemPath)];
        }
      }

      return result;
    };

    const requests = extractRequests(collection.item);

    if (requests.length === 0) {
      if (log) log(LOG_TYPES.ERROR, 'No requests found in the collection');
      return;
    }

    // Check if we have parameters
    if (testParameters.length === 0) {
      if (log) log(LOG_TYPES.ERROR, 'No parameters defined for testing');
      return;
    }

    // Filter only enabled parameter sets
    const enabledParams = testParameters.filter(param => param.enabled);
    if (enabledParams.length === 0) {
      if (log) log(LOG_TYPES.ERROR, 'No enabled parameter sets to test');
      return;
    }

    // Reset pause state if it was previously paused
    pauseRef.current = false;
    setIsPaused(false);

    setIsRunning(true);
    setProgress(0);
    setRequestSequence([]);
    setTestResults([]);

    const newResults = [];
    const newSequence = [];

    // Objeto para armazenar as variáveis atualizadas pelos scripts de teste
    // durante a execução da sequência
    const sequenceVariables = {};

    try {
      // For each parameter set
      for (let paramIndex = 0; paramIndex < enabledParams.length; paramIndex++) {
        // Check if tests have been paused
        while (pauseRef.current) {
          // Wait for 500ms before checking again
          await new Promise(resolve => setTimeout(resolve, 500));

          // If we're no longer running (e.g., tests were stopped), exit the loop
          if (!isRunning) {
            return;
          }
        }

        const param = enabledParams[paramIndex];

        // Set environment variables for this test
        if (setEnvironmentVariable) {
          // Verificar se os valores de origem e destino são numéricos ou strings
          const isOriginNumeric = !isNaN(Number(param.origin));
          const isDestinationNumeric = !isNaN(Number(param.destination));

          // Se for numérico, usar como ID, caso contrário, usar como nome
          const originId = isOriginNumeric ? param.origin : null;
          const destinationId = isDestinationNumeric ? param.destination : null;

          const originName = isOriginNumeric ? null : param.origin;
          const destinationName = isDestinationNumeric ? null : param.destination;

          // Definir os IDs de origem e destino (ou null se não for numérico)
          setEnvironmentVariable('origin', originId || param.origin);
          setEnvironmentVariable('destination', destinationId || param.destination);

          // Definir também os nomes das cidades para uso nos scripts de teste
          setEnvironmentVariable('originName', originName || param.origin);
          setEnvironmentVariable('destinationName', destinationName || param.destination);

          // Log para depuração
          console.warn('Variáveis de ambiente definidas para a sequência:', {
            origin: originId || param.origin,
            destination: destinationId || param.destination,
            originName: originName || param.origin,
            destinationName: destinationName || param.destination,
            isOriginNumeric,
            isDestinationNumeric
          });
        }

        if (log) log(LOG_TYPES.INFO, `Running sequence with origin: ${param.origin}, destination: ${param.destination}`);

        // Execute requests in sequence
        let continueSequence = true;

        for (let reqIndex = 0; reqIndex < requests.length && continueSequence; reqIndex++) {
          // Check if tests have been paused
          while (pauseRef.current) {
            // Wait for 500ms before checking again
            await new Promise(resolve => setTimeout(resolve, 500));

            // If we're no longer running (e.g., tests were stopped), exit the loop
            if (!isRunning) {
              return;
            }
          }

          const requestData = requests[reqIndex];

          // Make sure we have a valid request object with all required properties
          const request = {
            ...requestData.request,
            method: requestData.request.method || 'GET',
            event: requestData.event || []
          };

          // Ensure event is properly attached to the request
          if (requestData.event && !request.event) {
            request.event = requestData.event;
            console.log('Attached event to request object');
          }

          // Log event information for debugging
          console.log('Request event data:', {
            requestName: requestData.name,
            hasEvent: !!requestData.event,
            eventCount: requestData.event ? requestData.event.length : 0,
            events: requestData.event
          });

          if (log) log(LOG_TYPES.INFO, `Executing request ${reqIndex + 1}/${requests.length}: ${requestData.name}`);

          // Log the request details for debugging
          console.log('Sending request in sequence:', {
            requestIndex: reqIndex + 1,
            requestName: requestData.name,
            origin: param.origin,
            destination: param.destination,
            requestMethod: request.method,
            requestUrl: request.url
          });

          // Log das variáveis da sequência disponíveis para esta requisição
          console.log('Sequence variables available for this request:', {
            ...sequenceVariables,
            count: Object.keys(sequenceVariables).length
          });

          // Check if global authentication is enabled
          const enableGlobalAuth = getVariable && getVariable('enableGlobalAuth') === 'true';
          const userValue = getVariable && getVariable('user');
          const passwordValue = getVariable && getVariable('password');

          // Force global auth if credentials exist, even if not explicitly enabled
          const shouldUseGlobalAuth = enableGlobalAuth || (!!userValue && !!passwordValue);

          // Log the full request object before sending
          console.log('Full request object being sent:', {
            method: request.method,
            url: request.url,
            hasEvent: !!request.event,
            eventCount: request.event ? request.event.length : 0,
            eventDetails: request.event,
            requestStructure: JSON.stringify(request).substring(0, 500) + '...'
          });

          // Criar uma função getVariable que verifica primeiro as variáveis atualizadas pelos testes
          // e depois cai para as variáveis de ambiente normais
          const updatedVariables = {};

          // Função para obter variáveis, priorizando as que foram atualizadas pelos testes
          const getUpdatedVariable = (key) => {
            // Verificar primeiro nas variáveis atualizadas localmente nesta requisição
            if (updatedVariables[key] !== undefined) {
              console.log(`Using updated variable from current request: ${key}=${updatedVariables[key]}`);
              return updatedVariables[key];
            }

            // Verificar nas variáveis atualizadas por requisições anteriores na sequência
            if (sequenceVariables[key] !== undefined) {
              console.log(`Using updated variable from sequence: ${key}=${sequenceVariables[key]}`);
              return sequenceVariables[key];
            }

            // Special handling for our test parameters
            if (key === 'origin') {
              // Verificar se o valor do parâmetro é numérico
              if (isNumericValue(param.origin)) {
                console.log(`Parâmetro origin é numérico: ${param.origin}`);
                // Armazenar o ID numérico para uso futuro
                sequenceVariables.originId = param.origin;
                return param.origin;
              }
              return param.origin;
            }

            if (key === 'destination') {
              // Verificar se o valor do parâmetro é numérico
              if (isNumericValue(param.destination)) {
                console.log(`Parâmetro destination é numérico: ${param.destination}`);
                // Armazenar o ID numérico para uso futuro
                sequenceVariables.destinationId = param.destination;
                return param.destination;
              }
              return param.destination;
            }

            if (key === 'originName') return param.origin;
            if (key === 'destinationName') return param.destination;

            // Log para depuração
            console.log(`Solicitação de variável na sequência: ${key}`);

            // Fall back to environment variables
            const value = getVariable ? getVariable(key) : null;
            console.log(`Valor obtido para ${key} na sequência: ${value}`);
            return value;
          };

          // Função para definir variáveis de ambiente que também atualiza nosso cache local
          const setUpdatedEnvironmentVariable = (key, value) => {
            // Atualizar o cache local para esta requisição
            updatedVariables[key] = value;

            // Atualizar o cache da sequência para requisições subsequentes
            sequenceVariables[key] = value;

            console.log(`Updated variable in caches: ${key}=${value}`, {
              localCache: true,
              sequenceCache: true
            });

            // Chamar a função original para atualizar o ambiente global
            if (setEnvironmentVariable) {
              return setEnvironmentVariable(key, value);
            }
            return false;
          };

          // Send the request
          const response = await sendRequest(request, {
            getVariable: getUpdatedVariable,
            setEnvironmentVariable: setUpdatedEnvironmentVariable,
            setGlobalVariable: setGlobalVariable || (() => {}),
            logger: log || (() => {})
          });

          // Add to results
          newResults.push({
            parameters: { ...param },
            request: {
              name: requestData.name,
              path: requestData.path,
              index: reqIndex + 1,
              body: request.body, // Incluir o corpo da requisição
              method: request.method,
              url: request.url
            },
            response,
            timestamp: new Date().toISOString()
          });

          // Add to sequence
          try {
            newSequence.push({
              name: requestData.name,
              url: response.config?.url || 'unknown',
              method: response.config?.method || request.method || 'unknown',
              status: response.status || 0,
              timestamp: new Date().toISOString(),
              parameters: { ...param },
              requestIndex: reqIndex + 1
            });
          } catch (seqError) {
            console.error('Error adding to sequence:', seqError);
            newSequence.push({
              name: requestData.name,
              url: 'error',
              method: request.method || 'unknown',
              status: 0,
              timestamp: new Date().toISOString(),
              parameters: { ...param },
              requestIndex: reqIndex + 1,
              error: seqError.message
            });
          }

          // Update progress - calculate based on total requests across all params
          const totalRequests = enabledParams.length * requests.length;
          const completedRequests = paramIndex * requests.length + (reqIndex + 1);
          setProgress(Math.round((completedRequests / totalRequests) * 100));

          // Update results and sequence
          setTestResults([...newResults]);
          setRequestSequence([...newSequence]);

          // Log test results if available
          if (response.testResults) {
            const passedTests = response.testResults.passed;
            const totalTests = response.testResults.passed + response.testResults.failed;

            if (log) {
              if (response.testResults.failed > 0) {
                log(LOG_TYPES.WARNING, `Tests: ${passedTests}/${totalTests} passed`);
              } else if (totalTests > 0) {
                log(LOG_TYPES.SUCCESS, `Tests: ${passedTests}/${totalTests} passed`);
              }
            }

            // Log environment variables that were set by the tests
            if (response.testResults.environmentVariables && response.testResults.environmentVariables.length > 0) {
              const envVars = response.testResults.environmentVariables.map(v => `${v.key}=${v.value}`).join(', ');
              if (log) log(LOG_TYPES.INFO, `Test set environment variables: ${envVars}`);
              console.log('Test script set environment variables:', response.testResults.environmentVariables);

              // Atualizar as variáveis da sequência com as variáveis definidas pelo teste
              response.testResults.environmentVariables.forEach(v => {
                sequenceVariables[v.key] = v.value;
              });

              // Log das variáveis da sequência após a atualização
              console.log('Sequence variables after update:', {
                ...sequenceVariables,
                count: Object.keys(sequenceVariables).length
              });
            }

            // Log global variables that were set by the tests
            if (response.testResults.globalVariables && response.testResults.globalVariables.length > 0) {
              const globalVars = response.testResults.globalVariables.map(v => `${v.key}=${v.value}`).join(', ');
              if (log) log(LOG_TYPES.INFO, `Test set global variables: ${globalVars}`);
              console.log('Test script set global variables:', response.testResults.globalVariables);

              // Atualizar as variáveis da sequência com as variáveis globais definidas pelo teste
              response.testResults.globalVariables.forEach(v => {
                sequenceVariables[v.key] = v.value;
              });

              // Log das variáveis da sequência após a atualização
              console.log('Sequence variables after global update:', {
                ...sequenceVariables,
                count: Object.keys(sequenceVariables).length
              });
            }
          }

          // Check if we should continue the sequence
          // Only continue if the response status is 200
          if (response.status !== 200) {
            if (log) log(LOG_TYPES.WARNING, `Request ${reqIndex + 1} returned status ${response.status}, stopping sequence`);
            continueSequence = false;
          }
        }
      }

      if (log) log(LOG_TYPES.SUCCESS, `Completed ${newResults.length} requests in sequence`);
    } catch (error) {
      if (log) log(LOG_TYPES.ERROR, `Sequence run error: ${error.message}`);
      console.error('Sequence run error:', error);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  }, [testParameters, getVariable, setEnvironmentVariable, setGlobalVariable, log]);

  // Convert request sequence to CSV format
  const convertSequenceToCSV = useCallback((sequence) => {
    if (!sequence || sequence.length === 0) return '';

    // Define CSV headers
    const headers = [
      'Time',
      'Sequence',
      'Name',
      'Method',
      'URL',
      'Status',
      'Origin',
      'Destination'
    ];

    // Create CSV content with headers
    let csvContent = headers.join(',') + '\n';

    // Group requests by origin/destination pairs to add separators
    const groupedRequests = [];
    let currentGroup = null;

    sequence.forEach((req, index) => {
      const paramKey = `${req.parameters.origin}-${req.parameters.destination}`;

      // If this is a new group or the first item
      if (!currentGroup || currentGroup.paramKey !== paramKey) {
        currentGroup = {
          paramKey,
          requests: [req],
          startIndex: index
        };
        groupedRequests.push(currentGroup);
      } else {
        // Add to existing group
        currentGroup.requests.push(req);
      }
    });

    // Process each group
    groupedRequests.forEach((group, groupIndex) => {
      // Add a separator row between groups (except for the first group)
      if (groupIndex > 0) {
        csvContent += `"NEW SEQUENCE: ${group.requests[0].parameters.origin} → ${group.requests[0].parameters.destination}",,,,,,,,\n`;
      }

      // Add each request in the group
      group.requests.forEach((req, reqIndex) => {
        const time = new Date(req.timestamp).toLocaleString();
        const seqNum = req.requestIndex || (group.startIndex + reqIndex + 1);
        const name = req.name || 'Unknown';
        const method = (req.method || 'GET').toUpperCase();
        const url = req.url || 'N/A';
        const status = req.status || (req.error ? 'Error' : '0');
        const origin = req.parameters.origin;
        const destination = req.parameters.destination;

        // Escape fields that might contain commas
        const row = [
          `"${time}"`,
          seqNum,
          `"${name}"`,
          `"${method}"`,
          `"${url}"`,
          status,
          `"${origin}"`,
          `"${destination}"`
        ];

        csvContent += row.join(',') + '\n';
      });
    });

    return csvContent;
  }, []);

  // Export test results
  const exportResults = useCallback((format = 'csv') => {
    try {
      if (format === 'json') {
        // Export as JSON (original format)
        const dataStr = JSON.stringify({
          results: testResults,
          sequence: requestSequence,
          timestamp: new Date().toISOString()
        }, null, 2);

        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileDefaultName = `api-test-results-${new Date().toISOString()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else {
        // Export as CSV
        const csvContent = convertSequenceToCSV(requestSequence);
        const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
        const exportFileDefaultName = `api-test-results-${new Date().toISOString()}.csv`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }

      if (log) log(LOG_TYPES.SUCCESS, `Test results exported successfully as ${format.toUpperCase()}`);
      console.log(`Test results exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      if (log) log(LOG_TYPES.ERROR, `Error exporting results: ${error.message}`);
      console.error('Error exporting results:', error);
    }
  }, [testResults, requestSequence, convertSequenceToCSV, log]);

  return (
    <TestContext.Provider
      value={{
        testParameters,
        testResults,
        isRunning,
        isPaused,
        progress,
        requestSequence,
        addParameterSet,
        addMultipleParameterSets,
        updateParameterSet,
        removeParameterSet,
        toggleParameterSet,
        toggleAllParameterSets,
        clearParameterSets,
        runTests,
        runCollectionSequence,
        pauseTests,
        resumeTests,
        exportResults
      }}
    >
      {children}
    </TestContext.Provider>
  );
};

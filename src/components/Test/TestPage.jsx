import { useState, useEffect } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useTest } from '../../hooks/useTest';
import { useEnvironment } from '../../hooks/useEnvironment';
import ParameterForm from './ParameterForm';
import TestResults from './TestResults';
import GlobalAuthSettings from '../Auth/GlobalAuthSettings';
import RequestList from './RequestList';
import { toast } from 'react-toastify';

const TestPage = () => {
  const { collections, activeCollection } = useCollection();
  const { runTests, runCollectionSequence, isRunning } = useTest();
  const { getVariable } = useEnvironment();

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsEnabled, setRequestsEnabled] = useState({});

  // Update selected collection when activeCollection changes
  useEffect(() => {
    if (activeCollection) {
      setSelectedCollection(activeCollection.info._postman_id);
    }
  }, [activeCollection]);

  // Update requests list when selected collection changes
  useEffect(() => {
    if (!selectedCollection) {
      setRequests([]);
      setRequestsEnabled({});
      return;
    }

    const collection = collections.find(c => c.info._postman_id === selectedCollection);
    if (!collection) {
      setRequests([]);
      setRequestsEnabled({});
      return;
    }

    // Log collection structure for debugging
    console.log('TestPage - Collection structure:', {
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

    // Recursively extract all requests from the collection
    const extractRequests = (items, path = '') => {
      let result = [];

      for (const item of items) {
        const itemPath = path ? `${path} / ${item.name}` : item.name;

        if (item.request) {
          // Log item structure for debugging
          console.log('TestPage - Extracting request item:', {
            name: item.name,
            hasRequest: !!item.request,
            hasEvent: !!item.event,
            eventCount: item.event ? item.event.length : 0,
            eventDetails: item.event
          });

          // Gerar um ID consistente para a requisição
          const requestId = item.id || `request-${item.name.replace(/\s+/g, '-').toLowerCase()}`;

          result.push({
            id: requestId,
            originalId: item.id, // Manter o ID original para referência
            name: item.name,
            path: itemPath,
            request: item.request,
            event: item.event,
            enabled: true // Por padrão, todas as requisições estão habilitadas
          });
        }

        if (item.item && item.item.length > 0) {
          result = [...result, ...extractRequests(item.item, itemPath)];
        }
      }

      return result;
    };

    const extractedRequests = extractRequests(collection.item);
    setRequests(extractedRequests);

    // Inicializar o estado de habilitação das requisições
    const initialEnabledState = {};
    extractedRequests.forEach(req => {
      initialEnabledState[req.id] = true;
    });
    setRequestsEnabled(initialEnabledState);
  }, [selectedCollection, collections]);

  // Handle collection change
  const handleCollectionChange = (e) => {
    setSelectedCollection(e.target.value);
    setSelectedRequest(null);
  };

  // Handle request change
  const handleRequestChange = (e) => {
    setSelectedRequest(e.target.value);
  };

  // Toggle request enabled/disabled state
  const toggleRequestEnabled = (requestId) => {
    setRequestsEnabled(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  // Handle run tests for a single request
  const handleRunTests = () => {
    if (!selectedRequest) return;

    const request = requests.find(r => r.id === selectedRequest);
    if (!request) return;

    console.log('Running tests with request:', request);

    // Check global authentication status
    const enableGlobalAuth = getVariable && getVariable('enableGlobalAuth') === 'true';
    const userValue = getVariable && getVariable('user');
    const passwordValue = getVariable && getVariable('password');

    // Force global auth if credentials exist, even if not explicitly enabled
    const shouldUseGlobalAuth = enableGlobalAuth || (!!userValue && !!passwordValue);

    console.log('Test runner - Authentication status before test run:', {
      globalAuthEnabled: enableGlobalAuth,
      userValue: userValue || '[not set]',
      passwordSet: !!passwordValue,
      shouldUseGlobalAuth: shouldUseGlobalAuth
    });

    // Make sure we have a valid request object with all required properties
    const requestData = {
      ...request.request,
      method: request.request.method || 'GET',
      event: request.event || []
    };

    // Log the full request object before sending
    console.log('TestPage - Full request object being sent:', {
      method: requestData.method,
      url: requestData.url,
      hasEvent: !!requestData.event,
      eventCount: requestData.event ? requestData.event.length : 0,
      eventDetails: requestData.event,
      requestStructure: JSON.stringify(requestData).substring(0, 500) + '...'
    });

    runTests(requestData);
  };

  // Handle run collection sequence
  const handleRunSequence = () => {
    if (!selectedCollection) return;

    // Find the full collection object
    const collection = collections.find(c => c.info._postman_id === selectedCollection);
    if (!collection) {
      console.error(`Collection with ID ${selectedCollection} not found`);
      return;
    }

    console.log('Running collection sequence for collection:', collection.info.name);

    // Check global authentication status
    const enableGlobalAuth = getVariable && getVariable('enableGlobalAuth') === 'true';
    const userValue = getVariable && getVariable('user');
    const passwordValue = getVariable && getVariable('password');

    // Force global auth if credentials exist, even if not explicitly enabled
    const shouldUseGlobalAuth = enableGlobalAuth || (!!userValue && !!passwordValue);

    console.log('Test runner - Authentication status before sequence run:', {
      globalAuthEnabled: enableGlobalAuth,
      userValue: userValue || '[not set]',
      passwordSet: !!passwordValue,
      shouldUseGlobalAuth: shouldUseGlobalAuth
    });

    // Criar uma cópia da coleção com apenas as requisições habilitadas
    const collectionCopy = JSON.parse(JSON.stringify(collection));

    // Criar um mapa de nomes de requisições para seus estados habilitados/desabilitados
    const requestEnabledMap = {};
    requests.forEach(req => {
      requestEnabledMap[req.name] = requestsEnabled[req.id] !== false;
    });

    console.log('Request enabled map:', requestEnabledMap);

    // Função recursiva para filtrar requisições desabilitadas
    const filterDisabledRequests = (items) => {
      // Log para depuração
      console.log('Filtering items:', {
        itemCount: items.length,
        itemNames: items.map(i => i.name),
        enabledState: requestsEnabled
      });

      // Filtrar requisições desabilitadas no nível atual
      const filteredItems = items.filter(item => {
        // Se for uma pasta, não filtrar
        if (item.item) return true;

        // Verificar se a requisição está habilitada pelo nome
        const isEnabled = requestEnabledMap[item.name] !== false;

        // Log para depuração
        console.log(`Request "${item.name}":`, {
          isEnabled,
          enabledInMap: requestEnabledMap[item.name],
          requestItem: item
        });

        return isEnabled;
      });

      // Log do resultado da filtragem
      console.log('Filtered items:', {
        originalCount: items.length,
        filteredCount: filteredItems.length,
        removedItems: items.filter(item => !filteredItems.includes(item)).map(i => i.name)
      });

      // Processar recursivamente as pastas
      return filteredItems.map(item => {
        if (item.item) {
          return {
            ...item,
            item: filterDisabledRequests(item.item)
          };
        }
        return item;
      });
    };

    // Aplicar o filtro à coleção
    collectionCopy.item = filterDisabledRequests(collectionCopy.item);

    // Função para contar requisições (não pastas) em uma coleção
    const countRequests = (items) => {
      let count = 0;
      for (const item of items) {
        if (item.item) {
          count += countRequests(item.item);
        } else {
          count++;
        }
      }
      return count;
    };

    // Contar requisições antes e depois da filtragem
    const originalRequestCount = countRequests(collection.item);
    const filteredRequestCount = countRequests(collectionCopy.item);

    // Log das requisições habilitadas/desabilitadas
    console.log('Collection sequence - Enabled/disabled requests:', {
      enabledState: requestsEnabled,
      requestEnabledMap,
      originalItemCount: collection.item.length,
      filteredItemCount: collectionCopy.item.length,
      originalRequestCount,
      filteredRequestCount,
      disabledCount: originalRequestCount - filteredRequestCount
    });

    // Mostrar mensagem para o usuário
    if (originalRequestCount !== filteredRequestCount) {
      const disabledCount = originalRequestCount - filteredRequestCount;
      const message = `Running sequence with ${filteredRequestCount} of ${originalRequestCount} requests. ${disabledCount} ${disabledCount === 1 ? 'request is' : 'requests are'} disabled.`;

      console.log(message);

      // Mostrar notificação toast
      toast.info(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }

    // Pass the filtered collection object
    runCollectionSequence(collectionCopy);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">API Collection Test Runner</h2>

      <div className="bg-white rounded-md shadow-sm p-4 mb-4">
        <h3 className="text-lg font-medium mb-4">Test Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection
            </label>
            <select
              value={selectedCollection || ''}
              onChange={handleCollectionChange}
              disabled={isRunning}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a collection</option>
              {collections.map(collection => (
                <option key={collection.info._postman_id} value={collection.info._postman_id}>
                  {collection.info.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request
            </label>
            <select
              value={selectedRequest || ''}
              onChange={handleRequestChange}
              disabled={!selectedCollection || isRunning}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a request</option>
              {requests.map(request => (
                <option key={request.id} value={request.id}>
                  {request.path}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleRunSequence}
            disabled={!selectedCollection || isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            title="Run all requests in the collection in sequence, stopping if any request fails"
          >
            {isRunning ? 'Running Sequence...' : 'Run Collection Sequence'}
          </button>

          <button
            onClick={handleRunTests}
            disabled={!selectedRequest || isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run Single Request'}
          </button>
        </div>
      </div>

      <GlobalAuthSettings />

      <ParameterForm />

      {selectedCollection && requests.length > 0 && (
        <RequestList
          requests={requests}
          requestsEnabled={requestsEnabled}
          onToggleEnabled={toggleRequestEnabled}
        />
      )}

      <TestResults />
    </div>
  );
};

export default TestPage;

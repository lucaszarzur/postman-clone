import React from 'react';

const RequestList = ({ requests, requestsEnabled, onToggleEnabled }) => {
  // Agrupar requisições por pasta e subpasta
  const groupRequestsByPath = () => {
    const groups = {};

    requests.forEach(request => {
      const parts = request.path.split(' / ');

      // Se o caminho tiver mais de 2 partes, temos uma estrutura de subpastas
      if (parts.length > 2) {
        // A pasta principal é a primeira parte
        const mainFolder = parts[0];
        // A subpasta é a segunda parte
        const subFolder = parts[1];
        // O caminho completo da subpasta (para usar como chave)
        const fullSubFolderPath = `${mainFolder} / ${subFolder}`;

        // Inicializar a pasta principal se não existir
        if (!groups[mainFolder]) {
          groups[mainFolder] = {
            isFolder: true,
            subFolders: {},
            requests: []
          };
        }

        // Inicializar a subpasta se não existir
        if (!groups[mainFolder].subFolders[fullSubFolderPath]) {
          groups[mainFolder].subFolders[fullSubFolderPath] = {
            name: subFolder,
            requests: []
          };
        }

        // Adicionar o request à subpasta
        groups[mainFolder].subFolders[fullSubFolderPath].requests.push(request);
      }
      // Se o caminho tiver exatamente 2 partes, é um request em uma pasta principal
      else if (parts.length === 2) {
        const mainFolder = parts[0];

        // Inicializar a pasta principal se não existir
        if (!groups[mainFolder]) {
          groups[mainFolder] = {
            isFolder: true,
            subFolders: {},
            requests: []
          };
        }

        // Adicionar o request diretamente à pasta principal
        groups[mainFolder].requests.push(request);
      }
      // Se o caminho tiver apenas 1 parte, é um request na raiz
      else {
        const folder = 'Root';

        // Inicializar a pasta raiz se não existir
        if (!groups[folder]) {
          groups[folder] = {
            isFolder: true,
            subFolders: {},
            requests: []
          };
        }

        // Adicionar o request à pasta raiz
        groups[folder].requests.push(request);
      }
    });

    return groups;
  };

  // Função para obter todos os requests de uma pasta (incluindo subpastas)
  const getAllRequestsInFolder = (folderData) => {
    let allRequests = [...folderData.requests];

    // Adicionar requests de todas as subpastas
    Object.values(folderData.subFolders).forEach(subFolder => {
      allRequests = [...allRequests, ...subFolder.requests];
    });

    return allRequests;
  };

  // Check if all requests in a folder are selected (including subfolders)
  const areAllFolderRequestsSelected = (folderData) => {
    const allRequests = getAllRequestsInFolder(folderData);
    return allRequests.length > 0 && allRequests.every(request => requestsEnabled[request.id] !== false);
  };

  // Check if some (but not all) requests in a folder are selected (including subfolders)
  const areSomeFolderRequestsSelected = (folderData) => {
    const allRequests = getAllRequestsInFolder(folderData);
    if (allRequests.length === 0) return false;

    const selectedCount = allRequests.filter(request => requestsEnabled[request.id] !== false).length;
    return selectedCount > 0 && selectedCount < allRequests.length;
  };

  // Handle toggling all requests in a folder (including subfolders)
  const handleToggleFolderRequests = (folderData) => {
    // If all are selected, deselect all. Otherwise, select all.
    const shouldSelect = !areAllFolderRequestsSelected(folderData);

    // Get all requests in this folder and its subfolders
    const allRequests = getAllRequestsInFolder(folderData);

    // Log para depuração
    console.log('Toggling folder requests:', {
      folderRequests: allRequests.map(r => ({ id: r.id, name: r.name })),
      shouldSelect,
      currentState: allRequests.map(r => ({ id: r.id, enabled: requestsEnabled[r.id] !== false }))
    });

    // Toggle each request in the folder and subfolders
    allRequests.forEach(request => {
      // Verificar se o estado atual é diferente do desejado
      const currentlySelected = requestsEnabled[request.id] !== false;
      if (currentlySelected !== shouldSelect) {
        console.log(`Toggling request "${request.name}" (${request.id}) from ${currentlySelected} to ${shouldSelect}`);
        onToggleEnabled(request.id);
      }
    });
  };

  // Check if all requests in a subfolder are selected
  const areAllSubFolderRequestsSelected = (requests) => {
    return requests.length > 0 && requests.every(request => requestsEnabled[request.id] !== false);
  };

  // Check if some (but not all) requests in a subfolder are selected
  const areSomeSubFolderRequestsSelected = (requests) => {
    if (requests.length === 0) return false;

    const selectedCount = requests.filter(request => requestsEnabled[request.id] !== false).length;
    return selectedCount > 0 && selectedCount < requests.length;
  };

  // Handle toggling all requests in a subfolder
  const handleToggleSubFolderRequests = (requests) => {
    // If all are selected, deselect all. Otherwise, select all.
    const shouldSelect = !areAllSubFolderRequestsSelected(requests);

    // Log para depuração
    console.log('Toggling subfolder requests:', {
      folderRequests: requests.map(r => ({ id: r.id, name: r.name })),
      shouldSelect,
      currentState: requests.map(r => ({ id: r.id, enabled: requestsEnabled[r.id] !== false }))
    });

    // Toggle each request in the subfolder
    requests.forEach(request => {
      // Verificar se o estado atual é diferente do desejado
      const currentlySelected = requestsEnabled[request.id] !== false;
      if (currentlySelected !== shouldSelect) {
        console.log(`Toggling request "${request.name}" (${request.id}) from ${currentlySelected} to ${shouldSelect}`);
        onToggleEnabled(request.id);
      }
    });
  };

  const requestGroups = groupRequestsByPath();

  // Handle selecting or deselecting all requests
  const handleToggleAllRequests = (shouldSelect) => {
    // Get all request IDs
    const allRequestIds = requests.map(request => request.id);

    // Log para depuração
    console.log('Toggling all requests:', {
      requestCount: allRequestIds.length,
      shouldSelect,
      requestIds: allRequestIds
    });

    // Toggle each request
    requests.forEach(request => {
      // Verificar se o estado atual é diferente do desejado
      const currentlySelected = requestsEnabled[request.id] !== false;
      if (currentlySelected !== shouldSelect) {
        console.log(`Toggling request "${request.name}" (${request.id}) from ${currentlySelected} to ${shouldSelect}`);
        onToggleEnabled(request.id);
      }
    });
  };

  // Função para contar o total de requests selecionados
  const countTotalSelectedRequests = () => {
    return requests.filter(request => requestsEnabled[request.id] !== false).length;
  };

  // Count total selected requests
  const totalSelectedRequests = requests.filter(request => requestsEnabled[request.id] !== false).length;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Requests in Sequence</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleToggleAllRequests(true)}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Select All
          </button>
          <button
            onClick={() => handleToggleAllRequests(false)}
            className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            Deselect All
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-2">
        Select which requests to include in the sequence execution ({totalSelectedRequests} of {requests.length} selected)
      </p>

      <div className="border rounded-md overflow-hidden">
        {Object.entries(requestGroups).map(([folderName, folderData]) => (
          <div key={folderName} className="border-b last:border-b-0">
            {/* Cabeçalho da pasta principal */}
            <div className="bg-gray-50 px-4 py-2 font-medium flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`folder-checkbox-${folderName}`}
                  checked={areAllFolderRequestsSelected(folderData)}
                  ref={input => {
                    if (input) {
                      input.indeterminate = areSomeFolderRequestsSelected(folderData) && !areAllFolderRequestsSelected(folderData);
                    }
                  }}
                  onChange={() => handleToggleFolderRequests(folderData)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                />
                <label htmlFor={`folder-checkbox-${folderName}`} className="cursor-pointer">
                  {folderName}
                </label>
              </div>
              <span className="text-xs text-gray-500">
                {getAllRequestsInFolder(folderData).filter(request => requestsEnabled[request.id] !== false).length} / {getAllRequestsInFolder(folderData).length} selected
              </span>
            </div>

            {/* Requests diretamente na pasta principal */}
            {folderData.requests.length > 0 && (
              <div className="divide-y">
                {folderData.requests.map(request => (
                  <div
                    key={request.id}
                    className={`px-4 py-2 flex items-center ${!requestsEnabled[request.id] ? 'bg-gray-50 text-gray-500' : ''}`}
                  >
                    <input
                      type="checkbox"
                      id={`checkbox-${request.id}`}
                      checked={requestsEnabled[request.id] !== false}
                      onChange={() => onToggleEnabled(request.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />

                    <div className="flex-1">
                      <label
                        htmlFor={`checkbox-${request.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        <span className={`text-xs font-bold mr-2 px-1.5 py-0.5 rounded ${getMethodBgColor(request.request?.method || 'GET')}`}>
                          {(request.request?.method || 'GET').toUpperCase()}
                        </span>

                        <span className="flex-1 truncate">
                          {request.name}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subpastas */}
            {Object.entries(folderData.subFolders).map(([subFolderPath, subFolderData]) => (
              <div key={subFolderPath} className="border-t">
                {/* Cabeçalho da subpasta */}
                <div className="bg-gray-100 px-4 py-2 font-medium flex items-center justify-between pl-8">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`subfolder-checkbox-${subFolderPath}`}
                      checked={areAllSubFolderRequestsSelected(subFolderData.requests)}
                      ref={input => {
                        if (input) {
                          input.indeterminate = areSomeSubFolderRequestsSelected(subFolderData.requests) && !areAllSubFolderRequestsSelected(subFolderData.requests);
                        }
                      }}
                      onChange={() => handleToggleSubFolderRequests(subFolderData.requests)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <label htmlFor={`subfolder-checkbox-${subFolderPath}`} className="cursor-pointer">
                      {subFolderData.name}
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">
                    {subFolderData.requests.filter(request => requestsEnabled[request.id] !== false).length} / {subFolderData.requests.length} selected
                  </span>
                </div>

                {/* Requests na subpasta */}
                <div className="divide-y">
                  {subFolderData.requests.map(request => (
                    <div
                      key={request.id}
                      className={`px-4 py-2 flex items-center pl-12 ${!requestsEnabled[request.id] ? 'bg-gray-50 text-gray-500' : ''}`}
                    >
                      <input
                        type="checkbox"
                        id={`checkbox-${request.id}`}
                        checked={requestsEnabled[request.id] !== false}
                        onChange={() => onToggleEnabled(request.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />

                      <div className="flex-1">
                        <label
                          htmlFor={`checkbox-${request.id}`}
                          className="flex items-center cursor-pointer"
                        >
                          <span className={`text-xs font-bold mr-2 px-1.5 py-0.5 rounded ${getMethodBgColor(request.request?.method || 'GET')}`}>
                            {(request.request?.method || 'GET').toUpperCase()}
                          </span>

                          <span className="flex-1 truncate">
                            {request.name}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get color based on HTTP method
const getMethodBgColor = (method) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-100 text-green-800';
    case 'POST':
      return 'bg-blue-100 text-blue-800';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    case 'PATCH':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default RequestList;

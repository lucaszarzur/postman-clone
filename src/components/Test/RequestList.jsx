import React from 'react';

const RequestList = ({ requests, requestsEnabled, onToggleEnabled }) => {
  // Agrupar requisições por pasta
  const groupRequestsByPath = () => {
    const groups = {};

    requests.forEach(request => {
      const parts = request.path.split(' / ');
      const folder = parts.length > 1 ? parts[0] : 'Root';

      if (!groups[folder]) {
        groups[folder] = [];
      }

      groups[folder].push(request);
    });

    return groups;
  };

  const requestGroups = groupRequestsByPath();

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">Requests in Sequence</h3>
      <p className="text-sm text-gray-500 mb-2">
        Select which requests to include in the sequence execution
      </p>

      <div className="border rounded-md overflow-hidden">
        {Object.entries(requestGroups).map(([folder, folderRequests]) => (
          <div key={folder} className="border-b last:border-b-0">
            <div className="bg-gray-50 px-4 py-2 font-medium">
              {folder}
            </div>

            <div className="divide-y">
              {folderRequests.map(request => (
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

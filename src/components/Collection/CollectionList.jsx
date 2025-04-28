import { useState, useEffect } from 'react';
import { useCollection } from '../../hooks/useCollection';

const CollectionList = () => {
  const { collections, selectCollection, removeCollection, activeCollection, activeRequest, selectRequest } = useCollection();
  const [expandedCollections, setExpandedCollections] = useState({});

  const toggleCollectionExpand = (collectionId) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionId]: !prev[collectionId]
    }));
  };

  const handleSelectCollection = (collectionId) => {
    selectCollection(collectionId);
    // Auto-expand the selected collection
    setExpandedCollections(prev => ({
      ...prev,
      [collectionId]: true
    }));
  };

  const handleRemoveCollection = (e, collectionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this collection?')) {
      removeCollection(collectionId);
    }
  };

  // Add effect to auto-expand folders when a request is selected
  useEffect(() => {
    if (activeRequest && activeCollection) {
      // Find the path to the active request and expand all folders in that path
      const findPathToRequest = (items, currentPath = []) => {
        for (const item of items) {
          // Check if this is the active request by id or name
          const isActiveRequest =
            (activeRequest.id && item.id === activeRequest.id) ||
            (activeRequest.name && item.name === activeRequest.name);

          if (isActiveRequest) {
            // Found the request, return the path to it
            return currentPath;
          }

          if (item.item) {
            const itemId = item.id || item.name;
            const path = findPathToRequest(item.item, [...currentPath, itemId]);
            if (path.length > 0) return path;
          }
        }
        return [];
      };

      // Find the path to the active request
      const pathToRequest = findPathToRequest(activeCollection.item);

      // Only update if we found a path and it's different from current expanded state
      if (pathToRequest.length > 0) {
        setExpandedCollections(prev => {
          const newExpanded = { ...prev };
          let needsUpdate = false;

          // Check if we need to update
          pathToRequest.forEach(id => {
            if (!prev[id]) {
              needsUpdate = true;
              newExpanded[id] = true;
            }
          });

          return needsUpdate ? newExpanded : prev;
        });
      }
    }
  }, [activeRequest, activeCollection]);

  // Ensure request has a valid structure
  const ensureValidRequest = (request) => {
    // Create a deep copy to avoid modifying the original
    const validRequest = { ...request };

    // Ensure request has a request object
    if (!validRequest.request) {
      validRequest.request = {
        method: 'GET',
        url: '',
        header: []
      };
    }

    // Ensure method exists
    if (!validRequest.request.method) {
      validRequest.request.method = 'GET';
    }

    // Ensure URL exists
    if (!validRequest.request.url) {
      validRequest.request.url = '';
    }

    // Ensure headers exist
    if (!validRequest.request.header) {
      validRequest.request.header = [];
    }

    return validRequest;
  };

  // Handle request selection
  const handleSelectRequest = (request) => {
    console.log('Request clicked:', request);

    // Ensure the request has a valid structure
    const validRequest = ensureValidRequest(request);

    // Generate a unique identifier for the request if it doesn't have an ID
    const requestId = request.id || `${request.name}-${Date.now()}`;
    console.log('Using request ID:', requestId);

    selectRequest(requestId, validRequest);
  };

  // Recursive function to render collection items
  const renderItems = (items, path = []) => {
    return (
      <ul className="pl-4 mt-1 space-y-1">
        {items.map(item => {
          const isFolder = !!item.item;
          const itemPath = [...path, item.name];
          const isActive = activeRequest && (
            (item.id && item.id === activeRequest.id) ||
            (item.name && item.name === activeRequest.name)
          );

          return (
            <li key={item.id || item.name} className="text-sm">
              {isFolder ? (
                <div>
                  <div
                    className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => toggleCollectionExpand(item.id || item.name)}
                  >
                    <span className="mr-1">
                      {expandedCollections[item.id || item.name] ? '▼' : '►'}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>

                  {expandedCollections[item.id || item.name] && renderItems(item.item, itemPath)}
                </div>
              ) : (
                <div
                  className={`py-1 px-2 pl-6 hover:bg-gray-100 rounded cursor-pointer flex items-center
                            ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}
                  onClick={() => handleSelectRequest(item)}
                >
                  <span className={`text-xs font-bold mr-2 px-1.5 py-0.5 rounded ${getMethodBgColor(item.request?.method || 'GET')}`}>
                    {(item.request?.method || 'GET').toUpperCase()}
                  </span>
                  {item.name}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Helper function to get color based on HTTP method
  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'text-green-600';
      case 'POST':
        return 'text-blue-600';
      case 'PUT':
        return 'text-orange-600';
      case 'DELETE':
        return 'text-red-600';
      case 'PATCH':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper function to get background color based on HTTP method
  const getMethodBgColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-orange-100 text-orange-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (collections.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No collections imported yet.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
      <ul className="space-y-2">
        {collections.map(collection => (
          <li key={collection.info._postman_id} className="bg-white rounded-lg shadow">
            <div
              className={`flex items-center justify-between p-3 cursor-pointer
                        ${activeCollection && activeCollection.info._postman_id === collection.info._postman_id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'}`}
              onClick={() => handleSelectCollection(collection.info._postman_id)}
            >
              <div className="flex items-center">
                <span className="mr-2">
                  {expandedCollections[collection.info._postman_id] ? '▼' : '►'}
                </span>
                <span className="font-medium">{collection.info.name}</span>
              </div>

              <button
                onClick={(e) => handleRemoveCollection(e, collection.info._postman_id)}
                className="text-gray-400 hover:text-red-500"
                title="Remove collection"
              >
                ✕
              </button>
            </div>

            {expandedCollections[collection.info._postman_id] && (
              <div className="p-2 border-t border-gray-100">
                {renderItems(collection.item, [collection.info.name])}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectionList;

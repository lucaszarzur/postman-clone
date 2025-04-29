import { useState, useEffect } from 'react';
import { useCollection } from '../../hooks/useCollection';

const RequestEditModal = ({ isOpen, onClose, request, collectionId, onSave }) => {
  const [editedRequest, setEditedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (request) {
      // Create a deep copy of the request to avoid modifying the original
      setEditedRequest(JSON.parse(JSON.stringify(request)));
    }
  }, [request]);

  if (!isOpen || !editedRequest) return null;

  const handleSave = () => {
    onSave(editedRequest);
    onClose();
  };

  const handleMethodChange = (e) => {
    setEditedRequest({
      ...editedRequest,
      request: {
        ...editedRequest.request,
        method: e.target.value
      }
    });
  };

  const handleNameChange = (e) => {
    setEditedRequest({
      ...editedRequest,
      name: e.target.value
    });
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;

    // Handle different URL formats in Postman requests
    if (typeof editedRequest.request.url === 'string') {
      setEditedRequest({
        ...editedRequest,
        request: {
          ...editedRequest.request,
          url: newUrl
        }
      });
    } else if (editedRequest.request.url && editedRequest.request.url.raw) {
      // Handle Postman URL object format
      setEditedRequest({
        ...editedRequest,
        request: {
          ...editedRequest.request,
          url: {
            ...editedRequest.request.url,
            raw: newUrl
          }
        }
      });
    }
  };

  const getUrlValue = () => {
    if (typeof editedRequest.request.url === 'string') {
      return editedRequest.request.url;
    } else if (editedRequest.request.url && editedRequest.request.url.raw) {
      return editedRequest.request.url.raw;
    }
    return '';
  };

  const handleBodyChange = (e) => {
    if (!editedRequest.request.body) {
      // Initialize body if it doesn't exist
      setEditedRequest({
        ...editedRequest,
        request: {
          ...editedRequest.request,
          body: {
            mode: 'raw',
            raw: e.target.value
          }
        }
      });
    } else if (editedRequest.request.body.mode === 'raw') {
      setEditedRequest({
        ...editedRequest,
        request: {
          ...editedRequest.request,
          body: {
            ...editedRequest.request.body,
            raw: e.target.value
          }
        }
      });
    }
  };

  const getBodyValue = () => {
    if (!editedRequest.request.body) return '';
    if (editedRequest.request.body.mode === 'raw') {
      return editedRequest.request.body.raw || '';
    }
    return JSON.stringify(editedRequest.request.body, null, 2);
  };

  // Add a new header
  const addHeader = () => {
    if (!editedRequest.request.header) {
      editedRequest.request.header = [];
    }

    setEditedRequest({
      ...editedRequest,
      request: {
        ...editedRequest.request,
        header: [
          ...editedRequest.request.header,
          { key: '', value: '', disabled: false }
        ]
      }
    });
  };

  // Update a header
  const updateHeader = (index, field, value) => {
    const newHeaders = [...editedRequest.request.header];
    newHeaders[index] = {
      ...newHeaders[index],
      [field]: value
    };

    setEditedRequest({
      ...editedRequest,
      request: {
        ...editedRequest.request,
        header: newHeaders
      }
    });
  };

  // Remove a header
  const removeHeader = (index) => {
    const newHeaders = [...editedRequest.request.header];
    newHeaders.splice(index, 1);

    setEditedRequest({
      ...editedRequest,
      request: {
        ...editedRequest.request,
        header: newHeaders
      }
    });
  };

  // Toggle header disabled state
  const toggleHeaderDisabled = (index) => {
    const newHeaders = [...editedRequest.request.header];
    newHeaders[index] = {
      ...newHeaders[index],
      disabled: !newHeaders[index].disabled
    };

    setEditedRequest({
      ...editedRequest,
      request: {
        ...editedRequest.request,
        header: newHeaders
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Request</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'headers' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'body' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editedRequest.name || ''}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    value={editedRequest.request.method || 'GET'}
                    onChange={handleMethodChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={getUrlValue()}
                    onChange={handleUrlChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Headers</h3>
                <button
                  onClick={addHeader}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add Header
                </button>
              </div>

              {editedRequest.request.header && editedRequest.request.header.length > 0 ? (
                <div className="border rounded overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Enabled</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editedRequest.request.header.map((header, index) => (
                        <tr key={index} className={header.disabled ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={header.key || ''}
                              onChange={(e) => updateHeader(index, 'key', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={header.value || ''}
                              onChange={(e) => updateHeader(index, 'value', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={!header.disabled}
                              onChange={() => toggleHeaderDisabled(index)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeHeader(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove header"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 border rounded">
                  No headers defined. Click "Add Header" to add one.
                </div>
              )}
            </div>
          )}

          {activeTab === 'body' && (
            <div>
              <h3 className="text-lg font-medium mb-2">Request Body</h3>

              {/* Content-Type selector */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content-Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    // Encontrar o header Content-Type existente
                    const headers = editedRequest.request.header || [];
                    const contentTypeIndex = headers.findIndex(h =>
                      h.key.toLowerCase() === 'content-type'
                    );

                    // Criar uma cópia dos headers
                    const newHeaders = [...headers];

                    if (contentTypeIndex >= 0) {
                      // Atualizar o header existente
                      newHeaders[contentTypeIndex] = {
                        ...newHeaders[contentTypeIndex],
                        value: e.target.value,
                        disabled: false
                      };
                    } else {
                      // Adicionar um novo header
                      newHeaders.push({
                        key: 'Content-Type',
                        value: e.target.value,
                        disabled: false
                      });
                    }

                    // Atualizar o request
                    setEditedRequest({
                      ...editedRequest,
                      request: {
                        ...editedRequest.request,
                        header: newHeaders
                      }
                    });
                  }}
                  value={(() => {
                    // Encontrar o valor atual do Content-Type
                    const headers = editedRequest.request.header || [];
                    const contentTypeHeader = headers.find(h =>
                      h.key.toLowerCase() === 'content-type' && !h.disabled
                    );
                    return contentTypeHeader ? contentTypeHeader.value : '';
                  })()}
                >
                  <option value="">Auto-detect</option>
                  <option value="application/json">application/json</option>
                  <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                  <option value="text/plain">text/plain</option>
                  <option value="application/xml">application/xml</option>
                  <option value="text/html">text/html</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a Content-Type or leave empty for auto-detection
                </p>
              </div>

              <div className="border rounded">
                <textarea
                  value={getBodyValue()}
                  onChange={handleBodyChange}
                  className="w-full px-3 py-2 font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={15}
                  placeholder="Enter request body here..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Currently only raw body editing is supported. For form-data or urlencoded, please use the raw JSON format.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestEditModal;

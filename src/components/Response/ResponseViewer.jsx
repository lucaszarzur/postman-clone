import { useState, useEffect } from 'react';
import { useRequest } from '../../hooks/useRequest';
import { useResponsePopup } from '../../contexts/ResponsePopupContext';
import { formatTestResults } from '../../utils/testRunner';
import Spinner from '../common/Spinner';

const ResponseViewer = () => {
  const { response, error, loading } = useRequest();
  const { isOpen, responseData, closePopup } = useResponsePopup();
  const [activeTab, setActiveTab] = useState('body');

  // Use the popup data if available, otherwise use the response from useRequest
  const displayData = isOpen && responseData ? responseData : response;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <Spinner size="lg" color="blue" />
        <div className="text-blue-600 font-medium mt-4">Sending request...</div>
      </div>
    );
  }

  if (!displayData && !error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        Send a request to see the response
      </div>
    );
  }

  if (error || (displayData && displayData.error)) {
    const errorMessage = error || (displayData && displayData.error);
    return (
      <div className="p-4 bg-red-50 text-red-700 h-full overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p className="mb-4">{errorMessage}</p>

        {displayData && (
          <div className="mt-4 p-4 bg-white rounded shadow-sm">
            <h4 className="text-md font-semibold mb-2 text-gray-700">Response Details</h4>
            {displayData.status && (
              <div className="mb-2">
                <span className="font-medium">Status:</span> {displayData.status} {displayData.statusText}
              </div>
            )}
            {displayData.config && (
              <div className="mb-2">
                <span className="font-medium">Request URL:</span> {displayData.config.url}
              </div>
            )}
            {displayData.config && (
              <div className="mb-2">
                <span className="font-medium">Request Method:</span> {displayData.config.method?.toUpperCase()}
              </div>
            )}
            <div className="mt-4">
              <details className="cursor-pointer">
                <summary className="font-medium text-blue-600">View Response Data</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(displayData, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-white rounded shadow-sm">
          <h4 className="text-md font-semibold mb-2 text-gray-700">Troubleshooting</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Check if the API endpoint is correct</li>
            <li>Verify that you have the proper authentication</li>
            <li>Ensure the server is accessible from your network</li>
            <li>Try using a different CORS proxy (edit corsProxy.js)</li>
            <li>Check the browser console for more detailed error messages</li>
          </ul>
        </div>
      </div>
    );
  }

  // Format response body for display
  const formatResponseBody = () => {
    if (!displayData) return 'No response received';
    if (displayData.data === undefined && displayData.data !== '') return 'No response data received';

    try {
      // Try to parse as JSON if it's a string
      if (typeof displayData.data === 'string') {
        try {
          const jsonData = JSON.parse(displayData.data);
          return JSON.stringify(jsonData, null, 2);
        } catch (e) {
          // Not valid JSON, return as is
          return displayData.data;
        }
      }

      // If it's already an object, stringify it with proper indentation
      const formattedJson = JSON.stringify(displayData.data, null, 2);

      // Log the size of the response for debugging
      console.log(`Response size: ${formattedJson.length} characters`);

      return formattedJson;
    } catch (e) {
      console.error('Error formatting response body:', e);
      return `Error formatting response: ${e.message}`;
    }
  };

  // Log response for debugging
  console.log('Current response in viewer:', displayData);

  // Verificar se a resposta tem um formato válido
  const hasValidResponse = displayData &&
    (displayData.status !== undefined || displayData.data !== undefined ||
     (displayData.headers && Object.keys(displayData.headers).length > 0) ||
     displayData.responseTime !== undefined);

  if (!hasValidResponse && displayData) {
    console.warn('Resposta em formato inválido:', displayData);
  }

  // Se não temos uma resposta válida, mostrar uma mensagem
  if (!hasValidResponse && displayData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <div className="text-yellow-600 font-medium mb-4">Resposta recebida, mas em formato inválido</div>
        <pre className="bg-gray-100 p-4 rounded w-full overflow-auto text-xs">
          {JSON.stringify(displayData, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ maxHeight: '100%' }}>
      {/* Status and time - Fixed height header */}
      <div className="flex items-center justify-between p-1 border-b border-gray-200 bg-gray-50" style={{ flexShrink: 0 }}>
        <div className="flex items-center">
          <div
            className={`px-2 py-0.5 rounded-md font-medium text-white text-xs mr-2
                      ${displayData.status >= 200 && displayData.status < 300
                        ? 'bg-green-500'
                        : displayData.status >= 400
                          ? 'bg-red-500'
                          : 'bg-yellow-500'}`}
          >
            {displayData.status || 0}
          </div>

          <div className="text-gray-600 text-xs">
            {displayData.statusText || ''}
          </div>
        </div>

        <div className="flex items-center">
          <div className="text-gray-600 text-xs mr-2">
            {displayData.responseTime ? `${displayData.responseTime}ms` : ''}
          </div>

          {isOpen && (
            <button
              onClick={closePopup}
              className="text-gray-500 hover:text-gray-700 text-xs font-medium"
              title="Close popup view"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Tabs - Fixed height tabs */}
      <div className="flex border-b border-gray-200" style={{ flexShrink: 0 }}>
        <button
          onClick={() => setActiveTab('body')}
          className={`px-2 py-0.5 font-medium text-xs
                    ${activeTab === 'body'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Body
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`px-2 py-0.5 font-medium text-xs
                    ${activeTab === 'headers'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Headers
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-2 py-0.5 font-medium text-xs
                    ${activeTab === 'tests'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Tests
          {displayData.testResults && (
            <span className="ml-1 px-1 py-0.5 rounded-full text-xs font-medium bg-gray-100">
              {displayData.testResults.passed}/{displayData.testResults.passed + displayData.testResults.failed}
            </span>
          )}
        </button>
      </div>

      {/* Tab content - Scrollable content area */}
      <div style={{
        overflow: 'auto',
        height: 'calc(100% - 50px)', /* Subtract the height of headers and tabs */
        display: 'block',
        padding: '4px'
      }}>
        {activeTab === 'body' && (
          <pre className={`whitespace-pre-wrap font-mono text-xs m-0 ${
            typeof displayData.data === 'object' &&
            JSON.stringify(displayData.data).length > 10000 ?
            'text-xs leading-tight' : ''
          }`}>
            {formatResponseBody()}
          </pre>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-1">
            {displayData.headers && Object.keys(displayData.headers).length > 0 ? (
              Object.entries(displayData.headers).map(([key, value]) => (
                <div key={key} className="flex">
                  <div className="w-1/3 font-medium text-gray-700 text-xs">{key}:</div>
                  <div className="w-2/3 text-gray-900 text-xs">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-xs">No headers received</div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            {displayData.testResults ? (
              <div className="text-xs" dangerouslySetInnerHTML={{ __html: formatTestResults(displayData.testResults) }} />
            ) : (
              <div className="text-gray-500 text-xs">No tests were run with this request</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;

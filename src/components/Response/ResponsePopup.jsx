import { useState } from 'react';
import { useResponsePopup } from '../../contexts/ResponsePopupContext';
import { formatTestResults } from '../../utils/testRunner';

const ResponsePopup = () => {
  const { isOpen, responseData, closePopup } = useResponsePopup();
  const [activeTab, setActiveTab] = useState('body');

  if (!isOpen || !responseData) {
    return null;
  }

  // Format response body for display
  const formatResponseBody = () => {
    if (!responseData) return 'No response received';
    if (responseData.data === undefined && responseData.data !== '') return 'No response data received';

    try {
      // Try to parse as JSON if it's a string
      if (typeof responseData.data === 'string') {
        try {
          const jsonData = JSON.parse(responseData.data);
          return JSON.stringify(jsonData, null, 2);
        } catch (e) {
          // Not valid JSON, return as is
          return responseData.data;
        }
      }

      // If it's already an object, stringify it
      return JSON.stringify(responseData.data, null, 2);
    } catch (e) {
      console.error('Error formatting response body:', e);
      return `Error formatting response: ${e.message}`;
    }
  };

  // Check if we have a valid response
  const hasValidResponse = responseData && 
    (responseData.status !== undefined || 
     responseData.data !== undefined || 
     (responseData.headers && Object.keys(responseData.headers).length > 0));

  // If we have an error, show error view
  if (responseData.error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 max-w-4xl max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Error Response</h2>
            <button 
              onClick={closePopup}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="mb-4">{responseData.error}</p>
          </div>

          {responseData && (
            <div className="mt-4 p-4 bg-white rounded shadow-sm border border-gray-200">
              <h4 className="text-md font-semibold mb-2 text-gray-700">Response Details</h4>
              {responseData.status && (
                <div className="mb-2">
                  <span className="font-medium">Status:</span> {responseData.status} {responseData.statusText}
                </div>
              )}
              {responseData.config && (
                <div className="mb-2">
                  <span className="font-medium">Request URL:</span> {responseData.config.url}
                </div>
              )}
              {responseData.config && (
                <div className="mb-2">
                  <span className="font-medium">Request Method:</span> {responseData.config.method?.toUpperCase()}
                </div>
              )}
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="font-medium text-blue-600">View Response Data</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={closePopup}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we don't have a valid response, show a message
  if (!hasValidResponse && responseData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 max-w-4xl max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-yellow-600">Invalid Response</h2>
            <button 
              onClick={closePopup}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="text-yellow-600 font-medium mb-4">
            Response received, but in invalid format
          </div>
          
          <pre className="bg-gray-100 p-4 rounded w-full overflow-auto text-xs">
            {JSON.stringify(responseData, null, 2)}
          </pre>

          <div className="flex justify-end mt-4">
            <button
              onClick={closePopup}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal response view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">API Response</h2>
          <button 
            onClick={closePopup}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Status and time */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t">
          <div className="flex items-center">
            <div
              className={`px-3 py-1 rounded-md font-medium text-white text-sm mr-4
                        ${responseData.status >= 200 && responseData.status < 300
                          ? 'bg-green-500'
                          : responseData.status >= 400
                            ? 'bg-red-500'
                            : 'bg-yellow-500'}`}
            >
              {responseData.status || 0}
            </div>

            <div className="text-gray-600">
              {responseData.statusText || ''}
            </div>
          </div>

          <div className="text-gray-600 text-sm">
            {responseData.responseTime ? `${responseData.responseTime}ms` : ''}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('body')}
            className={`px-4 py-2 font-medium text-sm
                      ${activeTab === 'body'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'}`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-4 py-2 font-medium text-sm
                      ${activeTab === 'headers'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'}`}
          >
            Headers
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 font-medium text-sm
                      ${activeTab === 'tests'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'}`}
          >
            Tests
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-grow overflow-auto p-4">
          {activeTab === 'body' && (
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {formatResponseBody()}
            </pre>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-2">
              {responseData.headers && Object.keys(responseData.headers).length > 0 ? (
                Object.entries(responseData.headers).map(([key, value]) => (
                  <div key={key} className="flex">
                    <div className="w-1/3 font-medium text-gray-700">{key}:</div>
                    <div className="w-2/3 text-gray-900">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No headers received</div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div>
              {responseData.testResults ? (
                <div dangerouslySetInnerHTML={{ __html: formatTestResults(responseData.testResults) }} />
              ) : (
                <div className="text-gray-500">No tests were run with this request</div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-2 border-t border-gray-200">
          <button
            onClick={closePopup}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsePopup;

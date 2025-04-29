import React, { useState } from 'react';
import { useTest } from '../../hooks/useTest';
import { formatTestResults } from '../../utils/testRunner';
import { FaPause, FaPlay } from 'react-icons/fa';

const TestResults = () => {
  const {
    testResults,
    requestSequence,
    exportResults,
    isRunning,
    isPaused,
    progress,
    pauseTests,
    resumeTests
  } = useTest();
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('results');

  // Função para formatar o corpo da requisição ou resposta
  const formatBody = (body, isResponse = false, actualRequestData = null) => {
    if (!body && !actualRequestData) return null;

    try {
      // Se for uma resposta, o formato é diferente
      if (isResponse) {
        // Tentar formatar como JSON se for possível
        try {
          if (typeof body === 'object') {
            return (
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(body, null, 2)}
              </pre>
            );
          } else if (typeof body === 'string') {
            // Verificar se é JSON
            if ((body.trim().startsWith('{') && body.trim().endsWith('}')) ||
                (body.trim().startsWith('[') && body.trim().endsWith(']'))) {
              try {
                const jsonObj = JSON.parse(body);
                return (
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(jsonObj, null, 2)}
                  </pre>
                );
              } catch (e) {
                // Se não for JSON válido, mostrar como texto
                console.log('Não foi possível formatar resposta como JSON:', e);
              }
            }

            // Mostrar como texto normal
            return (
              <pre className="whitespace-pre-wrap break-words">
                {body}
              </pre>
            );
          }
        } catch (e) {
          console.log('Erro ao formatar resposta:', e);
        }

        // Fallback para qualquer tipo de dados
        return (
          <pre className="whitespace-pre-wrap break-words">
            {typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body)}
          </pre>
        );
      }

      // Se temos os dados reais da requisição enviada, usar eles em vez do template
      if (actualRequestData) {
        try {
          // Verificar o tipo de dados
          if (typeof actualRequestData === 'string') {
            // Tentar formatar como JSON se for possível
            if ((actualRequestData.trim().startsWith('{') && actualRequestData.trim().endsWith('}')) ||
                (actualRequestData.trim().startsWith('[') && actualRequestData.trim().endsWith(']'))) {
              try {
                const jsonObj = JSON.parse(actualRequestData);
                return (
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(jsonObj, null, 2)}
                  </pre>
                );
              } catch (e) {
                // Se não for JSON válido, mostrar como texto
                console.log('Não foi possível formatar dados reais como JSON:', e);
              }
            }

            // Mostrar como texto normal
            return (
              <pre className="whitespace-pre-wrap break-words">
                {actualRequestData}
              </pre>
            );
          } else if (typeof actualRequestData === 'object') {
            // Objeto já formatado
            return (
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(actualRequestData, null, 2)}
              </pre>
            );
          }
        } catch (e) {
          console.log('Erro ao formatar dados reais da requisição:', e);
        }
      }

      // Processamento para corpo de requisição (template original)
      if (body.mode === 'raw') {
        // Tentar formatar como JSON se for possível
        try {
          // Verificar se o corpo é JSON
          if (body.raw && (
              (body.raw.trim().startsWith('{') && body.raw.trim().endsWith('}')) ||
              (body.raw.trim().startsWith('[') && body.raw.trim().endsWith(']'))
            )) {
            const jsonObj = JSON.parse(body.raw);
            return (
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(jsonObj, null, 2)}
              </pre>
            );
          }
        } catch (e) {
          // Se não for JSON válido, mostrar como texto
          console.log('Não foi possível formatar como JSON:', e);
        }

        // Mostrar como texto normal
        return (
          <pre className="whitespace-pre-wrap break-words">
            {body.raw}
          </pre>
        );
      } else if (body.mode === 'urlencoded' && Array.isArray(body.urlencoded)) {
        return (
          <div>
            <span className="text-xs text-gray-500">URL Encoded Form Data:</span>
            <ul className="list-disc pl-4 mt-1">
              {body.urlencoded.map((param, idx) => (
                <li key={idx}>
                  <span className="font-medium">{param.key}:</span> {param.value}
                  {param.disabled && <span className="text-gray-400 ml-1">(disabled)</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      } else if (body.mode === 'formdata' && Array.isArray(body.formdata)) {
        return (
          <div>
            <span className="text-xs text-gray-500">Form Data:</span>
            <ul className="list-disc pl-4 mt-1">
              {body.formdata.map((param, idx) => (
                <li key={idx}>
                  <span className="font-medium">{param.key}:</span> {param.value}
                  {param.disabled && <span className="text-gray-400 ml-1">(disabled)</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        // Formato desconhecido, mostrar como JSON
        return (
          <div>
            <span className="text-xs text-gray-500">Body format: {body.mode || 'unknown'}</span>
            <pre className="whitespace-pre-wrap break-words mt-1">
              {JSON.stringify(body, null, 2)}
            </pre>
          </div>
        );
      }
    } catch (error) {
      console.error('Erro ao formatar corpo da requisição:', error);
      return (
        <div className="text-red-500">
          Erro ao formatar corpo da requisição: {error.message}
        </div>
      );
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate success rate
  const calculateSuccessRate = () => {
    if (testResults.length === 0) return 0;

    const successfulTests = testResults.filter(result =>
      result.response.status >= 200 && result.response.status < 300
    ).length;

    return Math.round((successfulTests / testResults.length) * 100);
  };

  // Get status color
  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Test Results</h3>
        <div className="space-x-2">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Results
          </button>
          <button
            onClick={() => setActiveTab('sequence')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'sequence'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sequence
          </button>
          <button
            onClick={() => exportResults('csv')}
            disabled={testResults.length === 0 || isRunning}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportResults('json')}
            disabled={testResults.length === 0 || isRunning}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Export JSON
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-600">
              {isPaused ? 'Tests paused...' : 'Running tests...'} {progress}% complete
            </p>
            <div className="flex space-x-2">
              {!isPaused ? (
                <button
                  onClick={pauseTests}
                  className="flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                  title="Pause tests"
                >
                  <FaPause className="mr-1" size={12} /> Pause
                </button>
              ) : (
                <button
                  onClick={resumeTests}
                  className="flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  title="Resume tests"
                >
                  <FaPlay className="mr-1" size={12} /> Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
            <div className="text-sm text-gray-600">Tests Run</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">{calculateSuccessRate()}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-2xl font-bold text-purple-600">{requestSequence.length}</div>
            <div className="text-sm text-gray-600">Requests Made</div>
          </div>
        </div>
      )}

      {activeTab === 'results' ? (
        <>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No test results yet. Configure parameters and run tests to see results here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-medium">Test Results</div>
                <div className="overflow-y-auto max-h-96">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedResult(result)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedResult === result ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">
                            {result.parameters.origin} → {result.parameters.destination}
                          </span>
                          {result.request && (
                            <span className="ml-2 text-xs text-gray-500">
                              {result.request.name ? `(${result.request.name})` : ''}
                              {result.request.index ? ` #${result.request.index}` : ''}
                            </span>
                          )}
                        </div>
                        <div className={getStatusColor(result.response?.status || 0)}>
                          {result.response?.status || 'Error'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(result.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-medium">Details</div>
                {selectedResult ? (
                  <div className="p-4 overflow-y-auto max-h-96">
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Parameters</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Origin:</span> {selectedResult.parameters.origin}
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Destination:</span> {selectedResult.parameters.destination}
                        </div>
                      </div>
                    </div>

                    {selectedResult.request && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Request</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {selectedResult.request.name && (
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="text-gray-500">Name:</span> {selectedResult.request.name}
                            </div>
                          )}
                          {selectedResult.request.path && (
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="text-gray-500">Path:</span> {selectedResult.request.path}
                            </div>
                          )}
                          {selectedResult.request.index && (
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="text-gray-500">Sequence #:</span> {selectedResult.request.index}
                            </div>
                          )}
                          {selectedResult.request.method && (
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="text-gray-500">Method:</span> {selectedResult.request.method}
                            </div>
                          )}
                          {selectedResult.request.url && (
                            <div className="bg-gray-50 p-2 rounded col-span-2">
                              <span className="text-gray-500">URL:</span> {
                                typeof selectedResult.request.url === 'string'
                                  ? selectedResult.request.url
                                  : JSON.stringify(selectedResult.request.url)
                              }
                            </div>
                          )}
                        </div>

                        {/* Request Body */}
                        {(selectedResult.request.body || selectedResult.response?.config?.data) && (
                          <div className="mt-3">
                            <h5 className="font-medium mb-1 text-sm">Request Body:</h5>
                            <div className="bg-gray-50 p-2 rounded text-sm overflow-auto max-h-40">
                              {formatBody(
                                selectedResult.request.body,
                                false,
                                selectedResult.response?.config?.data
                              )}
                            </div>
                            {selectedResult.response?.config?.data && selectedResult.request.body && (
                              <div className="text-xs text-gray-500 mt-1 italic">
                                * Mostrando o corpo da requisição real enviado com as variáveis substituídas
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Response</h4>
                      <div className="text-sm">
                        <div className="bg-gray-50 p-2 rounded mb-2">
                          <span className="text-gray-500">Status:</span>
                          <span className={getStatusColor(selectedResult.response?.status || 0)}>
                            {selectedResult.response?.status || 'Error'} {selectedResult.response?.statusText || ''}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded mb-2">
                          <span className="text-gray-500">URL:</span> {selectedResult.response?.config?.url || 'N/A'}
                        </div>
                        <div className="bg-gray-50 p-2 rounded mb-2">
                          <span className="text-gray-500">Method:</span> {(selectedResult.response?.config?.method || 'get').toUpperCase()}
                        </div>

                        {/* Response Body */}
                        {selectedResult.response?.data && (
                          <div className="mt-3">
                            <h5 className="font-medium mb-1 text-sm">Response Body:</h5>
                            <div className="bg-gray-50 p-2 rounded text-sm overflow-auto max-h-60">
                              {formatBody(selectedResult.response.data, true)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedResult.response?.testResults && (
                      <div>
                        <h4 className="font-medium mb-2">Test Results</h4>
                        <div className="text-sm" dangerouslySetInnerHTML={{
                          __html: formatTestResults(selectedResult.response.testResults)
                        }} />
                      </div>
                    )}

                    {selectedResult.response?.error && (
                      <div>
                        <h4 className="font-medium mb-2 text-red-600">Error</h4>
                        <div className="text-sm bg-red-50 p-2 rounded text-red-700">
                          {selectedResult.response.error}
                        </div>
                        {selectedResult.response.errorDetails && (
                          <div className="text-xs mt-2 text-gray-500">
                            <div>Type: {selectedResult.response.errorDetails.name || 'Unknown'}</div>
                            {selectedResult.response.errorDetails.isNetworkError && (
                              <div className="text-orange-600 font-medium">Network Error</div>
                            )}
                            {selectedResult.response.errorDetails.isCORSError && (
                              <div className="text-orange-600 font-medium">CORS Error</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Select a test result to view details
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {requestSequence.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No request sequence data available yet.
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-medium">Request Sequence</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seq</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameters</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // Group requests by origin/destination pairs
                      const groupedRequests = [];
                      let currentGroup = null;

                      requestSequence.forEach((req, index) => {
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

                      // Render grouped requests with separators
                      return groupedRequests.map((group, groupIndex) => (
                        <React.Fragment key={`group-${groupIndex}`}>
                          {groupIndex > 0 && (
                            <tr className="bg-blue-50 border-t-2 border-b-2 border-blue-200">
                              <td colSpan="7" className="px-6 py-2 text-center text-sm font-medium text-blue-700">
                                <div className="flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                  <span>New Test Sequence: {group.requests[0].parameters.origin} → {group.requests[0].parameters.destination}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          {group.requests.map((req, reqIndex) => (
                            <tr key={`req-${group.startIndex + reqIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(req.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {req.requestIndex || (group.startIndex + reqIndex + 1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {req.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {(req.method || 'GET').toUpperCase()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                {req.url || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`${getStatusColor(req.status || 0)}`}>
                                  {req.status || 'Error'}
                                  {req.error && <span className="ml-1 text-xs text-red-500">(Error)</span>}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {req.parameters.origin} → {req.parameters.destination}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestResults;

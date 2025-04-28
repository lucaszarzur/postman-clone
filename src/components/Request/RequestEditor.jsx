import { useState, useEffect, useCallback } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useRequest } from '../../hooks/useRequest';
import { sendRequest as sendApiRequest, replaceVariables } from '../../utils/requestRunner';
import { useEnvironment } from '../../hooks/useEnvironment';
import { useAuth } from '../Auth/AuthManager';
import { useConsole } from '../../contexts/ConsoleContext';
import { useResponsePopup } from '../../contexts/ResponsePopupContext';
import PrismCodeEditor from '../common/PrismCodeEditor';
import JsonEditor from '../common/JsonEditor';
import AuthSettings from './AuthSettings';
import HighlightedText from '../common/HighlightedText';

const RequestEditor = () => {
  const { activeRequest } = useCollection();
  const { loading, response, error, sendRequest, clearResponse } = useRequest();
  const [localError, setLocalError] = useState(null);
  const [localResponse, setLocalResponse] = useState(null);
  const { logRequest, logResponse, logError, openConsole } = useConsole();
  const { openPopup } = useResponsePopup();
  const {
    getVariable,
    setEnvironmentVariable,
    setGlobalVariable
  } = useEnvironment();

  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }]);
  const [bodyType, setBodyType] = useState('none');
  const [rawBody, setRawBody] = useState('');
  const [formData, setFormData] = useState([{ key: '', value: '', enabled: true }]);
  const [isJsonContent, setIsJsonContent] = useState(false);
  const [activeTab, setActiveTab] = useState('params');
  const [preRequestScript, setPreRequestScript] = useState('');
  const [testScript, setTestScript] = useState('');
  const [auth, setAuth] = useState(null);

  // Update form when active request changes
  useEffect(() => {
    console.log('Active request in editor:', activeRequest);
    if (activeRequest && activeRequest.request) {
      const request = activeRequest.request;
      console.log('Request details:', request);

      // Resetar o estado de JSON content
      setIsJsonContent(false);

      setMethod(request.method || 'GET');

      // Handle URL - can be string or object
      if (typeof request.url === 'string') {
        setUrl(request.url);
      } else if (typeof request.url === 'object') {
        // Handle Postman URL object format
        if (request.url.raw) {
          setUrl(request.url.raw);
        } else {
          // Try to construct URL from parts
          let constructedUrl = '';

          if (request.url.protocol) {
            constructedUrl += request.url.protocol + '://';
          }

          if (request.url.host) {
            constructedUrl += Array.isArray(request.url.host)
              ? request.url.host.join('.')
              : request.url.host;
          }

          if (request.url.path) {
            constructedUrl += '/' + (Array.isArray(request.url.path)
              ? request.url.path.join('/')
              : request.url.path);
          }

          setUrl(constructedUrl);
        }
      } else {
        setUrl('');
      }

      // Set headers
      if (request.header && request.header.length > 0) {
        const newHeaders = request.header.map(h => ({
          key: h.key || '',
          value: h.value || '',
          enabled: h.disabled !== true
        }));
        setHeaders(newHeaders);

        // Verificar se há um cabeçalho Content-Type para JSON
        checkJsonContentType(newHeaders);
      } else {
        setHeaders([{ key: '', value: '', enabled: true }]);
        setIsJsonContent(false);
      }

      // Set body
      if (request.body) {
        setBodyType(request.body.mode || 'none');

        if (request.body.mode === 'raw') {
          setRawBody(request.body.raw || '');
        } else if (request.body.mode === 'urlencoded' || request.body.mode === 'formdata') {
          const bodyParams = request.body[request.body.mode] || [];
          setFormData(bodyParams.map(p => ({
            key: p.key || '',
            value: p.value || '',
            enabled: p.disabled !== true
          })));
        }
      } else {
        setBodyType('none');
        setRawBody('');
        setFormData([{ key: '', value: '', enabled: true }]);
      }

      // Set scripts
      if (activeRequest.event) {
        const preRequestEvent = activeRequest.event.find(e => e.listen === 'prerequest');
        if (preRequestEvent && preRequestEvent.script) {
          setPreRequestScript(
            Array.isArray(preRequestEvent.script.exec)
              ? preRequestEvent.script.exec.join('\\n')
              : preRequestEvent.script.exec || ''
          );
        } else {
          setPreRequestScript('');
        }

        const testEvent = activeRequest.event.find(e => e.listen === 'test');
        if (testEvent && testEvent.script) {
          setTestScript(
            Array.isArray(testEvent.script.exec)
              ? testEvent.script.exec.join('\\n')
              : testEvent.script.exec || ''
          );
        } else {
          setTestScript('');
        }
      } else {
        setPreRequestScript('');
        setTestScript('');
      }
    }
  }, [activeRequest]);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);

    // Verificar se há um cabeçalho Content-Type para JSON
    checkJsonContentType(newHeaders);
  };

  // Verificar se o Content-Type é JSON
  const checkJsonContentType = useCallback((headersList = headers) => {
    const contentTypeHeader = headersList.find(
      h => h.enabled &&
      (h.key.toLowerCase() === 'content-type' || h.key.toLowerCase() === 'content-type:')
    );

    const isJson = contentTypeHeader &&
      (contentTypeHeader.value.includes('application/json') ||
       contentTypeHeader.value.includes('json'));

    setIsJsonContent(isJson);
  }, [headers]);

  const handleAddFormData = () => {
    setFormData([...formData, { key: '', value: '', enabled: true }]);
  };

  const handleFormDataChange = (index, field, value) => {
    const newFormData = [...formData];
    newFormData[index][field] = value;
    setFormData(newFormData);
  };

  const handleSendRequest = useCallback(() => {
    // Prepare request data
    const requestData = {
      method,
      url,
      header: headers.filter(h => h.key && h.enabled).map(h => ({
        key: h.key,
        value: h.value,
        disabled: !h.enabled
      })),
      body: bodyType !== 'none' ? {
        mode: bodyType,
        [bodyType]: bodyType === 'raw'
          ? rawBody
          : formData.filter(f => f.key && f.enabled).map(f => ({
              key: f.key,
              value: f.value,
              disabled: !f.enabled
            }))
      } : undefined,
      event: []
    };

    // Add scripts if they exist
    if (preRequestScript) {
      requestData.event.push({
        listen: 'prerequest',
        script: {
          exec: preRequestScript,
          type: 'text/javascript'
        }
      });
    }

    if (testScript) {
      requestData.event.push({
        listen: 'test',
        script: {
          exec: testScript,
          type: 'text/javascript'
        }
      });
    }

    // Create context for variable replacement and script execution
    const context = {
      getVariable,
      setEnvironmentVariable,
      setGlobalVariable,
      auth, // Incluir informações de autenticação
      logger: (type, message, details) => {
        switch (type) {
          case 'request':
            return logRequest(message, details);
          case 'response':
            return logResponse(message, details);
          case 'error':
            return logError(message, details);
          default:
            return logRequest(message, details);
        }
      }
    };

    // Abrir o console automaticamente ao enviar uma requisição
    openConsole();

    // Limpar resposta anterior
    clearResponse();

    // Send the request using our utility
    console.log('Enviando requisição:', requestData);

    sendApiRequest(requestData, context)
      .then(responseData => {
        console.log('Resposta recebida:', responseData);

        // Verificar se há erro na resposta
        if (responseData.error) {
          setLocalError(responseData.error);
          // Ainda assim, definimos a resposta para exibir detalhes
          setLocalResponse(responseData);
        } else {
          setLocalError(null);
          setLocalResponse(responseData);
        }

        // Mostrar o popup com a resposta
        openPopup(responseData);

        // Notificar o hook useRequest
        sendRequest(requestData, responseData);
      })
      .catch(error => {
        console.error('Erro ao enviar requisição:', error);
        setLocalError(error.message || 'Erro desconhecido ao enviar requisição');

        // Criar uma resposta de erro para exibir
        const errorResponse = {
          error: error.message || 'Erro desconhecido',
          status: 0,
          statusText: 'Error',
          data: null,
          headers: {},
          testResults: null
        };

        setLocalResponse(errorResponse);

        // Mostrar o popup com a resposta de erro
        openPopup(errorResponse);

        sendRequest(requestData, errorResponse);
      });
  }, [
    method,
    url,
    headers,
    bodyType,
    rawBody,
    formData,
    preRequestScript,
    testScript,
    getVariable,
    setEnvironmentVariable,
    setGlobalVariable,
    sendRequest,
    clearResponse,
    auth,
    openConsole,
    logRequest,
    logResponse,
    logError,
    openPopup
  ]);

  if (!activeRequest) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        Select a request from the collection to start
      </div>
    );
  }

  // Check if the request object is valid
  if (!activeRequest.request) {
    console.error('Invalid request object:', activeRequest);
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-red-500">
        <div className="text-center">
          <p className="mb-2">This request appears to be invalid or incomplete.</p>
          <p>Please select another request or check the console for details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Request URL and method */}
      <div className="flex items-center p-2 border-b border-gray-200 flex-shrink-0">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded-l-md bg-gray-50 text-gray-700 font-medium text-sm"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>

        <div className="flex-grow flex flex-col">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="w-full px-2 py-1 border-t border-b border-gray-300 text-sm"
          />
          {url && url.includes('{{') && (
            <div className="text-xs px-2 py-0.5 border-b border-gray-300 bg-gray-50">
              <div className="flex items-center">
                <span className="font-medium text-blue-600 mr-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  URL com variáveis:
                </span>
                <span className="text-gray-800">
                  <HighlightedText
                    text={url}
                    pattern={/\{\{([^}]+)\}\}/g}
                    highlightClassName="bg-blue-100 text-blue-800 px-1 rounded"
                    transformMatch={(match) => {
                      // Extrair apenas o nome da variável sem os colchetes
                      const varName = match.replace(/\{\{|\}\}/g, '');
                      return varName;
                    }}
                  />
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-green-600 mr-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Preview:
                </span>
                <span className="text-gray-800 truncate">{replaceVariables(url, getVariable)}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSendRequest}
          disabled={loading || !url}
          className={`px-3 py-1 rounded-r-md text-white font-medium transition-colors duration-200 text-sm
                    ${loading || !url
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending
            </div>
          ) : (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Send
            </div>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('params')}
          className={`px-2 py-1 font-medium text-xs whitespace-nowrap
                    ${activeTab === 'params'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Params
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`px-2 py-1 font-medium text-xs whitespace-nowrap
                    ${activeTab === 'auth'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Authorization
          {auth && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`px-2 py-1 font-medium text-xs whitespace-nowrap
                    ${activeTab === 'headers'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Headers
        </button>

        <button
          onClick={() => setActiveTab('body')}
          className={`px-2 py-1 font-medium text-xs whitespace-nowrap
                    ${activeTab === 'body'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Body
        </button>

        <button
          onClick={() => setActiveTab('pre-request')}
          className={`px-2 py-1 font-medium text-xs whitespace-nowrap
                    ${activeTab === 'pre-request'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Pre-request Script
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-2 py-1 font-medium text-xs whitespace-nowrap
                    ${activeTab === 'tests'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'}`}
        >
          Tests
        </button>
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto p-2" style={{ height: 'calc(100% - 70px)' }}>
        {activeTab === 'params' && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Query parameters will be automatically extracted from the URL
            </p>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => handleHeaderChange(index, 'enabled', e.target.checked)}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            ))}

            <button
              onClick={handleAddHeader}
              className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              Add Header
            </button>
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="none"
                    checked={bodyType === 'none'}
                    onChange={() => setBodyType('none')}
                    className="mr-2"
                  />
                  None
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    value="raw"
                    checked={bodyType === 'raw'}
                    onChange={() => setBodyType('raw')}
                    className="mr-2"
                  />
                  Raw
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    value="urlencoded"
                    checked={bodyType === 'urlencoded'}
                    onChange={() => setBodyType('urlencoded')}
                    className="mr-2"
                  />
                  x-www-form-urlencoded
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    value="formdata"
                    checked={bodyType === 'formdata'}
                    onChange={() => setBodyType('formdata')}
                    className="mr-2"
                  />
                  form-data
                </label>
              </div>
            </div>

            {bodyType === 'raw' && (
              <>
                <div className="flex items-center justify-end mb-2">
                  <label className="text-sm text-gray-600 mr-2">Content Type:</label>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={isJsonContent ? 'json' : 'text'}
                    onChange={(e) => {
                      const isJson = e.target.value === 'json';
                      setIsJsonContent(isJson);

                      // Atualizar ou adicionar cabeçalho Content-Type
                      const contentTypeIndex = headers.findIndex(
                        h => h.key.toLowerCase() === 'content-type' || h.key.toLowerCase() === 'content-type:'
                      );

                      const newHeaders = [...headers];
                      if (contentTypeIndex >= 0) {
                        // Atualizar cabeçalho existente
                        newHeaders[contentTypeIndex] = {
                          ...newHeaders[contentTypeIndex],
                          value: isJson ? 'application/json' : 'text/plain',
                          enabled: true
                        };
                      } else {
                        // Adicionar novo cabeçalho
                        newHeaders.push({
                          key: 'Content-Type',
                          value: isJson ? 'application/json' : 'text/plain',
                          enabled: true
                        });
                      }

                      setHeaders(newHeaders);
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="html">HTML</option>
                  </select>
                </div>

                {isJsonContent ? (
                  <JsonEditor
                    value={rawBody}
                    onChange={setRawBody}
                    placeholder="Enter JSON body content"
                    height="200px"
                    autoFormat={true}
                  />
                ) : (
                  <textarea
                    value={rawBody}
                    onChange={(e) => setRawBody(e.target.value)}
                    placeholder="Enter raw body content"
                    className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                )}
              </>
            )}

            {(bodyType === 'urlencoded' || bodyType === 'formdata') && (
              <div className="space-y-2">
                {formData.map((param, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => handleFormDataChange(index, 'enabled', e.target.checked)}
                      className="mr-2"
                    />
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleFormDataChange(index, 'key', e.target.value)}
                      placeholder="Parameter name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleFormDataChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ))}

                <button
                  onClick={handleAddFormData}
                  className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Add Parameter
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pre-request' && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              This script will be executed before the request is sent
            </p>
            <PrismCodeEditor
              value={preRequestScript}
              onChange={setPreRequestScript}
              placeholder="// Write pre-request script here"
              height="200px"
            />
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              This script will be executed after the response is received
            </p>
            <PrismCodeEditor
              value={testScript}
              onChange={setTestScript}
              placeholder="// Write test script here
// Example:
// pm.test('Status code is 200', function() {
//   pm.expect(pm.response.code).to.equal(200);
// });"
              height="200px"
            />
          </div>
        )}

        {activeTab === 'auth' && (
          <AuthSettings
            url={url}
            onAuthChange={setAuth}
          />
        )}
      </div>
    </div>
  );
};

export default RequestEditor;

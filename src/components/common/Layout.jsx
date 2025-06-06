import { useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useEnvironment } from '../../hooks/useEnvironment';
import CollectionList from '../Collection/CollectionList';
import CollectionImporter from '../Collection/CollectionImporter';
import EnvironmentImporter from '../Environment/EnvironmentImporter';
import EnvironmentSelector from '../Environment/EnvironmentSelector';
import EnvironmentVariables from '../Environment/EnvironmentVariables';
import RequestEditor from '../Request/RequestEditor';
import ResponseViewer from '../Response/ResponseViewer';
import { Console, ConsoleButton } from '../Console';
import Welcome from './Welcome';
import TestPage from '../Test/TestPage';

const Layout = () => {
  const { collections } = useCollection();
  const { environments } = useEnvironment();
  const [sidebarTab, setSidebarTab] = useState('collections');
  const [showResponse, setShowResponse] = useState(true);
  const [activeView, setActiveView] = useState('request'); // 'request' or 'test'

  // Verificar se deve exibir o console (não exibir na tela de boas-vindas)
  const shouldShowConsole = collections.length > 0 || environments.length > 0;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Welcome screen */}
      <Welcome />

      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r border-gray-200 bg-white">
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-200 bg-blue-600">
          <h1 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.5M3 15l4.5-8.5" />
            </svg>
            Postman Clone
          </h1>
        </div>

        {/* Sidebar tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSidebarTab('collections')}
            className={`flex-1 py-3 font-medium text-sm flex items-center justify-center
                      ${sidebarTab === 'collections'
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Collections
          </button>

          <button
            onClick={() => setSidebarTab('environments')}
            className={`flex-1 py-3 font-medium text-sm flex items-center justify-center
                      ${sidebarTab === 'environments'
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Environments
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-grow overflow-auto p-4">
          {sidebarTab === 'collections' && (
            <div className="space-y-4">
              <CollectionImporter />
              <CollectionList />
            </div>
          )}

          {sidebarTab === 'environments' && (
            <div className="space-y-4">
              <EnvironmentImporter />
              <EnvironmentVariables />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        {/* Environment selector and view toggle */}
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <EnvironmentSelector />

          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setActiveView('request')}
              className={`px-3 py-1 text-sm font-medium ${
                activeView === 'request'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Request Editor
            </button>
            <button
              onClick={() => setActiveView('test')}
              className={`px-3 py-1 text-sm font-medium ${
                activeView === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Test Runner
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-grow flex flex-col">
          {activeView === 'request' ? (
            <>
              {/* Request editor */}
              <div className={`${showResponse ? 'h-1/2' : 'h-full'} bg-white border-b border-gray-200 overflow-hidden`}>
                <RequestEditor />
              </div>

              {/* Response viewer */}
              {showResponse && (
                <div className="h-1/2 bg-white flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-1 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <h3 className="font-medium text-gray-700 text-sm">Response</h3>
                    <button
                      onClick={() => setShowResponse(false)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Hide response"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ResponseViewer />
                  </div>
                </div>
              )}

              {/* Show response button (when hidden) */}
              {!showResponse && (
                <button
                  onClick={() => setShowResponse(true)}
                  className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700"
                  title="Show response"
                >
                  ↑
                </button>
              )}
            </>
          ) : (
            /* Test page */
            <div className="flex-grow bg-white overflow-auto">
              <TestPage />
            </div>
          )}

        </div>
      </div>

      {/* Console - só exibir quando não estiver na tela de boas-vindas */}
      {shouldShowConsole && <Console />}
    </div>
  );
};

export default Layout;

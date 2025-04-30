import { useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useEnvironment } from '../../hooks/useEnvironment';
import { parseCollectionFile } from '../../utils/collectionParser';
import { parseEnvironmentFile } from '../../utils/environmentParser';
import Spinner from './Spinner';
import { FaCloud, FaFlask, FaLock, FaTerminal, FaExchangeAlt, FaList, FaCode } from 'react-icons/fa';

const Welcome = () => {
  const { collections, importCollection } = useCollection();
  const { environments, importEnvironment } = useEnvironment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleImportSamples = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch sample collection
      const collectionResponse = await fetch('/sample-collection.json');
      if (!collectionResponse.ok) {
        throw new Error('Failed to fetch sample collection');
      }
      const collectionData = await collectionResponse.json();

      // Fetch sample environment
      const environmentResponse = await fetch('/sample-environment.json');
      if (!environmentResponse.ok) {
        throw new Error('Failed to fetch sample environment');
      }
      const environmentData = await environmentResponse.json();

      // Import collection and environment
      const collectionImported = importCollection(collectionData);
      const environmentImported = importEnvironment(environmentData);

      if (collectionImported && environmentImported) {
        setSuccess(true);
      } else {
        setError('Failed to import samples');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If there are already collections or environments, don't show the welcome screen
  if (collections.length > 0 || environments.length > 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 z-10">
      <div className="max-w-2xl p-8 bg-white rounded-lg shadow-xl border border-blue-100">
        <div className="flex items-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.5M3 15l4.5-8.5" />
          </svg>
          <h1 className="text-3xl font-bold text-blue-600">Welcome to Postman Clone</h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This is a web-based alternative to Postman, with powerful features for API testing and development:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* API Collections & Environments */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center">
                <FaCloud className="mr-2" /> Collections & Environments
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Import and manage Postman collections
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Import and manage Postman environments
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Environment variable management
                </li>
              </ul>
            </div>

            {/* API Testing */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center">
                <FaFlask className="mr-2" /> API Testing
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Run test sequences with multiple parameters
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Bulk add test parameters with semicolon-separated format
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Sequential API request execution
                </li>
              </ul>
            </div>

            {/* Authentication */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-lg font-semibold text-purple-700 mb-2 flex items-center">
                <FaLock className="mr-2" /> Authentication
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Global authentication with username/password
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Variable substitution with {'{{'}'user{'}}'} and {'{{'}'password{'}}'}
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Auto-fill from environment variables
                </li>
              </ul>
            </div>

            {/* Scripting & Debugging */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h3 className="text-lg font-semibold text-yellow-700 mb-2 flex items-center">
                <FaCode className="mr-2" /> Scripting & Debugging
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Pre-request scripts for request modification
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Test scripts with Chai assertion library
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Console for request/response logging
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Getting Started</h2>

          <p className="text-gray-600 mb-4">
            You can import your own Postman collections and environments, or use our sample files to explore the functionality.
          </p>

          <button
            onClick={handleImportSamples}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium
                      ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Spinner size="sm" color="white" />
                <span className="ml-2">Importing...</span>
              </div>
            ) : 'Import Sample Collection & Environment'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
              Sample collection and environment imported successfully!
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex flex-col md:flex-row md:justify-between text-sm text-gray-500">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium text-gray-700 mb-2">About This Application</h3>
              <p className="mb-2">
                This application runs entirely in your browser. Your collections, environments, and test data are stored in your browser's local storage.
              </p>
              <p>
                The application includes a proxy server to handle CORS issues and provide authentication support for your API requests.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Quick Tips</h3>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <FaTerminal className="text-gray-400 mr-2" size={14} />
                  Use the console to debug requests and responses
                </li>
                <li className="flex items-center">
                  <FaExchangeAlt className="text-gray-400 mr-2" size={14} />
                  Switch between Request Editor and Test Runner modes
                </li>
                <li className="flex items-center">
                  <FaList className="text-gray-400 mr-2" size={14} />
                  Organize your requests in collections for easier testing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

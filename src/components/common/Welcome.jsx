import { useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useEnvironment } from '../../hooks/useEnvironment';
import { parseCollectionFile } from '../../utils/collectionParser';
import { parseEnvironmentFile } from '../../utils/environmentParser';
import Spinner from './Spinner';

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
            This is a web-based alternative to Postman, allowing you to:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Import and manage Postman collections</li>
            <li>Import and manage Postman environments</li>
            <li>Execute API requests with pre-request and test scripts</li>
            <li>Manage environment variables that can be populated by tests</li>
          </ul>
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

        <div className="text-sm text-gray-500">
          <p>
            Note: This application runs entirely in your browser. Your collections and environments are stored in your browser's local storage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

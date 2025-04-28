import { useState } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';

const EnvironmentSelector = () => {
  const {
    environments,
    activeEnvironment,
    selectEnvironment,
    removeEnvironment
  } = useEnvironment();

  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelectEnvironment = (environmentId) => {
    selectEnvironment(environmentId);
    setShowDropdown(false);
  };

  const handleRemoveEnvironment = (e, environmentId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this environment?')) {
      removeEnvironment(environmentId);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${activeEnvironment ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span>
            {activeEnvironment ? activeEnvironment.name : 'No Environment'}
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <ul className="py-1 max-h-60 overflow-auto">
            <li>
              <button
                onClick={() => handleSelectEnvironment(null)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                          ${!activeEnvironment ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                No Environment
              </button>
            </li>

            {environments.map(env => (
              <li key={env.id}>
                <div className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100">
                  <button
                    onClick={() => handleSelectEnvironment(env.id)}
                    className={`flex-grow text-left
                              ${activeEnvironment && activeEnvironment.id === env.id
                                ? 'text-blue-700 font-medium'
                                : ''}`}
                  >
                    {env.name}
                  </button>

                  <button
                    onClick={(e) => handleRemoveEnvironment(e, env.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                    title="Remove environment"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnvironmentSelector;

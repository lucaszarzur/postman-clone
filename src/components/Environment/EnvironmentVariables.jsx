import { useState } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';

const EnvironmentVariables = () => {
  const { 
    activeEnvironment, 
    globalVariables, 
    setEnvironmentVariable, 
    setGlobalVariable 
  } = useEnvironment();
  
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [isAddingToEnv, setIsAddingToEnv] = useState(true);
  const [showGlobals, setShowGlobals] = useState(false);

  const handleAddVariable = () => {
    if (!newVarKey.trim()) return;
    
    if (isAddingToEnv && activeEnvironment) {
      setEnvironmentVariable(newVarKey, newVarValue);
    } else {
      setGlobalVariable(newVarKey, newVarValue);
    }
    
    setNewVarKey('');
    setNewVarValue('');
  };

  const handleUpdateEnvVariable = (index, value) => {
    if (!activeEnvironment) return;
    
    const variable = activeEnvironment.values[index];
    setEnvironmentVariable(variable.key, value);
  };

  const handleUpdateGlobalVariable = (key, value) => {
    setGlobalVariable(key, value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Variables</h2>
      </div>
      
      {/* Environment Variables */}
      {activeEnvironment && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-md font-medium mb-3">
            Environment: {activeEnvironment.name}
          </h3>
          
          <div className="space-y-2">
            {activeEnvironment.values.map((variable, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={variable.key}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="w-2/3">
                  <input
                    type="text"
                    value={variable.value}
                    onChange={(e) => handleUpdateEnvVariable(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Global Variables */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowGlobals(!showGlobals)}
          className="flex items-center text-md font-medium mb-3"
        >
          <span className="mr-2">{showGlobals ? '▼' : '►'}</span>
          Global Variables
        </button>
        
        {showGlobals && (
          <div className="space-y-2">
            {Object.entries(globalVariables).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="w-2/3">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateGlobalVariable(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}
            
            {Object.keys(globalVariables).length === 0 && (
              <div className="text-gray-500 text-sm">No global variables defined</div>
            )}
          </div>
        )}
      </div>
      
      {/* Add New Variable */}
      <div className="p-4">
        <h3 className="text-md font-medium mb-3">Add New Variable</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-1/3">
              <input
                type="text"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value)}
                placeholder="Variable name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="w-2/3">
              <input
                type="text"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                placeholder="Value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="add-to-env"
                checked={isAddingToEnv}
                onChange={() => setIsAddingToEnv(true)}
                disabled={!activeEnvironment}
                className="mr-2"
              />
              <label htmlFor="add-to-env" className={!activeEnvironment ? 'text-gray-400' : ''}>
                Add to Environment
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="add-to-global"
                checked={!isAddingToEnv}
                onChange={() => setIsAddingToEnv(false)}
                className="mr-2"
              />
              <label htmlFor="add-to-global">Add to Globals</label>
            </div>
          </div>
          
          <button
            onClick={handleAddVariable}
            disabled={!newVarKey.trim() || (isAddingToEnv && !activeEnvironment)}
            className={`py-2 px-4 rounded-md text-white font-medium
                      ${!newVarKey.trim() || (isAddingToEnv && !activeEnvironment)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Add Variable
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentVariables;

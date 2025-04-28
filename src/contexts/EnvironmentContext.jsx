import { createContext, useState, useEffect } from 'react';

export const EnvironmentContext = createContext();

export const EnvironmentProvider = ({ children }) => {
  const [environments, setEnvironments] = useState([]);
  const [activeEnvironment, setActiveEnvironment] = useState(null);
  const [globalVariables, setGlobalVariables] = useState({});

  // Load environments and global variables from localStorage on initial render
  useEffect(() => {
    const savedEnvironments = localStorage.getItem('environments');
    const savedGlobals = localStorage.getItem('globalVariables');
    
    if (savedEnvironments) {
      try {
        setEnvironments(JSON.parse(savedEnvironments));
      } catch (error) {
        console.error('Failed to parse saved environments:', error);
      }
    }
    
    if (savedGlobals) {
      try {
        setGlobalVariables(JSON.parse(savedGlobals));
      } catch (error) {
        console.error('Failed to parse saved global variables:', error);
      }
    }
  }, []);

  // Save environments and global variables to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('environments', JSON.stringify(environments));
  }, [environments]);

  useEffect(() => {
    localStorage.setItem('globalVariables', JSON.stringify(globalVariables));
  }, [globalVariables]);

  // Import an environment from a JSON file
  const importEnvironment = (environmentData) => {
    try {
      // Check if it's a valid Postman environment
      if (!environmentData.name || !environmentData.values) {
        throw new Error('Invalid environment format');
      }

      // Check if environment with same ID already exists
      const existingIndex = environments.findIndex(e => e.id === environmentData.id);
      
      if (existingIndex >= 0) {
        // Update existing environment
        const updatedEnvironments = [...environments];
        updatedEnvironments[existingIndex] = environmentData;
        setEnvironments(updatedEnvironments);
      } else {
        // Add new environment
        setEnvironments([...environments, environmentData]);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing environment:', error);
      return false;
    }
  };

  // Remove an environment
  const removeEnvironment = (environmentId) => {
    setEnvironments(environments.filter(e => e.id !== environmentId));
    
    // If the active environment is being removed, clear it
    if (activeEnvironment && activeEnvironment.id === environmentId) {
      setActiveEnvironment(null);
    }
  };

  // Set the active environment
  const selectEnvironment = (environmentId) => {
    const environment = environments.find(e => e.id === environmentId);
    setActiveEnvironment(environment || null);
  };

  // Get a variable value (from active environment or globals)
  const getVariable = (key) => {
    // First check active environment
    if (activeEnvironment) {
      const envVar = activeEnvironment.values.find(v => v.key === key);
      if (envVar) return envVar.value;
    }
    
    // Then check global variables
    return globalVariables[key] || null;
  };

  // Set a variable in the active environment
  const setEnvironmentVariable = (key, value) => {
    if (!activeEnvironment) return false;
    
    const updatedEnvironment = { ...activeEnvironment };
    const varIndex = updatedEnvironment.values.findIndex(v => v.key === key);
    
    if (varIndex >= 0) {
      // Update existing variable
      updatedEnvironment.values[varIndex].value = value;
    } else {
      // Add new variable
      updatedEnvironment.values.push({
        key,
        value,
        enabled: true
      });
    }
    
    // Update the environments array
    const updatedEnvironments = environments.map(env => 
      env.id === activeEnvironment.id ? updatedEnvironment : env
    );
    
    setEnvironments(updatedEnvironments);
    setActiveEnvironment(updatedEnvironment);
    return true;
  };

  // Set a global variable
  const setGlobalVariable = (key, value) => {
    setGlobalVariables({
      ...globalVariables,
      [key]: value
    });
    return true;
  };

  return (
    <EnvironmentContext.Provider
      value={{
        environments,
        activeEnvironment,
        globalVariables,
        importEnvironment,
        removeEnvironment,
        selectEnvironment,
        getVariable,
        setEnvironmentVariable,
        setGlobalVariable
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
};

/**
 * Parse a Postman environment file
 * @param {File} file - The environment file to parse
 * @returns {Promise<Object>} - The parsed environment data
 */
export const parseEnvironmentFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate that it's a Postman environment
        if (!data.name || !data.values) {
          return reject(new Error('Invalid Postman environment format'));
        }
        
        // Ensure the environment has an ID
        if (!data.id) {
          data.id = generateId();
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse environment file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read environment file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Generate a random ID for environments that don't have one
 * @returns {string} - A random UUID-like string
 */
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Convert environment variables to a simple key-value object
 * @param {Object} environment - The environment object
 * @returns {Object} - A simple key-value object of variables
 */
export const environmentToObject = (environment) => {
  if (!environment || !environment.values) return {};
  
  const result = {};
  
  environment.values.forEach(variable => {
    if (variable.enabled !== false) {
      result[variable.key] = variable.value;
    }
  });
  
  return result;
};

/**
 * Parse a Postman collection file
 * @param {File} file - The collection file to parse
 * @returns {Promise<Object>} - The parsed collection data
 */
export const parseCollectionFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate that it's a Postman collection
        if (!data.info || !data.info._postman_id || !data.item) {
          return reject(new Error('Invalid Postman collection format'));
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse collection file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read collection file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Find a request in a collection by ID
 * @param {Object} collection - The collection to search
 * @param {string} requestId - The ID of the request to find
 * @returns {Object|null} - The request object or null if not found
 */
export const findRequestById = (collection, requestId) => {
  if (!collection || !collection.item) return null;
  
  // Recursive function to search through nested items
  const findInItems = (items) => {
    for (const item of items) {
      // If this is a request and it matches the ID, return it
      if (item.id === requestId) {
        return item;
      }
      
      // If this is a folder, search its items
      if (item.item) {
        const found = findInItems(item.item);
        if (found) return found;
      }
    }
    
    return null;
  };
  
  return findInItems(collection.item);
};

/**
 * Get a flat list of all requests in a collection
 * @param {Object} collection - The collection to process
 * @returns {Array} - Array of all requests with their full paths
 */
export const getAllRequests = (collection) => {
  if (!collection || !collection.item) return [];
  
  const requests = [];
  
  // Recursive function to process items
  const processItems = (items, path = []) => {
    for (const item of items) {
      const currentPath = [...path, item.name];
      
      // If this is a request, add it to the list
      if (item.request) {
        requests.push({
          id: item.id,
          name: item.name,
          path: currentPath,
          request: item.request,
          event: item.event
        });
      }
      
      // If this is a folder, process its items
      if (item.item) {
        processItems(item.item, currentPath);
      }
    }
  };
  
  processItems(collection.item);
  
  return requests;
};

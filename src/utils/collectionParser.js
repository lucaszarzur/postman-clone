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

        // Processar os scripts de teste para corrigir quebras de linha
        const processScripts = (items) => {
          for (const item of items) {
            // Se o item tem eventos (scripts de teste)
            if (item.event && Array.isArray(item.event)) {
              for (const event of item.event) {
                if (event.script && event.script.exec) {
                  // Se exec é uma string, substituir \n literais por quebras de linha reais
                  if (typeof event.script.exec === 'string') {
                    event.script.exec = event.script.exec.replace(/\\n/g, '\n');
                    console.log('Corrigido script de teste (string):', {
                      itemName: item.name,
                      eventListen: event.listen,
                      scriptPreview: event.script.exec.substring(0, 100) + '...'
                    });
                  }
                  // Se exec é um array, processar cada linha
                  else if (Array.isArray(event.script.exec)) {
                    event.script.exec = event.script.exec.map(line =>
                      typeof line === 'string' ? line.replace(/\\n/g, '\n') : line
                    );
                    console.log('Corrigido script de teste (array):', {
                      itemName: item.name,
                      eventListen: event.listen,
                      lineCount: event.script.exec.length
                    });
                  }
                }
              }
            }

            // Processar recursivamente se for uma pasta
            if (item.item && Array.isArray(item.item)) {
              processScripts(item.item);
            }
          }
        };

        // Processar os scripts de teste na coleção
        if (data.item && Array.isArray(data.item)) {
          processScripts(data.item);
          console.log('Processamento de scripts de teste concluído');
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

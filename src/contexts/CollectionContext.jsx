import { createContext, useState, useEffect } from 'react';

export const CollectionContext = createContext();

export const CollectionProvider = ({ children }) => {
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  // Load collections from localStorage on initial render
  useEffect(() => {
    const savedCollections = localStorage.getItem('collections');
    if (savedCollections) {
      try {
        setCollections(JSON.parse(savedCollections));
      } catch (error) {
        console.error('Failed to parse saved collections:', error);
      }
    }
  }, []);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('collections', JSON.stringify(collections));
  }, [collections]);

  // Import a collection from a JSON file
  const importCollection = (collectionData) => {
    try {
      // Check if it's a valid Postman collection
      if (!collectionData.info || !collectionData.item) {
        throw new Error('Invalid collection format');
      }

      // Check if collection with same ID already exists
      const existingIndex = collections.findIndex(c => c.info && c.info._postman_id === collectionData.info._postman_id);

      if (existingIndex >= 0) {
        // Update existing collection
        const updatedCollections = [...collections];
        updatedCollections[existingIndex] = collectionData;
        setCollections(updatedCollections);
      } else {
        // Add new collection
        setCollections([...collections, collectionData]);
      }

      return true;
    } catch (error) {
      console.error('Error importing collection:', error);
      return false;
    }
  };

  // Remove a collection
  const removeCollection = (collectionId) => {
    setCollections(collections.filter(c => c.info._postman_id !== collectionId));

    // If the active collection is being removed, clear it
    if (activeCollection && activeCollection.info._postman_id === collectionId) {
      setActiveCollection(null);
      setActiveRequest(null);
    }
  };

  // Set the active collection
  const selectCollection = (collectionId) => {
    const collection = collections.find(c => c.info._postman_id === collectionId);
    setActiveCollection(collection || null);
    setActiveRequest(null);
  };

  // Set the active request
  const selectRequest = (requestId, requestObject = null) => {
    if (!activeCollection) {
      console.error('No active collection when selecting request');
      return;
    }

    console.log('Finding request with ID:', requestId, 'in collection:', activeCollection);

    // If request object is provided directly, use it
    if (requestObject) {
      console.log('Using provided request object:', requestObject);
      setActiveRequest(requestObject);
      return;
    }

    // Otherwise, recursively find the request in the collection
    const findRequest = (items) => {
      for (const item of items) {
        console.log('Checking item:', item);
        if (item.id === requestId) {
          console.log('Found matching item:', item);
          return item;
        }
        if (item.item) {
          const found = findRequest(item.item);
          if (found) return found;
        }
      }
      return null;
    };

    const request = findRequest(activeCollection.item);
    console.log('Selected request:', request);
    setActiveRequest(request);
  };

  // Update a request in a collection
  const updateRequest = (collectionId, requestId, updatedRequest) => {
    // Find the collection
    const collectionIndex = collections.findIndex(c => c.info._postman_id === collectionId);
    if (collectionIndex === -1) {
      console.error(`Collection with ID ${collectionId} not found`);
      return false;
    }

    // Create a deep copy of the collection
    const updatedCollections = [...collections];
    const collection = JSON.parse(JSON.stringify(updatedCollections[collectionIndex]));

    // Recursive function to find and update the request
    const updateRequestInItems = (items) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if this is the request we're looking for
        if (item.id === requestId || (item.name === updatedRequest.name && !item.item)) {
          // Update the request
          items[i] = updatedRequest;
          return true;
        }

        // If this is a folder, search its items
        if (item.item) {
          const found = updateRequestInItems(item.item);
          if (found) return true;
        }
      }

      return false;
    };

    // Try to update the request
    const updated = updateRequestInItems(collection.item);

    if (updated) {
      // Update the collection in the state
      updatedCollections[collectionIndex] = collection;
      setCollections(updatedCollections);

      // If this is the active request, update it too
      if (activeRequest && (activeRequest.id === requestId || activeRequest.name === updatedRequest.name)) {
        setActiveRequest(updatedRequest);
      }

      return true;
    }

    console.error(`Request with ID ${requestId} not found in collection ${collectionId}`);
    return false;
  };

  return (
    <CollectionContext.Provider
      value={{
        collections,
        activeCollection,
        activeRequest,
        importCollection,
        removeCollection,
        selectCollection,
        selectRequest,
        updateRequest
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

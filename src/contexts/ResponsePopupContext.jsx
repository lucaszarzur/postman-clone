import { createContext, useContext, useState } from 'react';

// Create context
const ResponsePopupContext = createContext();

// Custom hook to use the context
export const useResponsePopup = () => {
  const context = useContext(ResponsePopupContext);
  if (!context) {
    throw new Error('useResponsePopup must be used within a ResponsePopupProvider');
  }
  return context;
};

// Provider component
export const ResponsePopupProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [responseData, setResponseData] = useState(null);

  // Open popup with response data
  const openPopup = (response) => {
    setResponseData(response);
    setIsOpen(true);
  };

  // Close popup
  const closePopup = () => {
    setIsOpen(false);
  };

  // Value to be provided to consumers
  const value = {
    isOpen,
    responseData,
    openPopup,
    closePopup
  };

  return (
    <ResponsePopupContext.Provider value={value}>
      {children}
    </ResponsePopupContext.Provider>
  );
};

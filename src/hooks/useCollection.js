import { useContext } from 'react';
import { CollectionContext } from '../contexts/CollectionContext';

export const useCollection = () => {
  const context = useContext(CollectionContext);
  
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  
  return context;
};

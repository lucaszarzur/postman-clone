import { useContext } from 'react';
import { TestContext } from '../contexts/TestContext';

export const useTest = () => useContext(TestContext);

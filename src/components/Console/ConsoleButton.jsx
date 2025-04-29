import React from 'react';
import { useConsole } from '../../contexts/ConsoleContext';
import { FaTerminal } from 'react-icons/fa';

const ConsoleButton = () => {
  const { toggleConsole, isOpen, logs } = useConsole();

  return (
    <button
      onClick={toggleConsole}
      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-300"
    >
      <FaTerminal className="mr-1" />
      <span>Console</span>
      {logs.length > 0 && (
        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {logs.length}
        </span>
      )}
    </button>
  );
};

export default ConsoleButton;

import { useConsole } from '../../contexts/ConsoleContext';

const ConsoleToggle = () => {
  const { isOpen, toggleConsole } = useConsole();
  
  return (
    <button
      onClick={toggleConsole}
      className={`px-3 py-1 text-sm font-medium rounded-md flex items-center ${
        isOpen ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
      Console
    </button>
  );
};

export default ConsoleToggle;

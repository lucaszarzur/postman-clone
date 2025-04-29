import { useState, useEffect, useCallback, useRef } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';
import { LOG_TYPES } from '../../contexts/ConsoleContext';

const GlobalAuthSettings = () => {
  const { getVariable, setGlobalVariable, globalVariables } = useEnvironment();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enableGlobalAuth, setEnableGlobalAuth] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAutoFillMenu, setShowAutoFillMenu] = useState(false);
  const autoFillMenuRef = useRef(null);

  // Load initial values from environment variables only once
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing GlobalAuthSettings component');
      const savedUsername = getVariable('user');
      const savedPassword = getVariable('password');
      const savedEnableGlobalAuth = getVariable('enableGlobalAuth');

      console.log('Loaded global auth settings:', {
        user: savedUsername || '[not set]',
        password: savedPassword ? '[set]' : '[not set]',
        enabled: savedEnableGlobalAuth === 'true'
      });

      if (savedUsername) setUsername(savedUsername);
      if (savedPassword) setPassword(savedPassword);
      setEnableGlobalAuth(savedEnableGlobalAuth === 'true');
      setIsInitialized(true);
    }
  }, [getVariable, isInitialized]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autoFillMenuRef.current && !autoFillMenuRef.current.contains(event.target)) {
        setShowAutoFillMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle saving username
  const handleUsernameChange = useCallback((e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (enableGlobalAuth) {
      console.log('Setting global user variable:', newUsername);
      setGlobalVariable('user', newUsername);
    }
  }, [enableGlobalAuth, setGlobalVariable]);

  // Handle saving password
  const handlePasswordChange = useCallback((e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (enableGlobalAuth) {
      console.log('Setting global password variable:', newPassword ? '[MASKED]' : '[EMPTY]');
      setGlobalVariable('password', newPassword);
    }
  }, [enableGlobalAuth, setGlobalVariable]);

  // Toggle auto-fill menu
  const toggleAutoFillMenu = useCallback(() => {
    setShowAutoFillMenu(prev => !prev);
  }, []);

  // Function to fill with default values (not a callback to avoid circular dependencies)
  const fillWithDefaultValues = () => {
    const defaultUsername = 'admin';
    const defaultPassword = 'admin';

    setUsername(defaultUsername);
    setPassword(defaultPassword);

    if (enableGlobalAuth) {
      setGlobalVariable('user', defaultUsername);
      setGlobalVariable('password', defaultPassword);
    }

    console.log('Auto-filled authentication fields with default values');
  };

  // Handle auto-fill with default values
  const handleAutoFillDefault = useCallback(() => {
    fillWithDefaultValues();
    setShowAutoFillMenu(false);
  }, [enableGlobalAuth, setGlobalVariable]);

  // Get best available environment variables for authentication
  const getBestAuthVariables = useCallback(() => {
    // Try common variable names for username
    const usernameVars = ['username', 'user', 'login', 'email', 'apiUser', 'apiUsername'];
    let username = null;

    for (const varName of usernameVars) {
      const value = getVariable(varName);
      if (value) {
        username = value;
        console.log(`Found username in environment variable: ${varName}`);
        break;
      }
    }

    // Try common variable names for password
    const passwordVars = ['password', 'pass', 'secret', 'apiKey', 'token', 'apiPassword'];
    let password = null;

    for (const varName of passwordVars) {
      const value = getVariable(varName);
      if (value) {
        password = value;
        console.log(`Found password in environment variable: ${varName}`);
        break;
      }
    }

    return { username, password };
  }, [getVariable]);

  // Handle auto-fill with environment variables
  const handleAutoFillFromEnv = useCallback(() => {
    // Get best available environment variables
    const { username: envUsername, password: envPassword } = getBestAuthVariables();

    if (envUsername || envPassword) {
      if (envUsername) setUsername(envUsername);
      if (envPassword) setPassword(envPassword);

      if (enableGlobalAuth) {
        if (envUsername) setGlobalVariable('user', envUsername);
        if (envPassword) setGlobalVariable('password', envPassword);
      }

      console.log('Auto-filled authentication fields from environment variables');
    } else {
      console.log('No suitable environment variables found for auto-fill');
      // Fallback to default values if no environment variables found
      fillWithDefaultValues();
    }

    setShowAutoFillMenu(false);
  }, [enableGlobalAuth, getVariable, setGlobalVariable, getBestAuthVariables]);

  // Handle toggling global auth
  const handleToggleGlobalAuth = useCallback((e) => {
    const newEnableGlobalAuth = e.target.checked;
    setEnableGlobalAuth(newEnableGlobalAuth);

    console.log('Toggling global auth:', newEnableGlobalAuth);
    setGlobalVariable('enableGlobalAuth', newEnableGlobalAuth.toString());

    // Se estiver habilitando a autenticação global
    if (newEnableGlobalAuth) {
      // Verificar se já temos valores preenchidos
      if (!username || !password) {
        // Se não tiver valores, tenta preencher com variáveis de ambiente
        const { username: envUsername, password: envPassword } = getBestAuthVariables();

        if (envUsername || envPassword) {
          // Se encontrou variáveis de ambiente, usa elas
          if (envUsername) {
            setUsername(envUsername);
            setGlobalVariable('user', envUsername);
          }
          if (envPassword) {
            setPassword(envPassword);
            setGlobalVariable('password', envPassword);
          }

          console.log('Auto-filled from environment variables when enabling global auth');
        } else {
          // Se não encontrou variáveis de ambiente, usa valores padrão
          fillWithDefaultValues();
        }
      } else {
        // Se já tiver valores, apenas atualiza as variáveis globais
        setGlobalVariable('user', username);
        setGlobalVariable('password', password);
      }
    } else {
      // Mesmo quando desabilitado, manter as variáveis disponíveis
      console.log('Keeping global auth variables available');
      setGlobalVariable('user', username);
      setGlobalVariable('password', password);
    }
  }, [username, password, setGlobalVariable, setUsername, setPassword, getBestAuthVariables]);

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Global Authentication</h3>
        <div className="flex items-center space-x-4">
          <div className="relative" ref={autoFillMenuRef}>
            <button
              onClick={toggleAutoFillMenu}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
              title="Auto-fill options"
            >
              <span>Auto-fill</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAutoFillMenu && (
              <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg py-1 text-sm">
                <button
                  onClick={handleAutoFillDefault}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Default (admin/admin)
                </button>
                <button
                  onClick={handleAutoFillFromEnv}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  From Environment Variables
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableGlobalAuth"
              checked={enableGlobalAuth}
              onChange={handleToggleGlobalAuth}
              className="mr-2 h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="enableGlobalAuth" className="text-sm text-gray-700">
              Enable global authentication
            </label>
          </div>
        </div>
      </div>

      <div className={`space-y-4 ${!enableGlobalAuth ? 'opacity-70' : ''}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username (&#123;&#123;user&#125;&#125;)
          </label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter username"
            disabled={!enableGlobalAuth}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            This value will be used when &#123;&#123;user&#125;&#125; is referenced in requests
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password (&#123;&#123;password&#125;&#125;)
          </label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter password"
            disabled={!enableGlobalAuth}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            This value will be used when &#123;&#123;password&#125;&#125; is referenced in requests
          </p>
        </div>

        <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
          <p>
            <strong>Note:</strong> These credentials will be stored as global variables and can be used in any request by using the variables &#123;&#123;user&#125;&#125; and &#123;&#123;password&#125;&#125;.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalAuthSettings;

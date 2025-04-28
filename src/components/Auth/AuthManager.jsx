import { useState, useEffect, createContext, useContext } from 'react';

// Contexto para gerenciar autenticação
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [credentials, setCredentials] = useState(() => {
    // Carregar credenciais do localStorage, se existirem
    const savedCredentials = localStorage.getItem('auth_credentials');
    return savedCredentials ? JSON.parse(savedCredentials) : {};
  });

  // Salvar credenciais no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('auth_credentials', JSON.stringify(credentials));
  }, [credentials]);

  // Adicionar credenciais para um domínio específico
  const setDomainCredentials = (domain, username, password) => {
    setCredentials(prev => ({
      ...prev,
      [domain]: { username, password }
    }));
  };

  // Obter credenciais para um domínio específico
  const getDomainCredentials = (domain) => {
    return credentials[domain] || null;
  };

  // Remover credenciais para um domínio específico
  const removeDomainCredentials = (domain) => {
    setCredentials(prev => {
      const newCredentials = { ...prev };
      delete newCredentials[domain];
      return newCredentials;
    });
  };

  // Limpar todas as credenciais
  const clearAllCredentials = () => {
    setCredentials({});
  };

  return (
    <AuthContext.Provider
      value={{
        credentials,
        setDomainCredentials,
        getDomainCredentials,
        removeDomainCredentials,
        clearAllCredentials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Componente de modal para autenticação
const AuthModal = ({ isOpen, onClose, domain, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, password);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          The server at <span className="font-medium">{domain}</span> requires authentication.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

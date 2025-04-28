import { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthManager';
import { extractDomain } from '../../utils/requestRunner';

const AuthSettings = ({ url, onAuthChange }) => {
  const { getDomainCredentials, setDomainCredentials } = useAuth();
  const [authType, setAuthType] = useState('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);

  // Atualizar o domínio quando a URL mudar
  useEffect(() => {
    const newDomain = extractDomain(url);
    setDomain(newDomain || '');

    // Carregar credenciais salvas para este domínio
    if (newDomain) {
      const savedCredentials = getDomainCredentials(newDomain);
      if (savedCredentials) {
        setUsername(savedCredentials.username || '');
        setPassword(savedCredentials.password || '');
        setAuthType('basic');
        setSaveCredentials(true);
      }
    }
  }, [url, getDomainCredentials]);

  // Notificar o componente pai quando as configurações de autenticação mudarem
  useEffect(() => {
    let auth = null;

    if (authType === 'basic') {
      // Sempre enviar as credenciais, mesmo que vazias
      // Não substituir as variáveis aqui, isso será feito no requestRunner
      auth = {
        username: username || '',
        password: password || '',
        // Indicar que os valores podem conter variáveis de ambiente
        containsVariables: username.includes('{{') || password.includes('{{')
      };

      console.log('Configurando autenticação básica:', {
        username: username || '[vazio]',
        password: password ? '[preenchido]' : '[vazio]',
        containsVariables: username.includes('{{') || password.includes('{{')
      });
    }

    onAuthChange(auth);

    // Salvar credenciais se solicitado
    if (saveCredentials && domain && authType === 'basic' && (username || password)) {
      setDomainCredentials(domain, username, password);
    }
  }, [authType, username, password, saveCredentials, domain, onAuthChange, setDomainCredentials]);

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-md font-medium mb-3">Authentication</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type
        </label>
        <select
          value={authType}
          onChange={(e) => setAuthType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="none">No Auth</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {authType === 'basic' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="{{user}}"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="{{password}}"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="saveCredentials"
              checked={saveCredentials}
              onChange={(e) => setSaveCredentials(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="saveCredentials" className="text-sm text-gray-700">
              Save credentials for this domain
            </label>
          </div>

          {domain && (
            <div className="text-xs text-gray-500 mb-4">
              Credentials will be saved for: <span className="font-medium">{domain}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuthSettings;

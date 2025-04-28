/**
 * Utilitário para contornar problemas de CORS ao fazer requisições
 *
 * Este utilitário modifica URLs para usar o proxy configurado no servidor de desenvolvimento
 * ou um proxy CORS público quando em produção
 */

/**
 * Converte uma URL externa para usar o proxy local
 * @param {string} url - URL original da requisição
 * @returns {string} URL modificada para usar o proxy
 */
export const proxyUrl = (url) => {
  try {
    // Se a URL não for válida, retorna a URL original
    if (!url || typeof url !== 'string') {
      return url;
    }

    // Se a URL já começa com /api-gateway, retorna como está
    if (url.startsWith('/api-gateway')) {
      return url;
    }

    // Tenta criar um objeto URL para validar a URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      // Se não for uma URL válida, pode ser um caminho relativo
      console.log('URL não é válida, tratando como caminho relativo:', url);
      // Se não começa com /, adiciona
      const path = url.startsWith('/') ? url : '/' + url;
      return `/api-gateway${path}`;
    }

    // Para URLs completas, adiciona o prefixo /api-gateway
    // Mantém o caminho e a query string
    const apiPath = `/api-gateway${urlObj.pathname}${urlObj.search || ''}`;
    console.log('Convertendo URL para proxy:', url, '->', apiPath);
    return apiPath;
  } catch (error) {
    console.error('Erro ao processar URL para proxy:', error);
    return url; // Retorna a URL original em caso de erro
  }
};

/**
 * Modifica os cabeçalhos para trabalhar com o proxy CORS
 * @param {Object} headers - Cabeçalhos originais
 * @returns {Object} Cabeçalhos modificados
 */
export const proxyHeaders = (headers = {}) => {
  // Cria uma cópia dos cabeçalhos para não modificar o objeto original
  const modifiedHeaders = { ...headers };

  // Adiciona cabeçalhos que podem ajudar com CORS
  modifiedHeaders['X-Requested-With'] = 'XMLHttpRequest';

  return modifiedHeaders;
};

/**
 * Função para fazer requisições HTTP contornando problemas de CORS
 * @param {Object} options - Opções da requisição
 * @returns {Promise} Promise com o resultado da requisição
 */
export const corsRequest = async (options) => {
  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = options;

  // Usa o proxy para a URL
  const proxiedUrl = proxyUrl(url);

  // Modifica os cabeçalhos
  const proxiedHeaders = proxyHeaders(headers);

  try {
    // Configura o timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Faz a requisição
    const response = await fetch(proxiedUrl, {
      method,
      headers: proxiedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    // Limpa o timeout
    clearTimeout(timeoutId);

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Retorna os dados da resposta
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('Erro na requisição CORS:', error);
    throw error;
  }
};

export default corsRequest;

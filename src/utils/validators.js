// Função para verificar se um valor é numérico
export const isNumericValue = (value) => {
  if (value === null || value === undefined) return false;
  return !isNaN(Number(value));
};

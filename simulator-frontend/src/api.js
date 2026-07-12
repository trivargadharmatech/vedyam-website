export const getApiBase = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://127.0.0.1:8000' : 'https://vijayyh-vedyamchatbot1-0-0.hf.space';
};

export const getApiBase = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // Use the Render backend URL for production so auth and database routes work!
  return isLocal ? 'http://127.0.0.1:8000' : 'https://vedyam-backend.onrender.com';
};

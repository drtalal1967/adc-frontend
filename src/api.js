import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://adcbackend-production.up.railway.app/api';
const API = axios.create({
  baseURL: BASE_URL,
});

// Robustly derive the backend base URL (removing /api or /api/ and ensuring absolute URL)
const getBackendUrl = () => {
  if (BASE_URL.startsWith('http')) return BASE_URL.replace(/\/api\/?$/, '');
  // Default development environment handles port 5000 for backend
  if (window.location.port === '5173') return 'http://localhost:5000';
  return window.location.origin;
};

export const BACKEND_URL = getBackendUrl();
export const REFRESHED_BACKEND_URL = BACKEND_URL; // Maintain for backward compatibility

// Add a request interceptor to add the JWT token to the headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

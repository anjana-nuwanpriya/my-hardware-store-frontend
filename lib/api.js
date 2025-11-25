import axios from 'axios';
import offlineStorage from './offlineStorage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!navigator.onLine || error.message === 'Network Error') {
      const url = error.config.url;
      
      if (error.config.method === 'get') {
        if (url.includes('/products')) {
          const products = await offlineStorage.getAll('products');
          return { data: { products } };
        }
        if (url.includes('/customers')) {
          const customers = await offlineStorage.getAll('customers');
          return { data: { customers } };
        }
      }
      
      if (['post', 'put', 'patch'].includes(error.config.method)) {
        await offlineStorage.addToSyncQueue(
          `${error.config.method}_${url}`,
          error.config.data
        );
        return { data: { queued: true, message: 'Request queued for sync' } };
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

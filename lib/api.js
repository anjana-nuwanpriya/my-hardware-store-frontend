import axios from 'axios';
import offlineStorage from './offlineStorage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
    if (typeof window !== 'undefined' && (!navigator.onLine || error.message === 'Network Error')) {
      const url = error.config.url;
      
      if (error.config.method === 'get') {
        if (url.includes('/products')) {
          const products = await offlineStorage.getAll('products');
          return { data: products };
        }
        if (url.includes('/customers')) {
          const customers = await offlineStorage.getAll('customers');
          return { data: customers };
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

// Create a wrapper object with methods to match your usage
const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),
};

export default api;
export { apiClient };
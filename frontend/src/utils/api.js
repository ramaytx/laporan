import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://laporan.nusapulsa.id/api',
  withCredentials: true, // For refresh token cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh & error handling
api.interceptors.response.use(
  (response) => response.data, // Simplify returning only data
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized (Token expired) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        if (data && data.data?.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Generic error handling
    if (error.response && error.response.status >= 500) {
        Swal.fire('Error', 'Terjadi kesalahan pada server (500).', 'error');
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

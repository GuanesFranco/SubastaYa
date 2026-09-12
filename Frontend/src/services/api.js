import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5058/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Token vencido o inválido (Mover antes de procesar detail)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }

      const data = error.response.data || {};
      
      if (data.errors) {
        const firstErrorKey = Object.keys(data.errors)[0];
        const validationError = new Error(data.errors[firstErrorKey][0]);
        validationError.status = error.response.status;
        return Promise.reject(validationError);
      }

      if (data.detail) {
        const customError = new Error(data.detail);
        customError.status = error.response.status;
        return Promise.reject(customError);
      }
      
      const genericError = new Error('Ocurrió un error en el servidor');
      genericError.status = error.response.status;
      return Promise.reject(genericError);
    }
    
    // Error genérico (red, timeout, etc)
    return Promise.reject(new Error('Ocurrió un error inesperado al conectar con el servidor.'));
  }
);

export default api;

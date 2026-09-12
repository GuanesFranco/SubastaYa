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
    if (error.response && error.response.data) {
      const data = error.response.data;

      // Errores de validación (ValidationProblemDetails)
      if (data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(' ');
        return Promise.reject(new Error(errorMessages));
      }

      // Errores de Dominio (ProblemDetails)
      if (data.detail) {
        return Promise.reject(new Error(data.detail));
      }
    }
    
    // Error genérico (red, timeout, etc)
    return Promise.reject(new Error('Ocurrió un error inesperado al conectar con el servidor.'));
  }
);

export default api;

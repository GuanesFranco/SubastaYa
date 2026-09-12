import axios from 'axios';
import { TIPOS_ERROR, clasificarError, crearError } from '../utils/errores';

const api = axios.create({
  baseURL: 'http://localhost:5058/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const HUB_URL = api.defaults.baseURL.replace('/api/v1', '') + '/hubs/auctions';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function aCamelCase(clave) {
  if (!clave) return clave;
  return clave.charAt(0).toLowerCase() + clave.slice(1);
}

function aplanarErrores(errors) {
  const resultado = {};
  Object.entries(errors).forEach(([campo, mensajes]) => {
    const lista = Array.isArray(mensajes) ? mensajes : [String(mensajes)];
    if (lista.length > 0) resultado[aCamelCase(campo)] = lista[0];
  });
  return resultado;
}

function cerrarSesionYRedirigir() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(crearError('', { kind: TIPOS_ERROR.CANCELADO }));
    }

    if (!error.response) {
      return Promise.reject(crearError('', { kind: TIPOS_ERROR.RED }));
    }

    const { status, data } = error.response;
    const cuerpo = data || {};
    const kind = clasificarError(status, cuerpo);

    if (kind === TIPOS_ERROR.NO_AUTORIZADO) {
      cerrarSesionYRedirigir();
      return Promise.reject(crearError('', { status, kind }));
    }

    if (kind === TIPOS_ERROR.VALIDACION) {
      const errores = aplanarErrores(cuerpo.errors);
      const primero = Object.values(errores)[0];
      return Promise.reject(crearError(primero, { status, kind, errores }));
    }

    return Promise.reject(crearError(cuerpo.detail || cuerpo.title, { status, kind }));
  }
);

export default api;

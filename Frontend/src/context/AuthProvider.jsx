import React, { useCallback, useMemo, useState } from 'react';
import api from '../services/api';
import AuthContext from './authContext';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'user';

function limpiarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

function leerSesionGuardada() {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    if (!token || !guardado) return null;
    return JSON.parse(guardado);
  } catch (err) {
    console.error('Sesión guardada inválida', err);
    limpiarSesion();
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(leerSesionGuardada);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/sessions', { email, password });
    const { token, id: usuarioId, email: userEmail, nombre } = response.data;
    const datos = { usuarioId, email: userEmail, nombre };

    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datos));
    setUser(datos);
    return datos;
  }, []);

  const register = useCallback(async (email, password, nombre) => {
    await api.post('/users', { email, password, nombre });
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    limpiarSesion();
    setUser(null);
  }, []);

  const valor = useMemo(() => ({
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user)
  }), [user, login, register, logout]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

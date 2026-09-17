import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastContext from '../context/toastContext';
import './Toast.css';

const DURACION_POR_DEFECTO = 5000;
const DURACION_SALIDA = 200;
const MAXIMO_VISIBLES = 4;

const ICONOS = {
  exito: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  aviso: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5l7.5 13H2.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 8v4M10 14.2v.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9v5M10 6.2v.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
};

let contador = 0;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const quitar = useCallback((id) => {
    const timers = timersRef.current;
    clearTimeout(timers.get(id));
    timers.delete(id);
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saliendo: true } : t)));
    const salida = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURACION_SALIDA);
    timers.set(`salida-${id}`, salida);
  }, []);

  const mostrar = useCallback((mensaje, tipo = 'info', { duracion = DURACION_POR_DEFECTO } = {}) => {
    contador += 1;
    const id = contador;
    setToasts((prev) => {
      const siguientes = [...prev, { id, mensaje, tipo, saliendo: false }];
      return siguientes.slice(-MAXIMO_VISIBLES);
    });
    if (duracion > 0) {
      const timer = setTimeout(() => quitar(id), duracion);
      timersRef.current.set(id, timer);
    }
    return id;
  }, [quitar]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const valor = useMemo(() => ({
    mostrar,
    quitar,
    exito: (mensaje, opciones) => mostrar(mensaje, 'exito', opciones),
    error: (mensaje, opciones) => mostrar(mensaje, 'error', opciones),
    aviso: (mensaje, opciones) => mostrar(mensaje, 'aviso', opciones),
    info: (mensaje, opciones) => mostrar(mensaje, 'info', opciones)
  }), [mostrar, quitar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.tipo}${toast.saliendo ? ' toast--saliendo' : ''}`}
            role={toast.tipo === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__icono">{ICONOS[toast.tipo] || ICONOS.info}</span>
            <span className="toast__mensaje">{toast.mensaje}</span>
            <button
              type="button"
              className="toast__cerrar"
              onClick={() => quitar(toast.id)}
              aria-label="Cerrar notificación"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

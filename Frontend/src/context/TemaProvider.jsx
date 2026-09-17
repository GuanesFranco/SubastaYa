import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TemaContext from './temaContext';

const CLAVE_TEMA = 'tema';
const TEMA_POR_DEFECTO = 'dark';
const TEMAS = ['dark', 'light'];
const DURACION_CAMBIO = 300;

function leerTemaGuardado() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return TEMAS.includes(guardado) ? guardado : TEMA_POR_DEFECTO;
  } catch {
    return TEMA_POR_DEFECTO;
  }
}

export default function TemaProvider({ children }) {
  const [tema, setTema] = useState(leerTemaGuardado);
  const temporizadorRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      return;
    }
  }, [tema]);

  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  const alternar = useCallback(() => {
    const raiz = document.documentElement;
    raiz.classList.add('tema-cambiando');
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(() => raiz.classList.remove('tema-cambiando'), DURACION_CAMBIO);
    setTema((actual) => (actual === 'dark' ? 'light' : 'dark'));
  }, []);

  const valor = useMemo(() => ({ tema, esOscuro: tema === 'dark', alternar }), [tema, alternar]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

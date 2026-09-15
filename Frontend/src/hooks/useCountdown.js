import { useEffect, useState } from 'react';
import { descomponerDuracion } from '../utils/formato';

const UN_MINUTO = 60 * 1000;
const CINCO_MINUTOS = 5 * UN_MINUTO;
const UNA_HORA = 60 * UN_MINUTO;
const UN_DIA = 24 * UNA_HORA;

const suscriptores = new Set();
let intervalo = null;

function suscribir(callback) {
  suscriptores.add(callback);
  if (intervalo === null) {
    intervalo = setInterval(() => {
      const ahora = Date.now();
      suscriptores.forEach((s) => s(ahora));
    }, 1000);
  }
  return () => {
    suscriptores.delete(callback);
    if (suscriptores.size === 0 && intervalo !== null) {
      clearInterval(intervalo);
      intervalo = null;
    }
  };
}

export default function useCountdown(fechaFin, activo = true) {
  const [ahora, setAhora] = useState(() => Date.now());
  const habilitado = Boolean(fechaFin) && activo;

  useEffect(() => {
    if (!habilitado) return undefined;
    return suscribir(setAhora);
  }, [habilitado]);

  const fin = fechaFin ? new Date(fechaFin).getTime() : NaN;
  const ms = habilitado && !Number.isNaN(fin) ? fin - ahora : null;
  const partes = descomponerDuracion(ms || 0);

  return {
    ms,
    ...partes,
    terminado: ms !== null && ms <= 0,
    ultimoMinuto: ms !== null && ms > 0 && ms < UN_MINUTO,
    critico: ms !== null && ms >= UN_MINUTO && ms < CINCO_MINUTOS,
    proximo: ms !== null && ms >= CINCO_MINUTOS && ms < UNA_HORA,
    lejano: ms !== null && ms > UN_DIA
  };
}

export function useAhora(habilitado = true) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!habilitado) return undefined;
    return suscribir(setAhora);
  }, [habilitado]);

  return ahora;
}

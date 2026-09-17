import { useCallback, useEffect, useState } from 'react';
import useLatest from './useLatest';
import { esCancelacion } from '../utils/errores';

export const ESTADOS_RECURSO = Object.freeze({
  CARGANDO: 'cargando',
  RECARGANDO: 'recargando',
  OK: 'ok',
  ERROR: 'error'
});

export default function useRecurso(cargar, deps, { conservar = true, grupo = null } = {}) {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState({ clave: null, grupo: null, datos: null, error: null });
  const cargarRef = useLatest(cargar);

  const clave = JSON.stringify([...deps, version]);

  useEffect(() => {
    const controlador = new AbortController();
    let cancelado = false;

    Promise.resolve()
      .then(() => cargarRef.current(controlador.signal))
      .then((datos) => {
        if (!cancelado) setResultado({ clave, grupo, datos, error: null });
      })
      .catch((error) => {
        if (cancelado || esCancelacion(error)) return;
        setResultado((prev) => ({
          clave,
          grupo,
          datos: conservar && prev.grupo === grupo ? prev.datos : null,
          error
        }));
      });

    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [clave, grupo, conservar, cargarRef]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const resuelto = resultado.clave === clave;
  const tieneDatosPrevios = conservar && resultado.datos != null && resultado.grupo === grupo;

  let estado;
  if (!resuelto) estado = tieneDatosPrevios ? ESTADOS_RECURSO.RECARGANDO : ESTADOS_RECURSO.CARGANDO;
  else if (resultado.error) estado = ESTADOS_RECURSO.ERROR;
  else estado = ESTADOS_RECURSO.OK;

  const datos = resuelto || tieneDatosPrevios ? resultado.datos : null;
  const error = resuelto ? resultado.error : null;

  return {
    estado,
    datos,
    error,
    recargar,
    cargando: estado === ESTADOS_RECURSO.CARGANDO,
    recargando: estado === ESTADOS_RECURSO.RECARGANDO,
    ocupado: estado === ESTADOS_RECURSO.CARGANDO || estado === ESTADOS_RECURSO.RECARGANDO
  };
}

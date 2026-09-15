import { useCallback, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { HUB_URL } from '../services/api';
import useLatest from './useLatest';

export const ESTADOS_CONEXION = Object.freeze({
  CONECTANDO: 'conectando',
  CONECTADO: 'conectado',
  RECONECTANDO: 'reconectando',
  DESCONECTADO: 'desconectado'
});

const ignorar = () => undefined;

export default function useHubConexion({ clave, habilitado = true, unirse, salir, handlers }) {
  const [intento, setIntento] = useState(0);
  const [conexion, setConexion] = useState({ clave: null, estado: ESTADOS_CONEXION.CONECTANDO });
  const handlersRef = useLatest(handlers);
  const unirseRef = useLatest(unirse);
  const salirRef = useLatest(salir);

  const claveEfectiva = `${clave}:${intento}`;

  useEffect(() => {
    if (!habilitado) return undefined;

    let cancelado = false;
    const salirDelGrupo = salirRef.current;
    const actualizar = (estado) => {
      if (!cancelado) setConexion({ clave: claveEfectiva, estado });
    };
    const emitir = (nombre) => (...args) => {
      if (cancelado) return;
      const fn = handlersRef.current ? handlersRef.current[nombre] : null;
      if (typeof fn === 'function') fn(...args);
    };

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .build();

    conn.on('BidPlaced', emitir('onBidPlaced'));
    conn.on('AuctionExtended', emitir('onAuctionExtended'));
    conn.on('AuctionClosed', emitir('onAuctionClosed'));

    conn.onreconnecting(() => actualizar(ESTADOS_CONEXION.RECONECTANDO));
    conn.onreconnected(() => {
      if (cancelado) return;
      Promise.resolve(unirseRef.current(conn))
        .catch(ignorar)
        .finally(() => {
          actualizar(ESTADOS_CONEXION.CONECTADO);
          emitir('onReconnected')();
        });
    });
    conn.onclose(() => actualizar(ESTADOS_CONEXION.DESCONECTADO));

    conn.start()
      .then(() => {
        if (cancelado) return null;
        return unirseRef.current(conn);
      })
      .then(() => actualizar(ESTADOS_CONEXION.CONECTADO))
      .catch(() => actualizar(ESTADOS_CONEXION.DESCONECTADO));

    return () => {
      cancelado = true;
      const despedida = conn.state === signalR.HubConnectionState.Connected
        ? Promise.resolve(salirDelGrupo(conn)).catch(ignorar)
        : Promise.resolve();
      despedida.finally(() => conn.stop().catch(ignorar));
    };
  }, [claveEfectiva, habilitado, handlersRef, unirseRef, salirRef]);

  const reconectar = useCallback(() => setIntento((i) => i + 1), []);

  const estadoConexion = conexion.clave === claveEfectiva ? conexion.estado : ESTADOS_CONEXION.CONECTANDO;

  return { estadoConexion, reconectar };
}

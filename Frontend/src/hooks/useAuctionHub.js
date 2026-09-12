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

export default function useAuctionHub(subastaId, handlers) {
  const [intento, setIntento] = useState(0);
  const [conexion, setConexion] = useState({ clave: null, estado: ESTADOS_CONEXION.CONECTANDO });
  const handlersRef = useLatest(handlers);

  const clave = `${subastaId}:${intento}`;

  useEffect(() => {
    if (!subastaId) return undefined;

    let cancelado = false;
    const actualizar = (estado) => {
      if (!cancelado) setConexion({ clave, estado });
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
      conn.invoke('JoinAuctionGroup', subastaId)
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
        return conn.invoke('JoinAuctionGroup', subastaId);
      })
      .then(() => actualizar(ESTADOS_CONEXION.CONECTADO))
      .catch(() => actualizar(ESTADOS_CONEXION.DESCONECTADO));

    return () => {
      cancelado = true;
      const salir = conn.state === signalR.HubConnectionState.Connected
        ? conn.invoke('LeaveAuctionGroup', subastaId).catch(ignorar)
        : Promise.resolve();
      salir.finally(() => conn.stop().catch(ignorar));
    };
  }, [subastaId, clave, handlersRef]);

  const reconectar = useCallback(() => setIntento((i) => i + 1), []);

  const estadoConexion = conexion.clave === clave ? conexion.estado : ESTADOS_CONEXION.CONECTANDO;

  return { estadoConexion, reconectar };
}

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import useRecurso from '../hooks/useRecurso';
import useCatalogoHub from '../hooks/useCatalogoHub';
import SaldoContext from './saldoContext';

const ESPERA_AGRUPADA = 400;

export default function SaldoProvider({ children }) {
  const { user } = useAuth();
  const usuarioId = user ? user.usuarioId : null;
  const temporizadorRef = useRef(null);

  const billetera = useRecurso(
    (signal) => (usuarioId ? api.get('/wallets/me', { signal }).then((res) => res.data) : Promise.resolve(null)),
    [usuarioId]
  );

  const { datos, error, estado, cargando, recargando, ocupado, recargar } = billetera;

  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  const programarRecarga = useCallback(() => {
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(recargar, ESPERA_AGRUPADA);
  }, [recargar]);

  useCatalogoHub({
    onBidPlaced: programarRecarga,
    onAuctionClosed: programarRecarga,
    onReconnected: programarRecarga
  }, Boolean(usuarioId));

  const valor = useMemo(
    () => ({ datos, error, estado, cargando, recargando, ocupado, recargar }),
    [datos, error, estado, cargando, recargando, ocupado, recargar]
  );

  return <SaldoContext.Provider value={valor}>{children}</SaldoContext.Provider>;
}

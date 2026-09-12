import React, { useState } from 'react';
import api from '../services/api';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import useToast from '../hooks/useToast';
import { formatoARS, formatoFechaHora } from '../utils/formato';
import { mensajeDeError } from '../utils/errores';

const PAGE_SIZE = 10;
const BALANCE_VACIO = { saldoTotal: 0, saldoRetenido: 0, saldoDisponible: 0 };

const ETIQUETAS_TIPO = {
  Deposito: 'Depósito',
  Liberacion: 'Liberación',
  Retencion: 'Retención',
  Debito: 'Débito'
};

const getTipoColor = (tipo) => {
  switch (tipo) {
    case 'Deposito':
    case 'Liberacion':
      return 'var(--success)';
    case 'Retencion':
      return 'var(--warning)';
    case 'Debito':
      return 'var(--danger)';
    default:
      return 'var(--text-main)';
  }
};

const esEgreso = (tipo) => tipo === 'Retencion' || tipo === 'Debito';

export default function Billetera() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [montoDeposito, setMontoDeposito] = useState('');
  const [depositando, setDepositando] = useState(false);

  const balance = useRecurso(
    (signal) => api.get('/wallets/me', { signal }).then((res) => res.data),
    []
  );

  const movimientos = useRecurso(async (signal) => {
    const res = await api.get('/wallets/me/transactions', { params: { page, pageSize: PAGE_SIZE }, signal });
    const paginas = res.data.totalPages || 0;
    if (paginas > 0 && page > paginas) setPage(paginas);
    return res.data;
  }, [page]);

  const handleDeposito = async (e) => {
    e.preventDefault();
    const monto = Number(montoDeposito);
    if (!monto || monto <= 0) return;

    setDepositando(true);
    try {
      await api.post('/wallets/me/deposits', { monto });
      toast.exito(`Acreditamos ${formatoARS(monto)} en tu billetera.`);
      setMontoDeposito('');
      balance.recargar();
      if (page === 1) movimientos.recargar();
      else setPage(1);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setDepositando(false);
    }
  };

  const saldos = balance.datos || BALANCE_VACIO;
  const transacciones = movimientos.datos ? movimientos.datos.items || [] : [];
  const totalPages = movimientos.datos ? movimientos.datos.totalPages || 0 : 0;
  const totalItems = movimientos.datos ? movimientos.datos.totalItems || 0 : 0;

  const renderSaldos = () => {
    if (balance.cargando) {
      return <Skeleton variante="metricas" cantidad={3} etiqueta="Cargando saldos" />;
    }

    if (balance.error && !balance.datos) {
      return <EstadoError compacto error={balance.error} onReintentar={balance.recargar} titulo="No pudimos cargar tus saldos" />;
    }

    return (
      <div className="contenido-ocupado" aria-busy={balance.recargando} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-primary)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Saldo total</p>
          <h2 className="tabular" style={{ fontSize: '2.5rem' }}>{formatoARS(saldos.saldoTotal)}</h2>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Disponible para ofertar</p>
          <h2 className="tabular" style={{ fontSize: '2.5rem', color: 'var(--success)' }}>{formatoARS(saldos.saldoDisponible)}</h2>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Retenido en ofertas</p>
          <h2 className="tabular" style={{ fontSize: '2.5rem', color: 'var(--warning)' }}>{formatoARS(saldos.saldoRetenido)}</h2>
        </div>
      </div>
    );
  };

  const renderMovimientos = () => {
    if (movimientos.cargando) {
      return <Skeleton variante="filas" cantidad={5} columnas={4} etiqueta="Cargando movimientos" />;
    }

    if (movimientos.error && !movimientos.datos) {
      return <EstadoError error={movimientos.error} onReintentar={movimientos.recargar} titulo="No pudimos cargar tus movimientos" />;
    }

    if (transacciones.length === 0) {
      return (
        <EstadoVacio
          compacto
          icono="historial"
          titulo="Todavía no hay movimientos"
          descripcion="Cargá saldo para empezar a ofertar. Cada depósito, retención y liberación va a quedar registrado acá."
        />
      );
    }

    return (
      <>
        {movimientos.error && (
          <EstadoError compacto error={movimientos.error} onReintentar={movimientos.recargar} titulo="No pudimos actualizar los movimientos" />
        )}
        <div className="glass-panel contenido-ocupado" aria-busy={movimientos.recargando} style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '560px' }}>
              <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Fecha</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Tipo</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Detalle</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((tx) => (
                  <tr key={tx.id}>
                    <td className="tabular" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', whiteSpace: 'nowrap' }}>
                      {formatoFechaHora(tx.fecha)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: getTipoColor(tx.tipo), fontWeight: 'bold' }}>
                        {ETIQUETAS_TIPO[tx.tipo] || tx.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                      {tx.descripcion}
                    </td>
                    <td className="tabular" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', textAlign: 'right', fontWeight: 'bold', color: getTipoColor(tx.tipo), whiteSpace: 'nowrap' }}>
                      {esEgreso(tx.tipo) ? '-' : '+'}
                      {formatoARS(tx.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Paginador
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onChange={setPage}
          disabled={movimientos.ocupado}
        />
      </>
    );
  };

  return (
    <div className="layout-container" style={{ maxWidth: 'var(--container-narrow)' }}>
      <h1 style={{ marginBottom: '2rem' }}>Mi Billetera</h1>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Cargar saldo</h3>
        <form onSubmit={handleDeposito} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="number"
            className="input-field"
            style={{ flex: '1 1 200px' }}
            placeholder="Monto a depositar"
            value={montoDeposito}
            onChange={(e) => setMontoDeposito(e.target.value)}
            min="1"
            step="0.01"
            required
            aria-label="Monto a depositar"
            disabled={depositando}
          />
          <button type="submit" className="btn btn-primary" disabled={depositando || !montoDeposito}>
            {depositando ? 'Procesando...' : 'Depositar'}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        {renderSaldos()}
      </div>

      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-muted)' }}>Últimos movimientos</h2>

      {renderMovimientos()}
    </div>
  );
}

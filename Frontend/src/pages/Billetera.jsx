import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Paginador from '../components/Paginador';

const PAGE_SIZE = 10;

export default function Billetera() {
  const [balance, setBalance] = useState({ saldoTotal: 0, saldoRetenido: 0, saldoDisponible: 0 });
  const [transacciones, setTransacciones] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [montoDeposito, setMontoDeposito] = useState('');
  const [depositando, setDepositando] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });
  const [error, setError] = useState('');

  const fetchBalance = async () => {
    try {
      // Como aclaró Enzo, /wallets/me devuelve un objeto plano
      const resBalance = await api.get('/wallets/me');
      setBalance(resBalance.data);
    } catch (err) {
      setError('Error al cargar la billetera: ' + err.message);
    }
  };

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      // /wallets/me/transactions sí es paginado
      const res = await api.get(`/wallets/me/transactions?page=${page}&pageSize=${PAGE_SIZE}`);
      const paginas = res.data.totalPages || 0;

      if (paginas > 0 && page > paginas) {
        setPage(paginas);
        return;
      }

      setTransacciones(res.data.items || []);
      setTotalPages(paginas);
      setTotalItems(res.data.totalItems || 0);
    } catch (err) {
      setError('Error al cargar los movimientos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposito = async (e) => {
    e.preventDefault();
    if (!montoDeposito || Number(montoDeposito) <= 0) return;

    setDepositando(true);
    try {
      await api.post('/wallets/me/deposits', { monto: Number(montoDeposito) });
      setToast({ show: true, msg: '¡Depósito exitoso!', type: 'success' });
      setMontoDeposito('');
      fetchBalance();
      if (page === 1) fetchMovimientos();
      else setPage(1);
    } catch (err) {
      setToast({ show: true, msg: err.message || 'Error al depositar', type: 'error' });
    } finally {
      setDepositando(false);
      setTimeout(() => setToast({ show: false, msg: '', type: '' }), 5000);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    fetchMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Deposito': return 'var(--success)';
      case 'Liberacion': return 'var(--success)';
      case 'Retencion': return 'var(--warning)';
      case 'Debito': return 'var(--danger)';
      default: return 'var(--text-main)';
    }
  };

  return (
    <div className="layout-container" style={{ maxWidth: '900px' }}>
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.msg}
        </div>
      )}

      <h1 style={{ marginBottom: '2rem' }}>Mi Billetera</h1>

      <div className="glass-panel" style={{ marginTop: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ marginBottom: '1rem' }}>Cargar Saldo</h3>
          <form onSubmit={handleDeposito} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Monto a depositar..." 
              value={montoDeposito}
              onChange={(e) => setMontoDeposito(e.target.value)}
              min="1"
              step="0.01"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={depositando}>
              {depositando ? 'Procesando...' : 'Depositar'}
            </button>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-primary)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Saldo Total</p>
          <h2 style={{ fontSize: '2.5rem' }}>{formatter.format(balance.saldoTotal)}</h2>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Disponible para Pujar</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--success)' }}>{formatter.format(balance.saldoDisponible)}</h2>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Retenido en Pujas</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--warning)' }}>{formatter.format(balance.saldoRetenido)}</h2>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-muted)' }}>Últimos Movimientos</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando movimientos...</div>
      ) : (
        <>
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            {transacciones.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay movimientos registrados.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                    <tr key={tx.id} style={{ transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        {new Date(tx.fecha).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        {/* Enums viajan como string! */}
                        <span style={{ color: getTipoColor(tx.tipo), fontWeight: 'bold' }}>
                          {tx.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                        {tx.descripcion}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', textAlign: 'right', fontWeight: 'bold', color: getTipoColor(tx.tipo) }}>
                        {(tx.tipo === 'Retencion' || tx.tipo === 'Debito') ? '-' : '+'}
                        {formatter.format(tx.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Paginador
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SalaSubasta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subasta, setSubasta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para la puja
  const [montoPuja, setMontoPuja] = useState('');
  const [pujando, setPujando] = useState(false);

  // Estados visuales (Toasts y Countdown)
  const [tiempoRestante, setTiempoRestante] = useState('');
  const [isLastMinute, setIsLastMinute] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });
  
  const connectionRef = useRef(null);
  const fechaFinRef = useRef(null);

  const fetchSubasta = async () => {
    try {
      const res = await api.get(`/auctions/${id}`);
      setSubasta(res.data);
      fechaFinRef.current = new Date(res.data.fechaFin);
      
      // Auto-sugerencia
      const montoMinimo = (res.data.precioActual || res.data.precioBase) + res.data.incrementoMinimo;
      setMontoPuja(montoMinimo);
      
      fetchHistorial();
    } catch (err) {
      showToast(err.message || 'Error al cargar la subasta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async () => {
    try {
      // Historial es paginado
      const res = await api.get(`/auctions/${id}/bids?pageSize=50`);
      setHistorial(res.data.items || []);
    } catch (err) {
      console.error('Error al cargar historial', err);
    }
  };

  const setupSignalR = async () => {
    // Usamos el host de la API para el hub
    const hubUrl = api.defaults.baseURL.replace('/api/v1', '') + '/hubs/auctions';
    
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect()
      .build();

    conn.on('BidPlaced', (evento) => {
      // payload = { subastaId, pujaId, monto, fechaPuja, fechaFin, compradorId }
      setSubasta(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          precioActual: evento.monto,
          pujaLiderId: evento.pujaId,
          compradorLiderId: evento.compradorId,
          fechaFin: evento.fechaFin // Actualizar por si hubo anti-sniping
        };
      });
      fechaFinRef.current = new Date(evento.fechaFin);
      
      // Refetch de historial para obtener los nombres anonimizados
      fetchHistorial();
    });

    conn.on('AuctionExtended', () => {
      showToast('¡El tiempo se ha extendido por nuevas ofertas!', 'warning');
    });

    conn.on('AuctionClosed', (evento) => {
      setSubasta(prev => ({ ...prev, estado: evento.estado }));
      showToast(`¡Subasta Finalizada! Estado: ${evento.estado}`, 'success');
    });

    try {
      await conn.start();
      await conn.invoke('JoinAuctionGroup', Number(id));
      connectionRef.current = conn;
    } catch (err) {
      console.error('Error SignalR:', err);
    }
  };

  useEffect(() => {
    fetchSubasta();
    setupSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.invoke('LeaveAuctionGroup', Number(id))
          .catch(console.error)
          .finally(() => {
            connectionRef.current.stop();
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Lógica de Countdown (Calculando siempre contra Date.now() en UTC implícito)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!fechaFinRef.current || subasta?.estado !== 'Activa') return;
      
      const diff = fechaFinRef.current.getTime() - Date.now();
      if (diff <= 0) {
        setTiempoRestante('Finalizando...');
        setIsLastMinute(false);
        return;
      }

      setIsLastMinute(diff < 60000); // Alerta visual en el último minuto

      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTiempoRestante(`${horas}h ${minutos}m ${segundos}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [subasta?.estado]);

  const showToast = (msg, type) => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 5000);
  };

  const handlePujar = async (e) => {
    e.preventDefault();
    setPujando(true);
    try {
      // POST devuelve { pujaId, monto, fechaFin, tiempoExtendido }
      const res = await api.post(`/auctions/${id}/bids`, { monto: Number(montoPuja) });
      
      // Actualización optimista local sin esperar SignalR
      setSubasta(prev => ({
        ...prev,
        precioActual: res.data.monto,
        pujaLiderId: res.data.pujaId,
        compradorLiderId: user.usuarioId,
        fechaFin: res.data.fechaFin
      }));
      fechaFinRef.current = new Date(res.data.fechaFin);

      // Auto-sugerencia para la próxima
      setMontoPuja(res.data.monto + subasta.incrementoMinimo);

      if (res.data.tiempoExtendido) {
        showToast('¡Has extendido el tiempo de la subasta!', 'warning');
      } else {
        showToast('¡Oferta enviada exitosamente!', 'success');
      }

    } catch (err) {
      if (err.status === 409 || err.message?.toLowerCase().includes('concurrencia')) {
        showToast('Otra oferta superó la tuya, actualizá y reintentá.', 'error');
      } else {
        showToast(err.message || 'Error al enviar la oferta.', 'error');
      }
    } finally {
      setPujando(false);
    }
  };

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) return <div className="layout-container" style={{ textAlign: 'center' }}>Cargando subasta...</div>;
  if (!subasta) return <div className="layout-container">Subasta no encontrada.</div>;

  // Lógica inteligente de Liderazgo (usando la base de datos y no memoria local)
  const isLiderando = subasta.compradorLiderId === user.usuarioId;
  const isSuperado = subasta.compradorLiderId !== null && subasta.compradorLiderId !== user.usuarioId && historial.some(h => h.compradorId === user.usuarioId);
  
  const isActiva = subasta.estado === 'Activa';

  return (
    <div className="layout-container">
      {/* Sistema de Toasts Nativos CSS */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'warning' ? 'var(--warning)' : 'var(--success)',
          color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.msg}
        </div>
      )}

      <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)' }}>← Volver</button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Columna Izquierda: Detalles */}
        <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
          {isLastMinute && isActiva && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              border: '4px solid var(--danger)', pointerEvents: 'none',
              animation: 'pulse 1s infinite'
            }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{subasta.categoriaNombre || 'General'}</span>
            <span style={{ 
              background: isActiva ? 'var(--success)' : 'var(--text-muted)', 
              color: 'white', padding: '0.2rem 1rem', borderRadius: '1rem', fontWeight: 'bold' 
            }}>
              {subasta.estado}
            </span>
          </div>
          
          <h1 style={{ marginTop: '1rem', fontSize: '2.5rem' }}>{subasta.titulo}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '1.1rem' }}>{subasta.descripcion}</p>

          <div style={{ marginTop: '3rem', display: 'flex', gap: '3rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Precio Actual</p>
              <h2 style={{ fontSize: '3rem', color: isActiva ? 'var(--success)' : 'var(--text-main)' }}>
                {formatter.format(subasta.precioActual || subasta.precioBase)}
              </h2>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Tiempo Restante</p>
              <h2 style={{ fontSize: '3rem', color: isLastMinute ? 'var(--danger)' : 'var(--text-main)' }}>
                {isActiva ? tiempoRestante : '--:--:--'}
              </h2>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Puja */}
        <div>
          {/* Indicador Gigante Liderando/Superado */}
          {isLiderando && (
            <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'var(--success)', textAlign: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--success)', margin: 0 }}>¡Estás Liderando! 🏆</h2>
            </div>
          )}
          {isSuperado && (
            <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)', textAlign: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--danger)', margin: 0 }}>¡Te han Superado! ⚠️</h2>
            </div>
          )}

          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Realizar Oferta</h3>
            
            <form onSubmit={handlePujar}>
              <div className="form-group">
                <label className="form-label">Monto a ofertar (Mínimo sugerido: {formatter.format((subasta.precioActual || subasta.precioBase) + subasta.incrementoMinimo)})</label>
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ fontSize: '1.5rem', textAlign: 'center' }}
                  value={montoPuja} 
                  onChange={(e) => setMontoPuja(e.target.value)} 
                  disabled={!isActiva || pujando || subasta.vendedorId === user.usuarioId}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }} 
                disabled={!isActiva || pujando || subasta.vendedorId === user.usuarioId}
              >
                {pujando ? 'Enviando...' : (subasta.vendedorId === user.usuarioId ? 'Eres el Vendedor' : 'Pujar Ahora')}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ marginTop: '1rem', padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Historial de Pujas ({historial.length})</h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {historial.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No hay pujas aún.</p>
              ) : (
                historial.map(puja => (
                  <div key={puja.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{puja.compradorNombre}</span>
                    <span style={{ fontWeight: 'bold' }}>{formatter.format(puja.monto)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { box-shadow: inset 0 0 20px 5px rgba(239, 68, 68, 0.3); }
          100% { box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0.7); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

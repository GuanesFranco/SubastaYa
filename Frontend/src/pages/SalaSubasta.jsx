import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import api, { HUB_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import useCountdown from '../hooks/useCountdown';
import Skeleton from '../components/Skeleton';
import EstadoError from '../components/EstadoError';
import CountdownTimer from '../components/CountdownTimer';
import { formatoARS } from '../utils/formato';
import { mensajeDeError } from '../utils/errores';

const PUJAS_POR_TANDA = 10;

export default function SalaSubasta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [subasta, setSubasta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [totalPujas, setTotalPujas] = useState(0);
  const [pujasVisibles, setPujasVisibles] = useState(PUJAS_POR_TANDA);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [heParticipado, setHeParticipado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [montoPuja, setMontoPuja] = useState('');
  const [pujando, setPujando] = useState(false);

  const connectionRef = useRef(null);

  const countdown = useCountdown(subasta ? subasta.fechaFin : null, Boolean(subasta) && subasta.estado === 'Activa');
  const isLastMinute = countdown.ultimoMinuto;

  const fetchSubasta = async () => {
    try {
      const res = await api.get(`/auctions/${id}`);
      setSubasta(res.data);
      setErrorCarga(null);

      const montoMinimo = (res.data.precioActual || res.data.precioBase) + res.data.incrementoMinimo;
      setMontoPuja(montoMinimo);

      fetchHistorial();
    } catch (err) {
      setErrorCarga(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async (cantidad = pujasVisibles) => {
    try {
      setCargandoHistorial(true);
      const res = await api.get(`/auctions/${id}/bids?page=1&pageSize=${cantidad}`);
      const items = res.data.items || [];

      setHistorial(items);
      setTotalPujas(res.data.totalItems || 0);

      if (items.some(p => p.compradorId === user.usuarioId)) {
        setHeParticipado(true);
      }
    } catch (err) {
      console.error('Error al cargar historial', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const verMasPujas = () => {
    const siguiente = pujasVisibles + PUJAS_POR_TANDA;
    setPujasVisibles(siguiente);
    fetchHistorial(siguiente);
  };

  const reintentarCarga = () => {
    setLoading(true);
    setErrorCarga(null);
    fetchSubasta();
  };

  const setupSignalR = async () => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect()
      .build();

    conn.on('BidPlaced', (evento) => {
      setSubasta(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          precioActual: evento.monto,
          pujaLiderId: evento.pujaId,
          compradorLiderId: evento.compradorId,
          fechaFin: evento.fechaFin
        };
      });

      fetchHistorial();
    });

    conn.on('AuctionExtended', () => {
      toast.aviso('¡El tiempo se extendió por nuevas ofertas!');
    });

    conn.on('AuctionClosed', (evento) => {
      setSubasta(prev => ({ ...prev, estado: evento.estado }));
      toast.exito(`¡Subasta finalizada! Estado: ${evento.estado}`);
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

  const handlePujar = async (e) => {
    e.preventDefault();
    setPujando(true);
    try {
      const res = await api.post(`/auctions/${id}/bids`, { monto: Number(montoPuja) });

      setHeParticipado(true);

      setSubasta(prev => ({
        ...prev,
        precioActual: res.data.monto,
        pujaLiderId: res.data.pujaId,
        compradorLiderId: user.usuarioId,
        fechaFin: res.data.fechaFin
      }));

      setMontoPuja(res.data.monto + subasta.incrementoMinimo);

      if (res.data.tiempoExtendido) {
        toast.aviso('Tu oferta extendió el tiempo de la subasta.');
      } else {
        toast.exito('Oferta enviada. Ahora vas ganando.');
      }
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setPujando(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-container">
        <Skeleton variante="panel" lineas={4} etiqueta="Cargando subasta" />
      </div>
    );
  }

  if (errorCarga || !subasta) {
    return (
      <div className="layout-container">
        <EstadoError
          error={errorCarga}
          titulo={errorCarga && errorCarga.kind === 'noEncontrado' ? 'Esta subasta no existe' : undefined}
          onReintentar={errorCarga && errorCarga.kind !== 'noEncontrado' ? reintentarCarga : null}
          accion={<button type="button" className="btn" onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)' }}>Volver al catálogo</button>}
        />
      </div>
    );
  }

  const isLiderando = subasta.compradorLiderId === user.usuarioId;
  const isSuperado = heParticipado && subasta.compradorLiderId != null && subasta.compradorLiderId !== user.usuarioId;
  const isActiva = subasta.estado === 'Activa';
  const esVendedor = subasta.vendedorId === user.usuarioId;
  const montoMinimo = (subasta.precioActual || subasta.precioBase) + subasta.incrementoMinimo;

  return (
    <div className="layout-container">
      <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)' }}>← Volver</button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
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

          <div style={{ marginTop: '3rem', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Precio actual</p>
              <h2 className="tabular" style={{ fontSize: '3rem', color: isActiva ? 'var(--success)' : 'var(--text-main)' }}>
                {formatoARS(subasta.precioActual || subasta.precioBase)}
              </h2>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Tiempo restante</p>
              <h2 style={{ fontSize: '3rem' }}>
                <CountdownTimer fechaFin={subasta.fechaFin} estado={subasta.estado} tamano="lg" conIcono={false} />
              </h2>
            </div>
          </div>
        </div>

        <div>
          {isLiderando && (
            <div className="glass-panel" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', textAlign: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--success)', margin: 0 }}>¡Vas ganando! 🏆</h2>
            </div>
          )}
          {isSuperado && (
            <div className="glass-panel" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', textAlign: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--danger)', margin: 0 }}>¡Te superaron! ⚠️</h2>
            </div>
          )}

          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Realizar oferta</h3>

            <form onSubmit={handlePujar}>
              <div className="form-group">
                <label className="form-label" htmlFor="monto-puja">Monto a ofertar (mínimo sugerido: {formatoARS(montoMinimo)})</label>
                <input
                  id="monto-puja"
                  type="number"
                  className="input-field tabular"
                  style={{ fontSize: '1.5rem', textAlign: 'center' }}
                  value={montoPuja}
                  onChange={(e) => setMontoPuja(e.target.value)}
                  disabled={!isActiva || pujando || esVendedor}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
                disabled={!isActiva || pujando || esVendedor}
              >
                {pujando ? 'Enviando...' : (esVendedor ? 'Sos el vendedor' : 'Ofertar ahora')}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ marginTop: '1rem', padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Historial de ofertas ({historial.length}{totalPujas > historial.length ? ` de ${totalPujas}` : ''})
            </h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {historial.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Todavía no hay ofertas. Podés ser el primero.</p>
              ) : (
                historial.map(puja => (
                  <div key={puja.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{puja.compradorNombre}</span>
                    <span className="tabular" style={{ fontWeight: 'bold' }}>{formatoARS(puja.monto)}</span>
                  </div>
                ))
              )}
            </div>

            {totalPujas > historial.length && (
              <button
                type="button"
                className="btn"
                onClick={verMasPujas}
                disabled={cargandoHistorial}
                style={{
                  width: '100%', marginTop: '1rem', background: 'transparent',
                  border: '1px solid var(--glass-border)', color: 'var(--text-muted)'
                }}
              >
                {cargandoHistorial ? 'Cargando...' : `Ver más (${totalPujas - historial.length} restantes)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

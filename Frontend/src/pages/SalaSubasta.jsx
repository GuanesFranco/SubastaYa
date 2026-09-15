import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import useTitulo from '../hooks/useTitulo';
import useToast from '../hooks/useToast';
import useCountdown from '../hooks/useCountdown';
import useLatest from '../hooks/useLatest';
import useAuctionHub from '../hooks/useAuctionHub';
import useRecurso from '../hooks/useRecurso';
import Skeleton from '../components/Skeleton';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';
import EncabezadoSubasta from '../components/sala/EncabezadoSubasta';
import PanelEstadoParticipante from '../components/sala/PanelEstadoParticipante';
import PanelCierre from '../components/sala/PanelCierre';
import ConsolaPuja from '../components/sala/ConsolaPuja';
import HistorialPujas from '../components/sala/HistorialPujas';
import { mensajeDeError, TIPOS_ERROR } from '../utils/errores';
import { montoSugerido as calcularMontoSugerido, normalizarEstado } from '../utils/subastas';
import './SalaSubasta.css';

const PUJAS_POR_TANDA = 10;
const DURACION_EXITO = 1800;

function Sala({ subastaId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const usuarioId = user ? user.usuarioId : null;

  const [subasta, setSubasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [historial, setHistorial] = useState({ items: [], total: 0 });
  const [pujasVisibles, setPujasVisibles] = useState(PUJAS_POR_TANDA);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [heParticipado, setHeParticipado] = useState(false);

  const [montoManual, setMontoManual] = useState(null);
  const [pujando, setPujando] = useState(false);

  const [cierre, setCierre] = useState(null);
  const [alertaSuperado, setAlertaSuperado] = useState(0);
  const [extension, setExtension] = useState(null);
  const [exitoReciente, setExitoReciente] = useState(false);

  useTitulo(subasta ? subasta.titulo : 'Sala en vivo');

  const subastaRef = useLatest(subasta);
  const pujasVisiblesRef = useLatest(pujasVisibles);
  const fechaFinPreviaRef = useRef(null);
  const pujaEnCursoRef = useRef(false);
  const extensionPropiaRef = useRef(null);
  const exitoTimerRef = useRef(null);

  const saldo = useRecurso(
    (signal) => (user ? api.get('/wallets/me', { signal }).then((res) => res.data) : Promise.resolve(null)),
    [subastaId, usuarioId]
  );

  useEffect(() => () => clearTimeout(exitoTimerRef.current), []);

  const marcarExito = () => {
    clearTimeout(exitoTimerRef.current);
    setExitoReciente(true);
    exitoTimerRef.current = setTimeout(() => setExitoReciente(false), DURACION_EXITO);
  };

  const fetchSubasta = useCallback(async ({ silencioso = false } = {}) => {
    try {
      const res = await api.get(`/auctions/${subastaId}`);
      setSubasta(res.data);
      setErrorCarga(null);
    } catch (err) {
      if (!silencioso) setErrorCarga(err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [subastaId]);

  const fetchHistorial = useCallback(async (cantidad) => {
    try {
      const res = await api.get(`/auctions/${subastaId}/bids`, { params: { page: 1, pageSize: cantidad } });
      const items = res.data.items || [];
      setHistorial({ items, total: res.data.totalItems || 0 });
      if (items.some((p) => p.compradorId === usuarioId)) setHeParticipado(true);
    } catch (err) {
      console.error('Error al cargar historial', err);
    } finally {
      setCargandoHistorial(false);
    }
  }, [subastaId, usuarioId]);

  const cargarRef = useLatest(() => {
    fetchSubasta();
    fetchHistorial(PUJAS_POR_TANDA);
  });

  useEffect(() => {
    const cargar = cargarRef.current;
    Promise.resolve().then(cargar);
  }, [subastaId, cargarRef]);

  const { estadoConexion, reconectar } = useAuctionHub(subastaId, {
    onBidPlaced: (evento) => {
      const previa = subastaRef.current;
      const meSuperaron = previa
        && previa.compradorLiderId === usuarioId
        && evento.compradorId !== usuarioId;

      if (previa) fechaFinPreviaRef.current = previa.fechaFin;

      setSubasta((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          precioActual: evento.monto,
          pujaLiderId: evento.pujaId,
          compradorLiderId: evento.compradorId,
          fechaFin: evento.fechaFin
        };
      });

      if (meSuperaron) {
        setAlertaSuperado((k) => k + 1);
        toast.error('Te superaron. Hacé una nueva oferta para volver a liderar.');
        saldo.recargar();
      }

      fetchHistorial(pujasVisiblesRef.current);
    },
    onAuctionExtended: (evento) => {
      const referencia = fechaFinPreviaRef.current || (subastaRef.current ? subastaRef.current.fechaFin : null);
      const ms = referencia ? new Date(evento.nuevaFechaFin).getTime() - new Date(referencia).getTime() : 0;
      fechaFinPreviaRef.current = null;
      setSubasta((prev) => (prev ? { ...prev, fechaFin: evento.nuevaFechaFin } : prev));
      setExtension({ id: Date.now(), ms });
      const propia = pujaEnCursoRef.current || extensionPropiaRef.current === evento.nuevaFechaFin;
      if (!propia) toast.aviso('Se sumó tiempo por una oferta en el último minuto.');
    },
    onAuctionClosed: (evento) => {
      const estado = normalizarEstado(evento.estado);
      setCierre({ estado, ganadorUsuarioId: evento.ganadorUsuarioId, montoFinal: evento.montoFinal });
      setSubasta((prev) => (prev ? { ...prev, estado } : prev));
      if (evento.ganadorUsuarioId === usuarioId) toast.exito('¡Ganaste la subasta!');
      else toast.info('La subasta finalizó.');
      const actual = subastaRef.current;
      if (usuarioId && (evento.ganadorUsuarioId === usuarioId || (actual && actual.vendedorId === usuarioId))) saldo.recargar();
      fetchSubasta({ silencioso: true });
    },
    onReconnected: () => {
      fetchSubasta({ silencioso: true });
      fetchHistorial(pujasVisiblesRef.current);
    }
  });

  const countdown = useCountdown(subasta ? subasta.fechaFin : null, Boolean(subasta) && subasta.estado === 'Activa');

  const verMasPujas = () => {
    const siguiente = pujasVisibles + PUJAS_POR_TANDA;
    setPujasVisibles(siguiente);
    setCargandoHistorial(true);
    fetchHistorial(siguiente);
  };

  const reintentarCarga = () => {
    setLoading(true);
    setErrorCarga(null);
    fetchSubasta();
    fetchHistorial(PUJAS_POR_TANDA);
  };

  const handlePujar = async (e) => {
    e.preventDefault();
    if (!subasta) return;
    const monto = Number(montoManual ?? calcularMontoSugerido(subasta));

    setPujando(true);
    pujaEnCursoRef.current = true;
    fechaFinPreviaRef.current = subasta.fechaFin;
    try {
      const res = await api.post(`/auctions/${subastaId}/bids`, { monto });

      if (res.data.tiempoExtendido) extensionPropiaRef.current = res.data.fechaFin;
      setHeParticipado(true);
      setMontoManual(null);
      marcarExito();
      saldo.recargar();
      setSubasta((prev) => ({
        ...prev,
        precioActual: res.data.monto,
        pujaLiderId: res.data.pujaId,
        compradorLiderId: usuarioId,
        fechaFin: res.data.fechaFin
      }));

      if (res.data.tiempoExtendido) toast.aviso('Tu oferta extendió el tiempo de la subasta.');
      else toast.exito('Oferta enviada. Ahora vas ganando.');
    } catch (err) {
      toast.error(mensajeDeError(err));
      if (err.kind === TIPOS_ERROR.CONFLICTO || err.kind === TIPOS_ERROR.NEGOCIO) {
        fetchSubasta({ silencioso: true });
        fetchHistorial(pujasVisiblesRef.current);
      }
    } finally {
      pujaEnCursoRef.current = false;
      setPujando(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-container sala">
        <Skeleton variante="panel" lineas={4} etiqueta="Cargando subasta" />
      </div>
    );
  }

  if (errorCarga || !subasta) {
    const noExiste = errorCarga && errorCarga.kind === TIPOS_ERROR.NO_ENCONTRADO;
    return (
      <div className="layout-container sala">
        <EstadoError
          error={errorCarga}
          titulo={noExiste ? 'Esta subasta no existe' : undefined}
          onReintentar={noExiste ? null : reintentarCarga}
          accion={<button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Volver al catálogo</button>}
        />
      </div>
    );
  }

  const activa = subasta.estado === 'Activa';
  const esVendedor = subasta.vendedorId === usuarioId;
  const liderando = subasta.compradorLiderId != null && subasta.compradorLiderId === usuarioId;
  const superado = heParticipado && subasta.compradorLiderId != null && !liderando;
  const montoSugerido = calcularMontoSugerido(subasta);
  const montoPuja = montoManual ?? montoSugerido;

  let estadoParticipante = 'sinOfertar';
  if (!user) estadoParticipante = 'invitado';
  else if (esVendedor) estadoParticipante = 'vendedor';
  else if (liderando) estadoParticipante = 'liderando';
  else if (superado) estadoParticipante = 'superado';

  let cierreEfectivo = cierre;
  if (!cierreEfectivo && !activa) {
    cierreEfectivo = {
      estado: subasta.estado,
      ganadorUsuarioId: subasta.compradorLiderId,
      montoFinal: subasta.compradorLiderId != null ? subasta.precioActual : null,
      fechaInicio: subasta.fechaInicio
    };
  }

  return (
    <div className="layout-container sala">
      <button type="button" className="btn btn-ghost btn-sm sala__volver" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver
      </button>

      <div className="sala__grid">
        <div className="sala__principal">
          <EncabezadoSubasta
            subasta={subasta}
            ultimoMinuto={countdown.ultimoMinuto}
            estadoConexion={estadoConexion}
            onReconectar={reconectar}
            extension={extension}
            onExtensionFin={() => setExtension(null)}
          />
        </div>

        <div className="sala__lateral">
          <PanelEstadoParticipante
            estado={estadoParticipante}
            montoSugerido={montoSugerido}
            precioActual={subasta.precioActual}
            activa={activa}
            alerta={alertaSuperado}
          />

          {cierreEfectivo ? (
            <PanelCierre cierre={cierreEfectivo} usuarioId={usuarioId} esVendedor={esVendedor} />
          ) : !esVendedor ? (
            user ? (
              <ConsolaPuja
                monto={montoPuja}
                montoSugerido={montoSugerido}
                incremento={subasta.incrementoMinimo || 0}
                disponible={saldo.datos ? saldo.datos.saldoDisponible : null}
                onMontoChange={setMontoManual}
                onSubmit={handlePujar}
                enviando={pujando}
                exito={exitoReciente}
              />
            ) : (
              <EstadoVacio
                compacto
                icono="martillo"
                titulo="Iniciá sesión para ofertar"
                descripcion="Necesitás una cuenta para participar de esta subasta."
                accion={
                  <Link
                    to="/login"
                    state={{ from: location.pathname + location.search }}
                    className="btn btn-primary btn-sm"
                  >
                    Iniciar sesión
                  </Link>
                }
              />
            )
          ) : null}

          <HistorialPujas
            items={historial.items}
            total={historial.total}
            cargando={cargandoHistorial}
            onVerMas={verMasPujas}
            usuarioId={usuarioId}
            pujaLiderId={subasta.pujaLiderId}
            rol={estadoParticipante === 'vendedor' || estadoParticipante === 'invitado' ? estadoParticipante : 'comprador'}
            activa={subasta.estado === 'Activa'}
          />
        </div>
      </div>
    </div>
  );
}

export default function SalaSubasta() {
  const { id } = useParams();
  const subastaId = Number(id);
  return <Sala key={subastaId} subastaId={subastaId} />;
}

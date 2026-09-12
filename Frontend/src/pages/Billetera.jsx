import React, { useState } from 'react';
import api from '../services/api';
import Paginador from '../components/Paginador';
import Skeleton from '../components/Skeleton';
import EstadoVacio from '../components/EstadoVacio';
import EstadoError from '../components/EstadoError';
import useRecurso from '../hooks/useRecurso';
import useToast from '../hooks/useToast';
import useTitulo from '../hooks/useTitulo';
import { formatoARS, formatoFechaHora } from '../utils/formato';
import { mensajeDeError } from '../utils/errores';
import './Billetera.css';

const PAGE_SIZE = 10;
const MONTOS_RAPIDOS = [10000, 50000, 100000];

const TIPOS = {
  Deposito: { etiqueta: 'Depósito', signo: '+', clase: 'ingreso' },
  Liberacion: { etiqueta: 'Liberación', signo: '+', clase: 'ingreso' },
  Retencion: { etiqueta: 'Retención', signo: '−', clase: 'retencion' },
  Debito: { etiqueta: 'Débito', signo: '−', clase: 'egreso' }
};

function describirTipo(tipo) {
  return TIPOS[tipo] || { etiqueta: tipo, signo: '', clase: 'neutro' };
}

export default function Billetera() {
  const toast = useToast();
  useTitulo('Mi billetera');

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
    if (!Number.isFinite(monto) || monto <= 0) return;

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

  const saldos = balance.datos;
  const transacciones = movimientos.datos ? movimientos.datos.items || [] : [];
  const totalPages = movimientos.datos ? movimientos.datos.totalPages || 0 : 0;
  const totalItems = movimientos.datos ? movimientos.datos.totalItems || 0 : 0;
  const montoValido = Number(montoDeposito) > 0;

  const renderSaldos = () => {
    if (balance.cargando) {
      return <Skeleton variante="panel" lineas={2} etiqueta="Cargando saldos" />;
    }

    if (balance.error && !saldos) {
      return <EstadoError compacto error={balance.error} onReintentar={balance.recargar} titulo="No pudimos cargar tus saldos" />;
    }

    return (
      <section className="glass-panel saldos contenido-ocupado" aria-busy={balance.recargando}>
        <div className="saldos__principal">
          <span className="saldos__etiqueta">Disponible para ofertar</span>
          <strong key={saldos.saldoDisponible} className="saldos__valor saldos__valor--principal">
            {formatoARS(saldos.saldoDisponible)}
          </strong>
        </div>
        <dl className="saldos__secundarios">
          <div className="saldos__item">
            <dt className="saldos__etiqueta">Retenido en ofertas</dt>
            <dd className="saldos__valor saldos__valor--retenido">{formatoARS(saldos.saldoRetenido)}</dd>
          </div>
          <div className="saldos__item">
            <dt className="saldos__etiqueta">Saldo total</dt>
            <dd className="saldos__valor">{formatoARS(saldos.saldoTotal)}</dd>
          </div>
        </dl>
      </section>
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
        <div className="glass-panel movimientos contenido-ocupado" aria-busy={movimientos.recargando}>
          <table className="movimientos__tabla">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Tipo</th>
                <th scope="col">Detalle</th>
                <th scope="col" className="movimientos__monto">Monto</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((tx) => {
                const tipo = describirTipo(tx.tipo);
                return (
                  <tr key={tx.id} className={`movimientos__fila movimientos__fila--${tipo.clase}`}>
                    <td className="movimientos__fecha">{formatoFechaHora(tx.fecha)}</td>
                    <td className="movimientos__tipo"><span className="movimientos__badge">{tipo.etiqueta}</span></td>
                    <td className="movimientos__detalle">{tx.descripcion}</td>
                    <td className="movimientos__monto">{tipo.signo}{formatoARS(tx.monto)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    <div className="layout-container billetera">
      <h1 className="billetera__titulo">Mi billetera</h1>

      {renderSaldos()}

      <section className="glass-panel cargar">
        <div className="cargar__texto">
          <h2 className="cargar__titulo">Cargar saldo</h2>
          <p className="cargar__ayuda">Es una carga simulada: se acredita al instante y podés usarla para ofertar.</p>
        </div>
        <form onSubmit={handleDeposito} className="cargar__form">
          <div className="cargar__rapidos" role="group" aria-label="Montos rápidos">
            {MONTOS_RAPIDOS.map((m) => (
              <button
                key={m}
                type="button"
                className={`cargar__chip${Number(montoDeposito) === m ? ' cargar__chip--activo' : ''}`}
                onClick={() => setMontoDeposito(String(m))}
                disabled={depositando}
              >
                {formatoARS(m)}
              </button>
            ))}
          </div>
          <div className="cargar__fila">
            <input
              type="number"
              className="input-field cargar__input"
              placeholder="Otro monto"
              value={montoDeposito}
              onChange={(e) => setMontoDeposito(e.target.value)}
              min="1"
              step="1"
              inputMode="numeric"
              aria-label="Monto a depositar"
              disabled={depositando}
            />
            <button type="submit" className="btn btn-primary" disabled={depositando || !montoValido} aria-busy={depositando}>
              {depositando ? 'Acreditando…' : 'Depositar'}
            </button>
          </div>
        </form>
      </section>

      <h2 className="billetera__subtitulo">Movimientos</h2>
      {renderMovimientos()}
    </div>
  );
}

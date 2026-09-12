import React from 'react';
import { Link } from 'react-router-dom';
import { formatoARS, formatoFechaHora } from '../../utils/formato';

function resolverCierre({ estado, ganadorUsuarioId, montoFinal, fechaInicio }, { usuarioId, esVendedor }) {
  if (estado === 'Programada') {
    return {
      variante: 'programada',
      titulo: 'Todavía no empezó',
      detalle: `La subasta abre el ${formatoFechaHora(fechaInicio)}. Volvé en ese momento para ofertar.`,
      accion: <Link to="/" className="btn btn-ghost btn-sm">Ver otras subastas</Link>
    };
  }

  if (estado === 'Desierta') {
    return {
      variante: 'desierta',
      titulo: 'La subasta quedó desierta',
      detalle: 'Nadie ofertó antes del cierre.',
      accion: <Link to="/" className="btn btn-ghost btn-sm">Volver al catálogo</Link>
    };
  }

  if (ganadorUsuarioId != null && ganadorUsuarioId === usuarioId) {
    return {
      variante: 'ganaste',
      titulo: '¡Ganaste esta subasta!',
      detalle: `Te la llevaste por ${formatoARS(montoFinal)}. El monto ya se debitó de tu billetera.`,
      accion: <Link to="/billetera" className="btn btn-primary btn-sm">Ver mi billetera</Link>
    };
  }

  if (esVendedor) {
    return {
      variante: 'vendida',
      titulo: 'Tu subasta se vendió',
      detalle: `Cerró en ${formatoARS(montoFinal)}. El monto se acreditó en tu billetera.`,
      accion: <Link to="/billetera" className="btn btn-primary btn-sm">Ver mi billetera</Link>
    };
  }

  return {
    variante: 'finalizada',
    titulo: 'Subasta finalizada',
    detalle: montoFinal != null
      ? `Se vendió a otro participante por ${formatoARS(montoFinal)}.`
      : 'Ya no se aceptan ofertas.',
    accion: <Link to="/" className="btn btn-ghost btn-sm">Buscar otra subasta</Link>
  };
}

export default function PanelCierre({ cierre, usuarioId, esVendedor }) {
  const { variante, titulo, detalle, accion } = resolverCierre(cierre, { usuarioId, esVendedor });

  return (
    <section className={`glass-panel panel-cierre panel-cierre--${variante}`} role="status" aria-live="polite">
      <h2 className="panel-cierre__titulo">{titulo}</h2>
      <p className="panel-cierre__detalle">{detalle}</p>
      <div className="panel-cierre__accion">{accion}</div>
    </section>
  );
}

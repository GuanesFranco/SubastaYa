import React from 'react';
import { formatoARS, plural } from '../../utils/formato';

const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' });

export default function HistorialPujas({ items, total, cargando, onVerMas, usuarioId, pujaLiderId }) {
  const restantes = Math.max(0, total - items.length);

  return (
    <section className="glass-panel historial">
      <div className="historial__encabezado">
        <h4 className="historial__titulo">Historial de ofertas</h4>
        <span className="historial__conteo">{plural(total, 'oferta', 'ofertas', 'Sin ofertas')}</span>
      </div>

      {items.length === 0 ? (
        <p className="historial__vacio">Todavía no hay ofertas. Podés ser el primero.</p>
      ) : (
        <ol className="historial__lista">
          {items.map((puja, indice) => {
            const esPropia = puja.compradorId === usuarioId;
            const esLider = pujaLiderId != null ? puja.id === pujaLiderId : indice === 0;
            return (
              <li
                key={puja.id}
                className={`historial__fila${esPropia ? ' historial__fila--propia' : ''}${esLider ? ' historial__fila--lider' : ''}`}
              >
                <span className="historial__quien">
                  {esLider && (
                    <svg className="historial__corona" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M3 14l2-7 3.5 3.5L10 5l1.5 5.5L15 7l2 7z" fill="currentColor" />
                    </svg>
                  )}
                  <span className="historial__nombre">{esPropia ? 'Vos' : puja.compradorNombre}</span>
                  {puja.fecha && <span className="historial__hora">{hora.format(new Date(puja.fecha))}</span>}
                </span>
                <span className="historial__monto">{formatoARS(puja.monto)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {restantes > 0 && (
        <button
          type="button"
          className="btn btn-ghost btn-sm historial__mas"
          onClick={onVerMas}
          disabled={cargando}
        >
          {cargando ? 'Cargando…' : `Ver más (${restantes} ${restantes === 1 ? 'restante' : 'restantes'})`}
        </button>
      )}
    </section>
  );
}

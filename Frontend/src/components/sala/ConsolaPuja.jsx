import React from 'react';
import { formatoARS } from '../../utils/formato';

export default function ConsolaPuja({ monto, montoSugerido, onMontoChange, onSubmit, enviando }) {
  return (
    <section className="glass-panel consola">
      <h3 className="consola__titulo">Hacer una oferta</h3>

      <form onSubmit={onSubmit} className="consola__form">
        <div className="form-group consola__campo">
          <label className="form-label" htmlFor="monto-puja">
            Monto a ofertar <span className="consola__minimo">mínimo {formatoARS(montoSugerido)}</span>
          </label>
          <input
            id="monto-puja"
            type="number"
            className="input-field consola__input"
            value={monto}
            onChange={(e) => onMontoChange(e.target.value)}
            disabled={enviando}
            min={montoSugerido}
            step="1"
            inputMode="numeric"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary consola__boton"
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando ? 'Enviando…' : 'Ofertar ahora'}
        </button>
      </form>
    </section>
  );
}

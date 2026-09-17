import React from 'react';
import { Link } from 'react-router-dom';
import { formatoARS } from '../../utils/formato';

const MULTIPLICADORES = [1, 2, 5];

export default function ConsolaPuja({ monto, montoSugerido, incremento, disponible, onMontoChange, onSubmit, enviando, exito }) {
  const montoNumero = Number(monto);
  const montoValido = Number.isFinite(montoNumero) && montoNumero > 0;
  const bajoMinimo = montoValido && montoNumero < montoSugerido;
  const sinSaldo = montoValido && disponible != null && montoNumero > disponible;
  const bloqueado = enviando || !montoValido || bajoMinimo || sinSaldo;

  let mensaje = null;
  let tipoMensaje = 'ayuda';
  if (!montoValido && monto !== '') {
    mensaje = 'Ingresá un monto válido.';
    tipoMensaje = 'error';
  } else if (bajoMinimo) {
    mensaje = `La oferta mínima es ${formatoARS(montoSugerido)}.`;
    tipoMensaje = 'error';
  } else if (sinSaldo) {
    mensaje = (
      <>
        Te falta saldo: tenés {formatoARS(disponible)} disponibles. <Link to="/billetera">Cargar saldo</Link>
      </>
    );
    tipoMensaje = 'error';
  } else if (disponible != null) {
    mensaje = `Disponible para ofertar: ${formatoARS(disponible)}`;
  }

  const agregar = (multiplicador) => {
    const base = montoValido && montoNumero >= montoSugerido ? montoNumero : montoSugerido - incremento;
    onMontoChange(String(base + incremento * multiplicador));
  };

  let textoBoton = 'Ofertar ahora';
  if (enviando) textoBoton = 'Enviando…';
  else if (exito) textoBoton = 'Oferta enviada';

  return (
    <section className="glass-panel consola">
      <h3 className="consola__titulo">Hacer una oferta</h3>

      <form onSubmit={onSubmit} className="consola__form" noValidate>
        <div className="form-group consola__campo">
          <label className="form-label" htmlFor="monto-puja">
            Monto a ofertar <span className="consola__minimo">mínimo {formatoARS(montoSugerido)}</span>
          </label>
          <input
            id="monto-puja"
            type="number"
            className={`input-field consola__input${tipoMensaje === 'error' ? ' input-field--error' : ''}`}
            value={monto}
            onChange={(e) => onMontoChange(e.target.value)}
            disabled={enviando}
            min={montoSugerido}
            step="1"
            inputMode="numeric"
            aria-describedby="monto-puja-mensaje"
            aria-invalid={tipoMensaje === 'error'}
            required
          />
          <p id="monto-puja-mensaje" className={`consola__mensaje consola__mensaje--${tipoMensaje}`}>
            {mensaje}
          </p>
        </div>

        <div className="consola__chips" role="group" aria-label="Sumar al monto">
          {MULTIPLICADORES.map((m) => (
            <button
              key={m}
              type="button"
              className="consola__chip"
              onClick={() => agregar(m)}
              disabled={enviando}
            >
              +{formatoARS(incremento * m)}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className={`btn btn-primary consola__boton${exito ? ' consola__boton--exito' : ''}`}
          disabled={bloqueado}
          aria-busy={enviando}
        >
          {enviando && <span className="consola__spinner" aria-hidden="true" />}
          {exito && !enviando && (
            <svg className="consola__check" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span>{textoBoton}</span>
        </button>
      </form>
    </section>
  );
}

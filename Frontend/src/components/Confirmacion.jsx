import React, { useEffect, useRef } from 'react';
import './Confirmacion.css';

export default function Confirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false,
  onConfirmar,
  onCancelar
}) {
  const dialogoRef = useRef(null);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  const alCancelar = (evento) => {
    evento.preventDefault();
    onCancelar();
  };

  const alClickear = (evento) => {
    if (evento.target === dialogoRef.current) onCancelar();
  };

  return (
    <dialog
      ref={dialogoRef}
      className="confirmacion"
      aria-labelledby="confirmacion-titulo"
      onCancel={alCancelar}
      onClick={alClickear}
    >
      <div className="confirmacion__panel">
        <h2 className="confirmacion__titulo" id="confirmacion-titulo">{titulo}</h2>
        {mensaje && <p className="confirmacion__mensaje">{mensaje}</p>}
        <div className="confirmacion__acciones">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${peligro ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}

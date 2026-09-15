import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useRecurso from '../hooks/useRecurso';
import useToast from '../hooks/useToast';
import useTitulo from '../hooks/useTitulo';
import { aDatetimeLocal, describirDuracion, formatoARS } from '../utils/formato';
import { mensajeDeError, TIPOS_ERROR } from '../utils/errores';
import SelectorImagen from '../components/SelectorImagen';
import './CrearSubasta.css';

const CAMPOS_INICIALES = {
  categoriaId: '',
  titulo: '',
  descripcion: '',
  urlImagen: '',
  precioBase: '',
  incrementoMinimo: '',
  fechaInicio: '',
  fechaFin: ''
};

const GRACIA_MS = 60 * 1000;

function esUrlValida(valor) {
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return Boolean(err) && false;
  }
}

const DESCRIPCION_MIN = 10;
const DESCRIPCION_MAX = 1000;

const REQUERIDO = <span className="publicar__requerido" aria-hidden="true">*</span>;

function validar(f) {
  const errores = {};
  if (f.titulo.trim().length < 3) errores.titulo = 'Poné un título de al menos 3 caracteres.';
  const descripcion = f.descripcion.trim();
  if (descripcion.length < DESCRIPCION_MIN) errores.descripcion = `Contá algo del producto: al menos ${DESCRIPCION_MIN} caracteres.`;
  else if (descripcion.length > DESCRIPCION_MAX) errores.descripcion = `La descripción no puede pasar los ${DESCRIPCION_MAX} caracteres.`;
  if (!f.categoriaId) errores.categoriaId = 'Elegí una categoría.';
  if (!f.urlImagen.trim()) errores.urlImagen = 'Elegí una imagen de la galería o pegá una URL.';
  else if (!esUrlValida(f.urlImagen.trim())) errores.urlImagen = 'La URL tiene que empezar con http:// o https://.';
  if (!(Number(f.precioBase) > 0)) errores.precioBase = 'El precio base tiene que ser mayor a 0.';
  if (!(Number(f.incrementoMinimo) > 0)) errores.incrementoMinimo = 'El incremento tiene que ser mayor a 0.';
  if (!f.fechaInicio) errores.fechaInicio = 'Indicá cuándo empieza.';
  if (!f.fechaFin) errores.fechaFin = 'Indicá cuándo termina.';

  if (f.fechaInicio && f.fechaFin) {
    const inicio = new Date(f.fechaInicio);
    const fin = new Date(f.fechaFin);
    if (fin <= inicio) errores.fechaFin = 'El cierre tiene que ser posterior al inicio.';
    else if (fin.getTime() < Date.now() - GRACIA_MS) errores.fechaFin = 'El cierre no puede estar en el pasado.';
  }
  return errores;
}

export default function CrearSubasta() {
  const navigate = useNavigate();
  const toast = useToast();
  useTitulo('Publicar subasta');

  const [formData, setFormData] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [previewRota, setPreviewRota] = useState(false);

  const categorias = useRecurso(
    (signal) => api.get('/categories', { signal }).then((res) => res.data || []),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
    setErrorGeneral('');
    if (name === 'urlImagen') setPreviewRota(false);
  };

  const elegirImagen = (url) => {
    setFormData((prev) => ({ ...prev, urlImagen: url }));
    setErrores((prev) => ({ ...prev, urlImagen: '' }));
    setErrorGeneral('');
    setPreviewRota(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const erroresCliente = validar(formData);
    if (Object.keys(erroresCliente).length > 0) {
      setErrores(erroresCliente);
      const primero = Object.keys(erroresCliente)[0];
      const campo = document.getElementById(`campo-${primero}`);
      if (campo) campo.focus();
      return;
    }

    setEnviando(true);
    setErrorGeneral('');
    try {
      const payload = {
        ...formData,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        urlImagen: formData.urlImagen.trim(),
        categoriaId: Number(formData.categoriaId),
        precioBase: Number(formData.precioBase),
        incrementoMinimo: Number(formData.incrementoMinimo)
      };
      const response = await api.post('/auctions', payload);
      toast.exito('Subasta publicada.');
      navigate(`/subasta/${response.data.id}`, { replace: true });
    } catch (err) {
      if (err.kind === TIPOS_ERROR.VALIDACION && err.errores) {
        setErrores(err.errores);
        const sinCampo = Object.keys(err.errores).every((clave) => !(clave in CAMPOS_INICIALES));
        if (sinCampo) setErrorGeneral(mensajeDeError(err));
      } else {
        setErrorGeneral(mensajeDeError(err));
      }
    } finally {
      setEnviando(false);
    }
  };

  const ahoraLocal = aDatetimeLocal(new Date());
  const inicio = formData.fechaInicio ? new Date(formData.fechaInicio) : null;
  const fin = formData.fechaFin ? new Date(formData.fechaFin) : null;
  const duracionMs = inicio && fin && fin > inicio ? fin - inicio : null;
  const mostrarPreview = esUrlValida(formData.urlImagen.trim()) && !previewRota;
  const precioBase = Number(formData.precioBase);
  const incremento = Number(formData.incrementoMinimo);
  const primeraOferta = precioBase > 0 && incremento > 0 ? precioBase + incremento : null;

  const claseInput = (campo) => `input-field${errores[campo] ? ' input-field--error' : ''}`;
  const describir = (campo) => (errores[campo] ? `campo-${campo}-error` : undefined);
  const renderError = (campo) => (
    errores[campo] ? <p id={`campo-${campo}-error`} className="form-error">{errores[campo]}</p> : null
  );

  return (
    <div className="layout-container publicar">
      <div className="publicar__encabezado">
        <h1>Publicar subasta</h1>
        <p className="publicar__subtitulo">Completá los datos. Una vez publicada no se puede editar, porque las ofertas se hacen sobre estas condiciones. Los campos con {REQUERIDO} son obligatorios.</p>
      </div>

      <form onSubmit={handleSubmit} className="publicar__form" noValidate>
        <section className="glass-panel publicar__seccion">
          <h2 className="publicar__titulo-seccion">Qué vendés</h2>
          <div className="form-grid">
            <div className="form-group form-grid__completo">
              <label className="form-label" htmlFor="campo-titulo">Título {REQUERIDO}</label>
              <input
                id="campo-titulo"
                type="text"
                name="titulo"
                className={claseInput('titulo')}
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ej: Consola PlayStation 5 con dos joysticks"
                maxLength={100}
                required
                aria-invalid={Boolean(errores.titulo)}
                aria-describedby={describir('titulo')}
              />
              {renderError('titulo')}
            </div>

            <div className="form-group form-grid__completo">
              <label className="form-label" htmlFor="campo-descripcion">Descripción {REQUERIDO}</label>
              <textarea
                id="campo-descripcion"
                name="descripcion"
                className={`${claseInput('descripcion')} publicar__textarea`}
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Estado, accesorios, detalles que un comprador querría saber."
                rows="3"
                maxLength={DESCRIPCION_MAX}
                required
                aria-invalid={Boolean(errores.descripcion)}
                aria-describedby={describir('descripcion')}
              />
              {renderError('descripcion')}
              {!errores.descripcion && formData.descripcion.length >= DESCRIPCION_MAX - 100 && (
                <p className="form-hint">{formData.descripcion.length}/{DESCRIPCION_MAX} caracteres.</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="campo-categoriaId">Categoría {REQUERIDO}</label>
              <select
                id="campo-categoriaId"
                name="categoriaId"
                className={claseInput('categoriaId')}
                value={formData.categoriaId}
                onChange={handleChange}
                disabled={categorias.cargando}
                required
                aria-invalid={Boolean(errores.categoriaId)}
                aria-describedby={describir('categoriaId')}
              >
                <option value="">{categorias.cargando ? 'Cargando…' : 'Elegí una categoría'}</option>
                {(categorias.datos || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              {renderError('categoriaId')}
              {categorias.error && <p className="form-error">No pudimos cargar las categorías. <button type="button" className="publicar__link" onClick={categorias.recargar}>Reintentar</button></p>}
            </div>

            <div className="form-group form-grid__completo">
              <span className="form-label" id="etiqueta-galeria">Imagen {REQUERIDO}</span>
              <p className="form-hint publicar__ayuda-galeria" id="ayuda-galeria">
                Elegí una de la galería{formData.categoriaId ? ', filtrada por la categoría que marcaste' : ''}. Son fotos de producto sobre fondo neutro, para que el catálogo quede parejo.
              </p>
              <SelectorImagen
                categoriaId={Number(formData.categoriaId) || null}
                valor={formData.urlImagen.trim()}
                onElegir={elegirImagen}
                describedBy="ayuda-galeria"
              />
            </div>

            <div className="form-group form-grid__completo">
              <label className="form-label" htmlFor="campo-urlImagen">
                ¿No encontrás lo que buscás? Pegá una URL <span className="publicar__opcional">opcional si ya elegiste de la galería</span>
              </label>
              <input
                id="campo-urlImagen"
                type="url"
                name="urlImagen"
                className={claseInput('urlImagen')}
                value={formData.urlImagen}
                onChange={handleChange}
                placeholder="https://…"
                inputMode="url"
                aria-invalid={Boolean(errores.urlImagen)}
                aria-describedby={describir('urlImagen')}
              />
              {renderError('urlImagen')}
            </div>

            {formData.urlImagen.trim() && (
              <div className="form-grid__completo publicar__preview">
                {mostrarPreview ? (
                  <img src={formData.urlImagen.trim()} alt="Vista previa de la imagen" onError={() => setPreviewRota(true)} />
                ) : (
                  <div className="publicar__preview-vacia">
                    {previewRota ? 'No pudimos cargar esa imagen. Revisá la URL.' : 'La vista previa aparece cuando la URL sea válida.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel publicar__seccion">
          <h2 className="publicar__titulo-seccion">Condiciones</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="campo-precioBase">Precio base {REQUERIDO}</label>
              <input
                id="campo-precioBase"
                type="number"
                name="precioBase"
                className={claseInput('precioBase')}
                value={formData.precioBase}
                onChange={handleChange}
                min="1"
                step="1"
                required
                inputMode="numeric"
                placeholder="0"
                aria-invalid={Boolean(errores.precioBase)}
                aria-describedby={describir('precioBase')}
              />
              {renderError('precioBase')}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="campo-incrementoMinimo">Incremento mínimo {REQUERIDO}</label>
              <input
                id="campo-incrementoMinimo"
                type="number"
                name="incrementoMinimo"
                className={claseInput('incrementoMinimo')}
                value={formData.incrementoMinimo}
                onChange={handleChange}
                min="1"
                step="1"
                required
                inputMode="numeric"
                placeholder="0"
                aria-invalid={Boolean(errores.incrementoMinimo)}
                aria-describedby={describir('incrementoMinimo')}
              />
              {renderError('incrementoMinimo')}
              {!errores.incrementoMinimo && primeraOferta && (
                <p className="form-hint">La primera oferta posible va a ser de {formatoARS(primeraOferta)}.</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="campo-fechaInicio">Empieza {REQUERIDO}</label>
              <input
                id="campo-fechaInicio"
                type="datetime-local"
                name="fechaInicio"
                className={claseInput('fechaInicio')}
                value={formData.fechaInicio}
                onChange={handleChange}
                min={ahoraLocal}
                required
                aria-invalid={Boolean(errores.fechaInicio)}
                aria-describedby={describir('fechaInicio')}
              />
              {renderError('fechaInicio')}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="campo-fechaFin">Termina {REQUERIDO}</label>
              <input
                id="campo-fechaFin"
                type="datetime-local"
                name="fechaFin"
                className={claseInput('fechaFin')}
                value={formData.fechaFin}
                onChange={handleChange}
                min={formData.fechaInicio || ahoraLocal}
                required
                aria-invalid={Boolean(errores.fechaFin)}
                aria-describedby={describir('fechaFin')}
              />
              {renderError('fechaFin')}
              {!errores.fechaFin && duracionMs != null && (
                <p className="form-hint">La subasta va a durar {describirDuracion(duracionMs)}.</p>
              )}
            </div>
          </div>
        </section>

        {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

        <div className="publicar__acciones">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando} aria-busy={enviando}>
            {enviando ? 'Publicando…' : 'Publicar subasta'}
          </button>
        </div>
      </form>
    </div>
  );
}

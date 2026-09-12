import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CrearSubasta() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    categoriaId: '',
    titulo: '',
    descripcion: '',
    imagenUrl: '',
    precioBase: '',
    incrementoMinimo: '',
    fechaInicio: '',
    fechaFin: ''
  });

  useEffect(() => {
    // Cargar categorías al inicio
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => setError('Error al cargar categorías.'));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.categoriaId || !formData.titulo || !formData.precioBase || !formData.fechaInicio || !formData.fechaFin) {
      setError('Por favor, completa todos los campos requeridos.');
      return false;
    }

    if (Number(formData.precioBase) <= 0) {
      setError('El precio base debe ser mayor a 0.');
      return false;
    }

    const start = new Date(formData.fechaInicio);
    const end = new Date(formData.fechaFin);
    const now = new Date();

    if (start >= end) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return false;
    }

    // Comparamos contra now - 1 minuto de changüí por si tardó en llenar el form
    if (end < new Date(now.getTime() - 60000)) {
      setError('La fecha de fin no puede estar en el pasado.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // El payload requiere números para precios e IDs
      const payload = {
        ...formData,
        categoriaId: Number(formData.categoriaId),
        precioBase: Number(formData.precioBase),
        incrementoMinimo: formData.incrementoMinimo ? Number(formData.incrementoMinimo) : null
      };

      // Si no puso URL de imagen, la borramos para que use un default si quiere
      if (!payload.imagenUrl) delete payload.imagenUrl;
      if (!payload.incrementoMinimo) delete payload.incrementoMinimo;

      const response = await api.post('/auctions', payload);
      
      // La API debería devolver la subasta creada con su ID
      // Como esto es publicación, lo mandamos al catálogo o al detalle
      navigate(`/subasta/${response.data.id}`);
    } catch (err) {
      setError(err.message || 'Error al crear la subasta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container" style={{ maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Publicar Subasta</h1>
      
      <div className="glass-panel">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Título de la Subasta *</label>
              <input 
                type="text" name="titulo" className="input-field" 
                value={formData.titulo} onChange={handleChange} 
                placeholder="Ej: Consola PlayStation 5" required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Descripción</label>
              <textarea 
                name="descripcion" className="input-field" 
                value={formData.descripcion} onChange={handleChange} 
                placeholder="Detalles del producto..." rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select name="categoriaId" className="input-field" value={formData.categoriaId} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">URL de Imagen (Opcional)</label>
              <input 
                type="url" name="imagenUrl" className="input-field" 
                value={formData.imagenUrl} onChange={handleChange} 
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Precio Base ($) *</label>
              <input 
                type="number" name="precioBase" className="input-field" 
                value={formData.precioBase} onChange={handleChange} min="1" step="0.01" required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Incremento Mínimo ($) (Opcional)</label>
              <input 
                type="number" name="incrementoMinimo" className="input-field" 
                value={formData.incrementoMinimo} onChange={handleChange} min="1" step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Inicio *</label>
              <input 
                type="datetime-local" name="fechaInicio" className="input-field" 
                value={formData.fechaInicio} onChange={handleChange} required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Fin *</label>
              <input 
                type="datetime-local" name="fechaFin" className="input-field" 
                value={formData.fechaFin} onChange={handleChange} required
              />
            </div>

          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn" onClick={() => navigate(-1)} style={{ color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar Subasta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

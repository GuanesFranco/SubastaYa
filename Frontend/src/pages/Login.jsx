import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (isRegistering) {
      if (formData.nombre.length < 2) {
        setError('El nombre debe tener al menos 2 caracteres.');
        return false;
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Formato de correo electrónico inválido.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
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
      if (isRegistering) {
        await register(formData.email, formData.password, formData.nombre);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/'); // Redirigir al inicio tras autenticarse
    } catch (err) {
      setError(err.message || 'Error al autenticarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
          {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input 
                type="text" 
                name="nombre"
                className="input-field" 
                value={formData.nombre} 
                onChange={handleChange} 
                placeholder="Ej: Enzo"
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              name="email"
              className="input-field" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="correo@test.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              name="password"
              className="input-field" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="******"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            className="btn" 
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}

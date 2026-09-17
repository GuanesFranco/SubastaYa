import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTitulo from '../hooks/useTitulo';
import { errorDeCampo, mensajeDeError, TIPOS_ERROR } from '../utils/errores';
import './Login.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(formData, registrando) {
  const errores = {};
  if (registrando && formData.nombre.trim().length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  }
  if (!EMAIL_REGEX.test(formData.email)) {
    errores.email = 'Ingresá un correo válido.';
  }
  if (formData.password.length < 6) {
    errores.password = 'La contraseña debe tener al menos 6 caracteres.';
  }
  return errores;
}

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [registrando, setRegistrando] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useTitulo(registrando ? 'Crear cuenta' : 'Iniciar sesión');

  const destino = location.state && location.state.from ? location.state.from : '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
    setErrorGeneral('');
  };

  const cambiarModo = () => {
    setRegistrando((prev) => !prev);
    setErrores({});
    setErrorGeneral('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const erroresCliente = validar(formData, registrando);
    if (Object.keys(erroresCliente).length > 0) {
      setErrores(erroresCliente);
      return;
    }

    setEnviando(true);
    setErrorGeneral('');
    try {
      if (registrando) {
        await register(formData.email, formData.password, formData.nombre.trim());
      } else {
        await login(formData.email, formData.password);
      }
      navigate(destino, { replace: true });
    } catch (err) {
      if (err.kind === TIPOS_ERROR.VALIDACION && err.errores) {
        setErrores({
          nombre: errorDeCampo(err, 'nombre'),
          email: errorDeCampo(err, 'email'),
          password: errorDeCampo(err, 'password')
        });
        if (!errorDeCampo(err, 'nombre') && !errorDeCampo(err, 'email') && !errorDeCampo(err, 'password')) {
          setErrorGeneral(mensajeDeError(err));
        }
      } else {
        setErrorGeneral(mensajeDeError(err));
      }
    } finally {
      setEnviando(false);
    }
  };

  const claseInput = (campo) => `input-field${errores[campo] ? ' input-field--error' : ''}`;

  return (
    <div className="layout-container login">
      <div className="glass-panel login__panel">
        <div className="login__encabezado">
          <h1 className="login__titulo">{registrando ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
          <p className="login__subtitulo">
            {registrando
              ? 'Tu billetera arranca en $0. Después podés cargar saldo simulado.'
              : 'Entrá para ofertar, publicar y seguir tus subastas en vivo.'}
          </p>
        </div>

        {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

        <form onSubmit={handleSubmit} className="login__form" noValidate>
          {registrando && (
            <div className="form-group">
              <label className="form-label" htmlFor="login-nombre">Nombre</label>
              <input
                id="login-nombre"
                type="text"
                name="nombre"
                className={claseInput('nombre')}
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Cómo querés que te vean"
                autoComplete="name"
                aria-invalid={Boolean(errores.nombre)}
                aria-describedby={errores.nombre ? 'login-nombre-error' : undefined}
              />
              {errores.nombre && <p id="login-nombre-error" className="form-error">{errores.nombre}</p>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className={claseInput('email')}
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(errores.email)}
              aria-describedby={errores.email ? 'login-email-error' : undefined}
            />
            {errores.email && <p id="login-email-error" className="form-error">{errores.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <div className="login__password">
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                name="password"
                className={claseInput('password')}
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                autoComplete={registrando ? 'new-password' : 'current-password'}
                aria-invalid={Boolean(errores.password)}
                aria-describedby={errores.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="login__ver"
                onClick={() => setMostrarPassword((v) => !v)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
              >
                {mostrarPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {errores.password && <p id="login-password-error" className="form-error">{errores.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary login__submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? 'Ingresando…' : (registrando ? 'Crear cuenta' : 'Ingresar')}
          </button>
        </form>

        <button type="button" className="login__cambiar" onClick={cambiarModo}>
          {registrando ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </div>
  );
}

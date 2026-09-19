import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import loginBg from '../assets/img/login-bg.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="login-overlay"></div>

      <div className="login-card">
        <div className="login-icon">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="38" r="14" stroke="currentColor" strokeWidth="4" />
            <path
              d="M22 82 Q22 58 50 58 Q78 58 78 82"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <h1>ORION</h1>
        <p className="login-subtitle">Maintenance Lite</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@orion.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="primary login-btn"
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
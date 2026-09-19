import { NavLink, useNavigate } from 'react-router-dom';
import loginBg from '../assets/img/login-bg.jpg';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">ORION Lite</div>
        <nav>
          <NavLink to="/activos" className={({ isActive }) => isActive ? 'active' : ''}>Activos</NavLink>
          <NavLink to="/ordenes" className={({ isActive }) => isActive ? 'active' : ''}>Órdenes</NavLink>
          <NavLink to="/cuadrillas" className={({ isActive }) => isActive ? 'active' : ''}>Cuadrillas</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
        </nav>
        <div className="user-info">
          <div><strong>{usuario.nombre || 'Usuario'}</strong></div>
          <div style={{ color: '#94a3b8', marginTop: 4 }}>{usuario.rol}</div>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main-content" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="main-overlay">{children}</div>
      </main>
    </div>
  );
}
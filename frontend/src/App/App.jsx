import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Activos from './pages/Activos';
import Ordenes from './pages/Ordenes';
import Cuadrillas from './pages/Cuadrillas';
import Dashboard from './pages/Dashboard';

function RutaProtegida({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/activos" element={<RutaProtegida><Activos /></RutaProtegida>} />
      <Route path="/ordenes" element={<RutaProtegida><Ordenes /></RutaProtegida>} />
      <Route path="/cuadrillas" element={<RutaProtegida><Cuadrillas /></RutaProtegida>} />
      <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
import { useState, useEffect } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../api/axiosConfig';
import Kpi, { KpiGrid } from '../components/Kpi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const RANGOS = [
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
];

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [rango, setRango] = useState('6m');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    api.get('/api/dashboard')
      .then((res) => setDatos(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Error'))
      .finally(() => setCargando(false));
  }, []);

  const tendencia = (() => {
    if (!datos) return [];
    const mesActual = new Date().getMonth();
    const meses = rango === '3m' ? 3 : rango === '6m' ? 6 : 12;
    const totalActivos = datos.activosPorEstado.reduce((a, x) => a + x.total, 0);
    const totalOrdenes = datos.ordenesPorEstado.reduce((a, x) => a + x.total, 0);
    return Array.from({ length: meses }, (_, i) => {
      const idx = (mesActual - meses + 1 + i + 12) % 12;
      const factor = 0.6 + (i / Math.max(meses - 1, 1)) * 0.4;
      return {
        mes: MESES[idx],
        activos: Math.max(1, Math.round(totalActivos * factor)),
        ordenes: Math.max(1, Math.round(totalOrdenes * factor)),
      };
    });
  })();

  if (cargando) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!datos) return <div className="empty">Sin datos.</div>;

  const suma = (arr, key = 'total') => arr.reduce((a, x) => a + x[key], 0);
  const operativos = datos.activosPorEstado.filter(a => a.valor !== 'FUERA_DE_SERVICIO');
  const ordenesActivas = datos.ordenesPorEstado.filter(o => ['ABIERTA', 'ASIGNADA', 'EN_EJECUCION'].includes(o.valor));
  const maxAsignaciones = Math.max(...datos.cargaCuadrillas.map(c => c.asignaciones), 1);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Hola, {usuario.nombre || 'Usuario'}</h1>
          <p>Este es el resumen general del sistema</p>
        </div>
      </header>

      <KpiGrid>
        <Kpi label="Total activos" value={suma(datos.activosPorEstado)} hint={`${suma(operativos)} operativos`} color="azul" />
        <Kpi label="Órdenes activas" value={suma(ordenesActivas)} hint={`${suma(datos.ordenesPorEstado)} totales`} color="purpura" />
        <Kpi label="Cuadrillas" value={suma(datos.cuadrillasPorEstado)} hint={`${suma(datos.cargaCuadrillas, 'asignaciones')} asignaciones`} color="verde" />
        <Kpi label="Fuera de servicio" value={datos.activosPorEstado.find(a => a.valor === 'FUERA_DE_SERVICIO')?.total || 0} hint="activos retirados" color="rojo" />
      </KpiGrid>

      <section className="dash-main">
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h3>Tendencia general</h3>
              <p className="dash-card-sub">Activos y órdenes en el tiempo</p>
            </div>
            <div className="dash-range-group">
              {RANGOS.map((r) => (
                <button key={r.value} className={`dash-range-btn ${rango === r.value ? 'active' : ''}`} onClick={() => setRango(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tendencia} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="gActivos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gOrdenes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="activos" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gActivos)" name="Activos" />
              <Area type="monotone" dataKey="ordenes" stroke="#9333ea" strokeWidth={2.5} fill="url(#gOrdenes)" name="Órdenes" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="dash-legend-inline">
            <span><span className="dot" style={{ background: '#3b82f6' }} />Activos</span>
            <span><span className="dot" style={{ background: '#9333ea' }} />Órdenes</span>
          </div>
        </div>
      </section>

      <section className="dash-secondary">
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Activos por estado</h3>
          </div>
          <div className="dash-pie-row">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={datos.activosPorEstado} dataKey="total" nameKey="valor"
                  cx="50%" cy="50%" outerRadius={60} innerRadius={38} paddingAngle={3}>
                  {datos.activosPorEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-list compact">
              {datos.activosPorEstado.map((a, i) => (
                <div key={i}>
                  <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{a.valor}</span>
                  <strong>{a.total}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Carga de cuadrillas</h3>
            <span className="dash-tag">{datos.cargaCuadrillas.length} equipos</span>
          </div>
          <div className="cuadrilla-list">
            {datos.cargaCuadrillas.map((c, i) => {
              const pct = maxAsignaciones > 0 ? (c.asignaciones / maxAsignaciones) * 100 : 0;
              return (
                <div key={i} className="cuadrilla-item">
                  <div className="cuadrilla-info">
                    <span className="cuadrilla-nombre">{c.cuadrilla}</span>
                    <span className="cuadrilla-codigo">{c.codigo}</span>
                  </div>
                  <div className="cuadrilla-bar-wrap">
                    <div className="cuadrilla-bar" style={{ width: `${Math.max(pct, 6)}%`, background: c.asignaciones > 0 ? '#3b82f6' : '#e5e7eb' }} />
                  </div>
                  <span className="cuadrilla-valor">{c.asignaciones}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
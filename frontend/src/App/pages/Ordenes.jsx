import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Kpi, { KpiGrid } from '../components/Kpi';

const TIPOS = ['PREVENTIVO', 'CORRECTIVO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'];
const ESTADOS = ['ABIERTA', 'ASIGNADA', 'EN_EJECUCION', 'CERRADA', 'CANCELADA'];

export default function Ordenes() {
  const [datos, setDatos] = useState([]);
  const [todos, setTodos] = useState([]);
  const [activos, setActivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [filtros, setFiltros] = useState({ tipo: '', prioridad: '', estado: '' });
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalAsignar, setModalAsignar] = useState(null);
  const [form, setForm] = useState({});
  const [formAsignar, setFormAsignar] = useState({});
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => { cargar(); }, [filtros]);

  useEffect(() => {
    api.get('/api/activos').then((res) => setActivos(res.data.data));
    api.get('/api/cuadrillas').then((res) => setCuadrillas(res.data.data));
  }, []);

  async function cargar() {
    setCargando(true);
    try {
      const params = new URLSearchParams(filtros).toString();
      const res = await api.get(`/api/ordenes?${params}`);
      setDatos(res.data.data);
      const resTodos = await api.get('/api/ordenes?size=100');
      setTodos(resTodos.data.data);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudieron cargar las órdenes', 'error');
    } finally {
      setCargando(false);
    }
  }

  const filtrosActivos = Object.values(filtros).some((v) => v);

  function limpiarFiltros() {
    setFiltros({ tipo: '', prioridad: '', estado: '' });
  }

  function abrirCrear() {
    setForm({
      tipo: 'PREVENTIVO',
      prioridad: 'MEDIA',
      descripcion: '',
      activoId: activos[0]?.id || '',
      fechaProgramada: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });
    setModal({ modo: 'crear' });
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      await api.post('/api/ordenes', form);
      Swal.fire({ icon: 'success', title: 'Orden creada', text: 'La orden se registró correctamente', timer: 2000, showConfirmButton: false });
      setModal(null);
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo guardar', 'error');
    }
  }

  function abrirAsignar(orden) {
    const hoy = new Date();
    const en3dias = new Date(hoy.getTime() + 3 * 86400000);
    const disponibles = cuadrillas.filter(c => c.estado === 'DISPONIBLE');
    setFormAsignar({
      cuadrillaId: disponibles[0]?.id || '',
      fechaInicio: hoy.toISOString().split('T')[0],
      fechaFin: en3dias.toISOString().split('T')[0],
    });
    setModalAsignar({ ordenId: orden.id, codigo: orden.codigo });
  }

  async function asignarCuadrilla(e) {
    e.preventDefault();
    if (!formAsignar.cuadrillaId) {
      Swal.fire('Error', 'Seleccione una cuadrilla', 'error');
      return;
    }
    try {
      await api.post(`/api/ordenes/${modalAsignar.ordenId}/cuadrillas`, formAsignar);
      Swal.fire({ icon: 'success', title: 'Cuadrilla asignada', text: 'La orden pasó a ASIGNADA', timer: 2000, showConfirmButton: false });
      setModalAsignar(null);
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo asignar la cuadrilla', 'error');
    }
  }

  async function iniciar(orden) {
    const { isConfirmed } = await Swal.fire({
      title: 'Iniciar ejecución',
      text: `¿Iniciar la orden ${orden.codigo}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Iniciar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    try {
      await api.patch(`/api/ordenes/${orden.id}/estado`, { estado: 'EN_EJECUCION' });
      Swal.fire({ icon: 'success', title: 'Orden iniciada', timer: 2000, showConfirmButton: false });
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo iniciar', 'error');
    }
  }

  async function cerrar(orden) {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Cerrar orden',
      input: 'textarea',
      inputLabel: 'Observación de cierre',
      inputPlaceholder: 'Describe el trabajo realizado...',
      showCancelButton: true,
      confirmButtonText: 'Cerrar orden',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      inputValidator: (v) => !v && 'La observación es obligatoria',
    });
    if (!isConfirmed) return;

    try {
      await api.patch(`/api/ordenes/${orden.id}/estado`, {
        estado: 'CERRADA',
        observacionCierre: value,
      });
      Swal.fire({ icon: 'success', title: 'Orden cerrada', text: 'La orden finalizó correctamente', timer: 2000, showConfirmButton: false });
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo cerrar', 'error');
    }
  }

  async function cancelar(orden) {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Cancelar orden',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Describe el motivo...',
      showCancelButton: true,
      confirmButtonText: 'Cancelar orden',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc2626',
      inputValidator: (v) => !v && 'El motivo es obligatorio',
    });
    if (!isConfirmed) return;

    try {
      await api.patch(`/api/ordenes/${orden.id}/estado`, {
        estado: 'CANCELADA',
        motivoCancelacion: value,
      });
      Swal.fire({ icon: 'success', title: 'Orden cancelada', timer: 2000, showConfirmButton: false });
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo cancelar', 'error');
    }
  }

  async function reabrir(orden) {
    const { isConfirmed } = await Swal.fire({
      title: 'Reabrir orden',
      text: `¿Reabrir la orden ${orden.codigo}? Solo COORDINADOR puede hacerlo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reabrir',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    try {
      await api.patch(`/api/ordenes/${orden.id}/estado`, { estado: 'ABIERTA' });
      Swal.fire({ icon: 'success', title: 'Orden reabierta', timer: 2000, showConfirmButton: false });
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo reabrir', 'error');
    }
  }

  const datosFiltrados = datos.filter((o) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      o.codigo?.toLowerCase().includes(term) ||
      o.tipo?.toLowerCase().includes(term) ||
      o.descripcion?.toLowerCase().includes(term)
    );
  });

  const abiertas = todos.filter(o => o.estado === 'ABIERTA').length;
  const asignadas = todos.filter(o => o.estado === 'ASIGNADA').length;
  const enEjecucion = todos.filter(o => o.estado === 'EN_EJECUCION').length;
  const cerradas = todos.filter(o => o.estado === 'CERRADA').length;
  const canceladas = todos.filter(o => o.estado === 'CANCELADA').length;

  const filtrosUI = (
    <>
      <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
        <option value="">Tipo</option>
        {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filtros.prioridad} onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}>
        <option value="">Prioridad</option>
        {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
        <option value="">Estado</option>
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    </>
  );

  return (
    <div className="page">
      <PageHeader
        title="Órdenes de Trabajo"
        subtitle="Planificación y control de actividades"
        filters={filtrosUI}
        filtersActive={filtrosActivos}
        onClearFilters={limpiarFiltros}
      />

      <KpiGrid>
        <Kpi label="Total" value={todos.length} hint={`${todos.length} registradas`} color="azul" />
        <Kpi label="Abiertas" value={abiertas} hint="pendientes" color="verde" />
        <Kpi label="Asignadas" value={asignadas} hint="con cuadrilla" color="amarillo" />
        <Kpi label="En ejecución" value={enEjecucion} hint="en curso" color="purpura" />
        <Kpi label="Cerradas" value={cerradas} hint="finalizadas" color="gris" />
        <Kpi label="Canceladas" value={canceladas} hint="anuladas" color="rojo" />
      </KpiGrid>

      <SearchBar
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por código, tipo o descripción..."
        action={<button className="primary" onClick={abrirCrear} disabled={!activos.length}>+ Nueva orden</button>}
      />

      {cargando ? (
        <div className="loading">Cargando...</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="empty">No hay órdenes.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha prog.</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((o) => (
              <tr key={o.id}>
                <td>{o.codigo}</td>
                <td>{o.tipo}</td>
                <td><span className={`badge ${o.prioridad}`}>{o.prioridad}</span></td>
                <td><span className={`badge ${o.estado}`}>{o.estado}</span></td>
                <td>{o.fechaProgramada}</td>
                <td>
                  <div className="acciones">
                    {o.estado === 'ABIERTA' && (
                      <>
                        <button className="icon-btn" onClick={() => abrirAsignar(o)} title="Asignar cuadrilla">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => cancelar(o)} title="Cancelar orden">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        </button>
                      </>
                    )}
                    {o.estado === 'ASIGNADA' && (
                      <>
                        <button className="icon-btn" onClick={() => iniciar(o)} title="Iniciar ejecución">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => cancelar(o)} title="Cancelar orden">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        </button>
                      </>
                    )}
                    {o.estado === 'EN_EJECUCION' && (
                      <button className="icon-btn icon-btn-success" onClick={() => cerrar(o)} title="Cerrar orden">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                    )}
                    {o.estado === 'CERRADA' && usuario.rol === 'COORDINADOR' && (
                      <button className="icon-btn" onClick={() => reabrir(o)} title="Reabrir orden">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                          <path d="M21 3v5h-5"></path>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                          <path d="M3 21v-5h5"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal
          titulo="Nueva orden"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" form="orden-form" className="primary">Crear orden</button>
            </>
          }
        >
          <form id="orden-form" onSubmit={guardar}>
            <div className="form-group">
              <label>Tipo <span className="req">*</span></label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Prioridad <span className="req">*</span></label>
              <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Activo <span className="req">*</span></label>
              <select value={form.activoId} onChange={(e) => setForm({ ...form, activoId: parseInt(e.target.value) })} required>
                {activos.map((a) => <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Descripción <span className="req">*</span></label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                placeholder="Describe el trabajo a realizar..."
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha programada <span className="req">*</span></label>
              <input
                type="date"
                value={form.fechaProgramada}
                onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>
      )}

      {modalAsignar && (
        <Modal
          titulo={`Asignar cuadrilla a ${modalAsignar.codigo}`}
          onClose={() => setModalAsignar(null)}
          footer={
            <>
              <button type="button" className="secondary" onClick={() => setModalAsignar(null)}>Cancelar</button>
              <button type="submit" form="asignar-form" className="primary">Asignar</button>
            </>
          }
        >
          <form id="asignar-form" onSubmit={asignarCuadrilla}>
            <div className="form-group">
              <label>Cuadrilla <span className="req">*</span></label>
              <select
                value={formAsignar.cuadrillaId}
                onChange={(e) => setFormAsignar({ ...formAsignar, cuadrillaId: parseInt(e.target.value) })}
                required
              >
                <option value="">Seleccione una cuadrilla</option>
                {cuadrillas
                  .filter((c) => c.estado !== 'INACTIVA')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.nombre} ({c.estado})
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha de inicio <span className="req">*</span></label>
              <input
                type="date"
                value={formAsignar.fechaInicio}
                onChange={(e) => setFormAsignar({ ...formAsignar, fechaInicio: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha de fin <span className="req">*</span></label>
              <input
                type="date"
                value={formAsignar.fechaFin}
                onChange={(e) => setFormAsignar({ ...formAsignar, fechaFin: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
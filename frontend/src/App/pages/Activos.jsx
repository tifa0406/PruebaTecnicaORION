import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Kpi, { KpiGrid } from '../components/Kpi';

const TIPOS = ['PMV', 'CCTV', 'ESTACION_METEOROLOGICA', 'SENSOR_TRAFICO', 'AFORADOR'];
const ESTADOS = ['OPERATIVO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'];
const CORREDORES = ['Corredor Norte', 'Corredor Sur', 'Corredor Oriente', 'Corredor Occidente'];

export default function Activos() {
  const [datos, setDatos] = useState([]);
  const [todos, setTodos] = useState([]);
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', corredorVial: '' });
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => { cargar(); }, [filtros]);

  async function cargar() {
    setCargando(true);
    try {
      const params = new URLSearchParams(filtros).toString();
      const res = await api.get(`/api/activos?${params}`);
      setDatos(res.data.data);
      const resTodos = await api.get('/api/activos?size=100');
      setTodos(resTodos.data.data);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudieron cargar los activos', 'error');
    } finally {
      setCargando(false);
    }
  }

  const filtrosActivos = Object.values(filtros).some((v) => v);

  function limpiarFiltros() {
    setFiltros({ tipo: '', estado: '', corredorVial: '' });
  }

  function abrirCrear() {
    setForm({
      nombre: '',
      tipo: 'PMV',
      ubicacion: '',
      corredorVial: 'Corredor Norte',
      estado: 'OPERATIVO',
      fechaInstalacion: new Date().toISOString().split('T')[0],
    });
    setModal({ modo: 'crear' });
  }

  function abrirEditar(a) {
    setForm({ ...a });
    setModal({ modo: 'editar', id: a.id, estadoOriginal: a.estado });
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      const { estadoOriginal, ...datosEnviar } = form;

      if (modal.modo === 'crear') {
        await api.post('/api/activos', datosEnviar);
        Swal.fire({ icon: 'success', title: 'Activo creado', text: 'El activo se registró correctamente', timer: 2000, showConfirmButton: false });
      } else {
        // Primero actualiza los datos generales
        const { estado, ...restoDatos } = datosEnviar;
        await api.put(`/api/activos/${modal.id}`, restoDatos);

        // Si el estado cambió, llamar al endpoint específico de cambio de estado
        if (estado !== estadoOriginal) {
          try {
            await api.patch(`/api/activos/${modal.id}/estado`, { estado });
            Swal.fire({ icon: 'success', title: 'Activo actualizado', text: 'Datos y estado guardados', timer: 2000, showConfirmButton: false });
          } catch (err) {
            Swal.fire('Error al cambiar estado', err.response?.data?.message || 'No se pudo cambiar el estado', 'error');
            cargar();
            return;
          }
        } else {
          Swal.fire({ icon: 'success', title: 'Activo actualizado', text: 'Los cambios se guardaron', timer: 2000, showConfirmButton: false });
        }
      }
      setModal(null);
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo guardar', 'error');
    }
  }

  const datosFiltrados = datos.filter((a) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      a.codigo?.toLowerCase().includes(term) ||
      a.nombre?.toLowerCase().includes(term) ||
      a.tipo?.toLowerCase().includes(term) ||
      a.corredorVial?.toLowerCase().includes(term)
    );
  });

  const total = todos.length;
  const operativos = todos.filter(a => a.estado === 'OPERATIVO').length;
  const enMantenimiento = todos.filter(a => a.estado === 'EN_MANTENIMIENTO').length;
  const fueraServicio = todos.filter(a => a.estado === 'FUERA_DE_SERVICIO').length;

  const filtrosUI = (
    <>
      <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
        <option value="">Tipo</option>
        {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
        <option value="">Estado</option>
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      <select value={filtros.corredorVial} onChange={(e) => setFiltros({ ...filtros, corredorVial: e.target.value })}>
        <option value="">Corredor</option>
        {CORREDORES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </>
  );

  return (
    <div className="page">
      <PageHeader
        title="Activos ITS"
        subtitle="Inventario de infraestructura operativa"
        filters={filtrosUI}
        filtersActive={filtrosActivos}
        onClearFilters={limpiarFiltros}
      />

      <KpiGrid>
        <Kpi label="Total activos" value={total} hint={`${operativos} operativos`} color="azul" />
        <Kpi label="Operativos" value={operativos} hint="en servicio" color="verde" />
        <Kpi label="En mantenimiento" value={enMantenimiento} hint="intervenidos" color="amarillo" />
        <Kpi label="Fuera de servicio" value={fueraServicio} hint="dados de baja" color="rojo" />
      </KpiGrid>

      <SearchBar
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por código, nombre, tipo o corredor..."
        action={<button className="primary" onClick={abrirCrear}>+ Nuevo activo</button>}
      />

      {cargando ? (
        <div className="loading">Cargando...</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="empty">No hay activos.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Tipo</th><th>Corredor</th><th>Estado</th><th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((a) => (
              <tr key={a.id}>
                <td>{a.codigo}</td>
                <td>{a.nombre}</td>
                <td>{a.tipo}</td>
                <td>{a.corredorVial}</td>
                <td><span className={`badge ${a.estado}`}>{a.estado}</span></td>
                <td>
                  <div className="acciones">
                    <button className="icon-btn" onClick={() => abrirEditar(a)} title="Editar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal
          titulo={modal.modo === 'crear' ? 'Nuevo activo' : 'Editar activo'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" form="activo-form" className="primary">
                {modal.modo === 'crear' ? 'Crear activo' : 'Guardar cambios'}
              </button>
            </>
          }
        >
          <form id="activo-form" onSubmit={guardar}>
            <div className="form-group">
              <label>Nombre <span className="req">*</span></label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Panel Norte 2" required />
            </div>
            <div className="form-group">
              <label>Tipo <span className="req">*</span></label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ubicación <span className="req">*</span></label>
              <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ej: Km 15 corredor norte" required />
            </div>
            <div className="form-group">
              <label>Corredor vial <span className="req">*</span></label>
              <select value={form.corredorVial} onChange={(e) => setForm({ ...form, corredorVial: e.target.value })} required>
                {CORREDORES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estado <span className="req">*</span></label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} required>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha de instalación <span className="req">*</span></label>
              <input type="date" value={form.fechaInstalacion} onChange={(e) => setForm({ ...form, fechaInstalacion: e.target.value })} required />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
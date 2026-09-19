import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Kpi, { KpiGrid } from '../components/Kpi';

const ESPECIALIDADES = ['ELECTRICIDAD', 'COMUNICACIONES', 'OBRA_CIVIL', 'MULTIDISCIPLINARIA'];
const ESTADOS = ['DISPONIBLE', 'ASIGNADA', 'INACTIVA'];
const CORREDORES = ['Corredor Norte', 'Corredor Sur', 'Corredor Oriente', 'Corredor Occidente'];

export default function Cuadrillas() {
  const [datos, setDatos] = useState([]);
  const [todos, setTodos] = useState([]);
  const [filtros, setFiltros] = useState({ especialidad: '', estado: '' });
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { cargar(); }, [filtros]);

  async function cargar() {
    setCargando(true);
    try {
      const params = new URLSearchParams(filtros).toString();
      const res = await api.get(`/api/cuadrillas?${params}`);
      setDatos(res.data.data);
      const resTodos = await api.get('/api/cuadrillas?size=100');
      setTodos(resTodos.data.data);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudieron cargar las cuadrillas', 'error');
    } finally {
      setCargando(false);
    }
  }

  const filtrosActivos = Object.values(filtros).some((v) => v);

  function limpiarFiltros() {
    setFiltros({ especialidad: '', estado: '' });
  }

  function abrirCrear() {
    setForm({
      nombre: '',
      especialidad: 'ELECTRICIDAD',
      numeroIntegrantes: 3,
      corredorVial: 'Corredor Norte',
    });
    setModal({ modo: 'crear' });
  }

  function abrirEditar(c) {
    setForm({ ...c });
    setModal({ modo: 'editar', id: c.id });
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      if (modal.modo === 'crear') {
        await api.post('/api/cuadrillas', form);
        Swal.fire({ icon: 'success', title: 'Cuadrilla creada', text: 'La cuadrilla se registró correctamente', timer: 2000, showConfirmButton: false });
      } else {
        await api.put(`/api/cuadrillas/${modal.id}`, form);
        Swal.fire({ icon: 'success', title: 'Cuadrilla actualizada', text: 'Los cambios se guardaron', timer: 2000, showConfirmButton: false });
      }
      setModal(null);
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo guardar', 'error');
    }
  }

  async function cambiarEstado(c, nuevoEstado) {
    const confirmaciones = {
      INACTIVA: '¿Desactivar esta cuadrilla?',
      DISPONIBLE: '¿Reactivar esta cuadrilla?',
    };

    const { isConfirmed } = await Swal.fire({
      title: confirmaciones[nuevoEstado],
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado === 'INACTIVA' ? '#dc2626' : '#059669',
    });
    if (!isConfirmed) return;

    try {
      await api.patch(`/api/cuadrillas/${c.id}/estado`, { estado: nuevoEstado });
      Swal.fire({ icon: 'success', title: 'Actualizada', text: `La cuadrilla pasó a ${nuevoEstado}`, timer: 2000, showConfirmButton: false });
      cargar();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo cambiar el estado', 'error');
    }
  }

  const datosFiltrados = datos.filter((c) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      c.codigo?.toLowerCase().includes(term) ||
      c.nombre?.toLowerCase().includes(term) ||
      c.especialidad?.toLowerCase().includes(term)
    );
  });

  const disponibles = todos.filter(c => c.estado === 'DISPONIBLE').length;
  const asignadas = todos.filter(c => c.estado === 'ASIGNADA').length;
  const inactivas = todos.filter(c => c.estado === 'INACTIVA').length;

  const filtrosUI = (
    <>
      <select value={filtros.especialidad} onChange={(e) => setFiltros({ ...filtros, especialidad: e.target.value })}>
        <option value="">Especialidad</option>
        {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
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
        title="Cuadrillas"
        subtitle="Equipos operativos de mantenimiento"
        filters={filtrosUI}
        filtersActive={filtrosActivos}
        onClearFilters={limpiarFiltros}
      />

      <KpiGrid>
        <Kpi label="Total cuadrillas" value={todos.length} hint={`${todos.length} equipos`} color="azul" />
        <Kpi label="Disponibles" value={disponibles} hint="listas" color="verde" />
        <Kpi label="Asignadas" value={asignadas} hint="en uso" color="amarillo" />
        <Kpi label="Inactivas" value={inactivas} hint="dadas de baja" color="gris" />
      </KpiGrid>

      <SearchBar
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por código, nombre o especialidad..."
        action={<button className="primary" onClick={abrirCrear}>+ Nueva cuadrilla</button>}
      />

      {cargando ? <div className="loading">Cargando...</div> : datosFiltrados.length === 0 ? <div className="empty">No hay cuadrillas.</div> : (
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Especialidad</th><th>Integrantes</th><th>Estado</th><th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((c) => (
              <tr key={c.id}>
                <td>{c.codigo}</td>
                <td>{c.nombre}</td>
                <td>{c.especialidad}</td>
                <td>{c.numeroIntegrantes}</td>
                <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                <td>
                  <div className="acciones">
                    <button className="icon-btn" onClick={() => abrirEditar(c)} title="Editar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    {c.estado === 'DISPONIBLE' && (
                      <button className="icon-btn icon-btn-danger" onClick={() => cambiarEstado(c, 'INACTIVA')} title="Desactivar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                      </button>
                    )}
                    {c.estado === 'INACTIVA' && (
                      <button className="icon-btn icon-btn-success" onClick={() => cambiarEstado(c, 'DISPONIBLE')} title="Reactivar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
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
          titulo={modal.modo === 'crear' ? 'Nueva cuadrilla' : 'Editar cuadrilla'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" form="cuadrilla-form" className="primary">
                {modal.modo === 'crear' ? 'Crear cuadrilla' : 'Guardar cambios'}
              </button>
            </>
          }
        >
          <form id="cuadrilla-form" onSubmit={guardar}>
            <div className="form-group">
              <label>Nombre <span className="req">*</span></label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Cuadrilla Eléctrica Norte" required />
            </div>
            <div className="form-group">
              <label>Especialidad <span className="req">*</span></label>
              <select value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })}>
                {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Número de integrantes <span className="req">*</span></label>
              <input type="number" min={2} max={10} value={form.numeroIntegrantes} onChange={(e) => setForm({ ...form, numeroIntegrantes: parseInt(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label>Corredor vial <span className="req">*</span></label>
              <select value={form.corredorVial} onChange={(e) => setForm({ ...form, corredorVial: e.target.value })}>
                {CORREDORES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
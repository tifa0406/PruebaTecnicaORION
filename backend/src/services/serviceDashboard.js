const Activo = require('../models/modelActivo');
const OrdenTrabajo = require('../models/modelOrdenTrabajo');
const Cuadrilla = require('../models/modelCuadrilla');
const OrdenCuadrilla = require('../models/modelOrdenCuadrilla');

async function obtenerIndicadores() {
  const [
    activosPorEstado,
    activosPorTipo,
    ordenesPorEstado,
    ordenesPorTipo,
    ordenesPorPrioridad,
    ordenesPorCorredor,
    cuadrillasPorEstado,
    cargaCuadrillas,
  ] = await Promise.all([
    agruparActivosPor('estado'),
    agruparActivosPor('tipo'),
    agruparOrdenesPor('estado'),
    agruparOrdenesPor('tipo'),
    agruparOrdenesPor('prioridad'),
    agruparOrdenesPorCorredor(),
    agruparCuadrillasPor('estado'),
    calcularCargaCuadrillas(),
  ]);

  return {
    activosPorEstado,
    activosPorTipo,
    ordenesPorEstado,
    ordenesPorTipo,
    ordenesPorPrioridad,
    ordenesPorCorredor,
    cuadrillasPorEstado,
    cargaCuadrillas,
  };
}

async function agruparActivosPor(campo) {
  const resultados = await Activo.findAll({
    attributes: [campo, [Activo.sequelize.fn('COUNT', campo), 'total']],
    group: [campo],
    raw: true,
  });
  return resultados.map((r) => ({ valor: r[campo], total: parseInt(r.total) }));
}

async function agruparOrdenesPor(campo) {
  const resultados = await OrdenTrabajo.findAll({
    attributes: [campo, [OrdenTrabajo.sequelize.fn('COUNT', campo), 'total']],
    group: [campo],
    raw: true,
  });
  return resultados.map((r) => ({ valor: r[campo], total: parseInt(r.total) }));
}

async function agruparOrdenesPorCorredor() {
  const resultados = await OrdenTrabajo.findAll({
    attributes: [
      [OrdenTrabajo.sequelize.col('activo.corredorVial'), 'corredorVial'],
      [OrdenTrabajo.sequelize.fn('COUNT', OrdenTrabajo.sequelize.col('OrdenTrabajo.id')), 'total'],
    ],
    include: [{ model: Activo, as: 'activo', attributes: [] }],
    where: { estado: ['ABIERTA', 'ASIGNADA', 'EN_EJECUCION'] },
    group: ['activo.corredorVial'],
    raw: true,
  });
  return resultados.map((r) => ({
    valor: r.corredorVial || 'Sin corredor',
    total: parseInt(r.total),
  }));
}

async function agruparCuadrillasPor(campo) {
  const resultados = await Cuadrilla.findAll({
    attributes: [campo, [Cuadrilla.sequelize.fn('COUNT', campo), 'total']],
    group: [campo],
    raw: true,
  });
  return resultados.map((r) => ({ valor: r[campo], total: parseInt(r.total) }));
}

async function calcularCargaCuadrillas() {
  const cuadrillas = await Cuadrilla.findAll({ raw: true });

  const resultado = await Promise.all(
    cuadrillas.map(async (c) => {
      const asignaciones = await OrdenCuadrilla.count({
        where: { cuadrillaId: c.id },
      });
      return {
        cuadrilla: c.nombre,
        codigo: c.codigo,
        asignaciones,
      };
    })
  );

  return resultado;
}

module.exports = { obtenerIndicadores };
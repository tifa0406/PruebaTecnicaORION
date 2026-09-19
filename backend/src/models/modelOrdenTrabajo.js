const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Activo = require('./modelActivo');

const OrdenTrabajo = sequelize.define('OrdenTrabajo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  tipo: {
    type: DataTypes.ENUM('PREVENTIVO', 'CORRECTIVO'),
    allowNull: false,
  },
  prioridad: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  activoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'activos', key: 'id' },
  },
  estado: {
    type: DataTypes.ENUM(
      'ABIERTA',
      'ASIGNADA',
      'EN_EJECUCION',
      'CERRADA',
      'CANCELADA'
    ),
    allowNull: false,
    defaultValue: 'ABIERTA',
  },
  fechaProgramada: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  fechaCierre: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  observacionCierre: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  motivoCancelacion: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'ordenes',
  timestamps: true,
});

Activo.hasMany(OrdenTrabajo, { foreignKey: 'activoId', as: 'ordenes' });
OrdenTrabajo.belongsTo(Activo, { foreignKey: 'activoId', as: 'activo' });

module.exports = OrdenTrabajo;
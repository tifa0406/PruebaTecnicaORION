const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activo = sequelize.define('Activo', {
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
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM(
      'PMV',
      'CCTV',
      'ESTACION_METEOROLOGICA',
      'SENSOR_TRAFICO',
      'AFORADOR'
    ),
    allowNull: false,
  },
  ubicacion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  corredorVial: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM(
      'OPERATIVO',
      'EN_MANTENIMIENTO',
      'FUERA_DE_SERVICIO'
    ),
    allowNull: false,
    defaultValue: 'OPERATIVO',
  },
  fechaInstalacion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'activos',
  timestamps: true,
});

module.exports = Activo;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cuadrilla = sequelize.define('Cuadrilla', {
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
  especialidad: {
    type: DataTypes.ENUM(
      'ELECTRICIDAD',
      'COMUNICACIONES',
      'OBRA_CIVIL',
      'MULTIDISCIPLINARIA'
    ),
    allowNull: false,
  },
  numeroIntegrantes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 2, max: 10 },
  },
  corredorVial: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('DISPONIBLE', 'ASIGNADA', 'INACTIVA'),
    allowNull: false,
    defaultValue: 'DISPONIBLE',
  },
}, {
  tableName: 'cuadrillas',
  timestamps: true,
});

module.exports = Cuadrilla;
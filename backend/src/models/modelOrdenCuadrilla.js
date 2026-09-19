const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const OrdenTrabajo = require('./modelOrdenTrabajo');
const Cuadrilla = require('./modelCuadrilla');

const OrdenCuadrilla = sequelize.define('OrdenCuadrilla', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ordenId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ordenes', key: 'id' },
  },
  cuadrillaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'cuadrillas', key: 'id' },
  },
  fechaAsignacion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechaFin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'orden_cuadrillas',
  timestamps: true,
  indexes: [
    { fields: ['cuadrillaId', 'fechaInicio', 'fechaFin'] },
  ],
});

OrdenTrabajo.belongsToMany(Cuadrilla, {
  through: OrdenCuadrilla,
  foreignKey: 'ordenId',
  otherKey: 'cuadrillaId',
  as: 'cuadrillas',
});

Cuadrilla.belongsToMany(OrdenTrabajo, {
  through: OrdenCuadrilla,
  foreignKey: 'cuadrillaId',
  otherKey: 'ordenId',
  as: 'ordenes',
});

OrdenCuadrilla.belongsTo(OrdenTrabajo, { foreignKey: 'ordenId', as: 'orden' });
OrdenCuadrilla.belongsTo(Cuadrilla, { foreignKey: 'cuadrillaId', as: 'cuadrilla' });

module.exports = OrdenCuadrilla;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Corredor = sequelize.define('Corredor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'corredores',
  timestamps: true,
});

module.exports = Corredor;
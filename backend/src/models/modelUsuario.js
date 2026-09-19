const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('SUPERVISOR', 'COORDINADOR', 'TECNICO'),
    allowNull: false,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

module.exports = Usuario;
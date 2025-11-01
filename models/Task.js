const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'completed'),
    defaultValue: 'open',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['assignedToId'] },
    { fields: ['createdById'] },
    { fields: ['teamId'] },
    { fields: ['dueDate'] }
  ]
});

module.exports = Task;


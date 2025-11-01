const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'comments',
  timestamps: true,
  indexes: [
    { fields: ['taskId'] },
    { fields: ['userId'] }
  ]
});

module.exports = Comment;


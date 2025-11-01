const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attachment = sequelize.define('Attachment', {
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
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filepath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  filesize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'attachments',
  timestamps: true,
  indexes: [
    { fields: ['taskId'] },
    { fields: ['userId'] }
  ]
});

module.exports = Attachment;


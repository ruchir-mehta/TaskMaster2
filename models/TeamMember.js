const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
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
  role: {
    type: DataTypes.ENUM('owner', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'team_members',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['teamId', 'userId']
    }
  ]
});

module.exports = TeamMember;


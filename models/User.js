const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password before creating user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password before updating user if password changed
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get safe user data (without password)
User.prototype.toSafeObject = function() {
  const { password, ...safeUser } = this.toJSON();
  return safeUser;
};

module.exports = User;


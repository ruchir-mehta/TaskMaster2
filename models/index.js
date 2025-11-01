const { sequelize } = require('../config/database');
const User = require('./User');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const Task = require('./Task');
const Comment = require('./Comment');
const Attachment = require('./Attachment');

// Define associations
// User associations
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
User.hasMany(Team, { foreignKey: 'ownerId', as: 'ownedTeams' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(Attachment, { foreignKey: 'userId', as: 'attachments' });
User.belongsToMany(Team, { through: TeamMember, foreignKey: 'userId', as: 'teams' });

// Team associations
Team.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Team.hasMany(Task, { foreignKey: 'teamId', as: 'tasks' });
Team.belongsToMany(User, { through: TeamMember, foreignKey: 'teamId', as: 'members' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'teamMembers' });

// TeamMember associations
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// Task associations
Task.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignee' });
Task.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
Task.hasMany(Attachment, { foreignKey: 'taskId', as: 'attachments' });

// Comment associations
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Attachment associations
Attachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Attachment.belongsTo(User, { foreignKey: 'userId', as: 'uploader' });

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✓ Database synchronized ${force ? '(forced)' : ''}`);
  } catch (error) {
    console.error('✗ Database sync failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Team,
  TeamMember,
  Task,
  Comment,
  Attachment,
  syncDatabase
};


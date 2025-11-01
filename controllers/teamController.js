const { Team, User, TeamMember, Task } = require('../models');
const { emitNotification } = require('../utils/socketManager');

// Create a new team
const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Create team
    const team = await Team.create({
      name,
      description,
      ownerId: req.session.userId
    });

    // Add creator as a team member with owner role
    await TeamMember.create({
      teamId: team.id,
      userId: req.session.userId,
      role: 'owner'
    });

    // Fetch complete team with associations
    const completeTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] },
        {
          model: User,
          as: 'members',
          through: { attributes: ['role', 'joinedAt'] },
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        team: completeTeam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all teams for current user
const getTeams = async (req, res, next) => {
  try {
    // Get teams where user is a member
    const teamMembers = await TeamMember.findAll({
      where: { userId: req.session.userId },
      include: [
        {
          model: Team,
          as: 'team',
          include: [
            { model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] },
            {
              model: User,
              as: 'members',
              through: { attributes: ['role', 'joinedAt'] },
              attributes: ['id', 'email', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    const teams = teamMembers.map(tm => ({
      ...tm.team.toJSON(),
      userRole: tm.role
    }));

    res.status(200).json({
      success: true,
      data: {
        teams
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get team by ID
const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] },
        {
          model: User,
          as: 'members',
          through: { attributes: ['role', 'joinedAt'] },
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    const isMember = await TeamMember.findOne({
      where: {
        teamId: id,
        userId: req.session.userId
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        team: {
          ...team.toJSON(),
          userRole: isMember.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update team
const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only owner can update team
    if (team.ownerId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can update this team'
      });
    }

    // Update fields
    if (name) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();

    // Fetch updated team with associations
    const updatedTeam = await Team.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] },
        {
          model: User,
          as: 'members',
          through: { attributes: ['role', 'joinedAt'] },
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: {
        team: updatedTeam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete team
const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only owner can delete team
    if (team.ownerId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can delete this team'
      });
    }

    // Delete associated team members and tasks
    await TeamMember.destroy({ where: { teamId: id } });
    await Task.update({ teamId: null }, { where: { teamId: id } });

    await team.destroy();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add member to team
const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only owner can add members
    if (team.ownerId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can add members'
      });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({
      where: {
        teamId: id,
        userId
      }
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }

    // Add member
    await TeamMember.create({
      teamId: id,
      userId,
      role: 'member'
    });

    // Notify new member
    emitNotification(userId, {
      type: 'team_invitation',
      message: `You have been added to team: ${team.name}`,
      teamId: team.id
    });

    // Fetch updated team
    const updatedTeam = await Team.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] },
        {
          model: User,
          as: 'members',
          through: { attributes: ['role', 'joinedAt'] },
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: {
        team: updatedTeam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from team
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Owner can remove anyone, members can remove themselves
    const isOwner = team.ownerId === req.session.userId;
    const isSelf = parseInt(userId) === req.session.userId;

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove this member'
      });
    }

    // Cannot remove the owner
    if (parseInt(userId) === team.ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the team owner. Transfer ownership or delete the team instead.'
      });
    }

    // Remove member
    const deleted = await TeamMember.destroy({
      where: {
        teamId: id,
        userId
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this team'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all tasks for a team
const getTeamTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    const isMember = await TeamMember.findOne({
      where: {
        teamId: id,
        userId: req.session.userId
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Build where clause
    const where = { teamId: id };
    if (status) {
      where.status = status;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch tasks
    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  getTeamTasks
};


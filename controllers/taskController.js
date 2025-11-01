const { Task, User, Team, Comment, Attachment } = require('../models');
const { Op } = require('sequelize');
const { emitNotification } = require('../utils/socketManager');

// Create a new task
const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, assignedToId, teamId } = req.body;

    // Verify assigned user exists if provided
    if (assignedToId) {
      const assignedUser = await User.findByPk(assignedToId);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    // Verify team exists if provided
    if (teamId) {
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority: priority || 'medium',
      createdById: req.session.userId,
      assignedToId,
      teamId,
      status: 'open'
    });

    // Fetch complete task with associations
    const completeTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Team, as: 'team', attributes: ['id', 'name'] }
      ]
    });

    // Send notification to assigned user
    if (assignedToId) {
      emitNotification(assignedToId, {
        type: 'task_assigned',
        message: `You have been assigned a new task: ${title}`,
        taskId: task.id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: completeTask
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all tasks with filters
const getTasks = async (req, res, next) => {
  try {
    const { status, assignedTo, teamId, search, sortBy = 'createdAt', order = 'DESC', page = 1, limit = 10 } = req.query;
    
    // Build where clause
    const where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Filter by assigned user
    if (assignedTo) {
      where.assignedToId = assignedTo;
    }
    
    // Filter by team
    if (teamId) {
      where.teamId = teamId;
    }
    
    // Search in title and description
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // If no filters are provided, show tasks relevant to the user
    if (!status && !assignedTo && !teamId && !search) {
      where[Op.or] = [
        { createdById: req.session.userId },
        { assignedToId: req.session.userId }
      ];
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch tasks
    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Team, as: 'team', attributes: ['id', 'name'] }
      ],
      order: [[sortBy, order.toUpperCase()]],
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

// Get single task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Team, as: 'team', attributes: ['id', 'name'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'email', 'firstName', 'lastName'] }],
          order: [['createdAt', 'DESC']]
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [{ model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update task
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, status, priority, assignedToId } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to update (creator or assignee)
    if (task.createdById !== req.session.userId && task.assignedToId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task'
      });
    }

    // Verify assigned user exists if being changed
    if (assignedToId && assignedToId !== task.assignedToId) {
      const assignedUser = await User.findByPk(assignedToId);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    // Track if assignment changed
    const assignmentChanged = assignedToId && assignedToId !== task.assignedToId;
    const previousAssignee = task.assignedToId;

    // Update task fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedToId !== undefined) task.assignedToId = assignedToId;

    await task.save();

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Team, as: 'team', attributes: ['id', 'name'] }
      ]
    });

    // Send notifications
    if (assignmentChanged) {
      // Notify new assignee
      emitNotification(assignedToId, {
        type: 'task_assigned',
        message: `You have been assigned to task: ${task.title}`,
        taskId: task.id
      });

      // Notify previous assignee if there was one
      if (previousAssignee) {
        emitNotification(previousAssignee, {
          type: 'task_updated',
          message: `Task "${task.title}" has been reassigned`,
          taskId: task.id
        });
      }
    } else {
      // Notify assignee of update if they're not the one updating
      if (task.assignedToId && task.assignedToId !== req.session.userId) {
        emitNotification(task.assignedToId, {
          type: 'task_updated',
          message: `Task "${task.title}" has been updated`,
          taskId: task.id
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete task
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only creator can delete
    if (task.createdById !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator can delete this task'
      });
    }

    await task.destroy();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Mark task as completed
const completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission (creator or assignee)
    if (task.createdById !== req.session.userId && task.assignedToId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to complete this task'
      });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Team, as: 'team', attributes: ['id', 'name'] }
      ]
    });

    // Notify creator if someone else completed it
    if (task.createdById !== req.session.userId) {
      emitNotification(task.createdById, {
        type: 'task_completed',
        message: `Task "${task.title}" has been completed`,
        taskId: task.id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task marked as completed',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    next(error);
  }
};

// Assign task to user
const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only creator can assign
    if (task.createdById !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator can assign this task'
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

    const previousAssignee = task.assignedToId;
    task.assignedToId = userId;
    await task.save();

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Team, as: 'team', attributes: ['id', 'name'] }
      ]
    });

    // Notify new assignee
    emitNotification(userId, {
      type: 'task_assigned',
      message: `You have been assigned to task: ${task.title}`,
      taskId: task.id
    });

    // Notify previous assignee if there was one
    if (previousAssignee && previousAssignee !== userId) {
      emitNotification(previousAssignee, {
        type: 'task_updated',
        message: `Task "${task.title}" has been reassigned`,
        taskId: task.id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  assignTask
};


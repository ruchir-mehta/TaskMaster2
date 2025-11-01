const { Comment, Attachment, Task, User } = require('../models');
const { emitNotification } = require('../utils/socketManager');
const fs = require('fs').promises;
const path = require('path');

// Add comment to task
const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    // Verify task exists
    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'creator', attributes: ['id'] },
        { model: User, as: 'assignee', attributes: ['id'] }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      taskId,
      userId: req.session.userId,
      content
    });

    // Fetch complete comment with author info
    const completeComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });

    // Notify task creator and assignee (if not the commenter)
    const notificationRecipients = new Set();
    if (task.createdById && task.createdById !== req.session.userId) {
      notificationRecipients.add(task.createdById);
    }
    if (task.assignedToId && task.assignedToId !== req.session.userId) {
      notificationRecipients.add(task.assignedToId);
    }

    notificationRecipients.forEach(userId => {
      emitNotification(userId, {
        type: 'new_comment',
        message: `New comment on task: ${task.title}`,
        taskId: task.id,
        commentId: comment.id
      });
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: completeComment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all comments for a task
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Fetch comments
    const comments = await Comment.findAll({
      where: { taskId },
      include: [
        { model: User, as: 'author', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        comments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment
const deleteComment = async (req, res, next) => {
  try {
    const { taskId, commentId } = req.params;

    const comment = await Comment.findOne({
      where: {
        id: commentId,
        taskId
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only comment author can delete
    if (comment.userId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    await comment.destroy();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Upload attachment to task
const uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      // Clean up uploaded file if task doesn't exist
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create attachment record
    const attachment = await Attachment.create({
      taskId,
      userId: req.session.userId,
      filename: req.file.originalname,
      filepath: req.file.path,
      filesize: req.file.size,
      mimetype: req.file.mimetype
    });

    // Fetch complete attachment with uploader info
    const completeAttachment = await Attachment.findByPk(attachment.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        attachment: completeAttachment
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

// Get all attachments for a task
const getAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Fetch attachments
    const attachments = await Attachment.findAll({
      where: { taskId },
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        attachments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete attachment
const deleteAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params;

    const attachment = await Attachment.findOne({
      where: {
        id: attachmentId,
        taskId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Only attachment uploader can delete
    if (attachment.userId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own attachments'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(attachment.filepath);
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue even if file deletion fails
    }

    // Delete database record
    await attachment.destroy();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Download attachment
const downloadAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params;

    const attachment = await Attachment.findOne({
      where: {
        id: attachmentId,
        taskId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(attachment.filepath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file
    res.download(attachment.filepath, attachment.filename);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  downloadAttachment
};


const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  validate
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  validate
];

// Task validation rules
const validateTaskCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assignedToId')
    .optional()
    .isInt()
    .withMessage('Assigned user ID must be a valid integer'),
  body('teamId')
    .optional()
    .isInt()
    .withMessage('Team ID must be a valid integer'),
  validate
];

const validateTaskUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'completed'])
    .withMessage('Status must be open, in_progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assignedToId')
    .optional()
    .isInt()
    .withMessage('Assigned user ID must be a valid integer'),
  validate
];

// Team validation rules
const validateTeamCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Team name is required')
    .isLength({ max: 255 })
    .withMessage('Team name must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  validate
];

const validateTeamUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Team name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Team name must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  validate
];

const validateAddMember = [
  body('userId')
    .isInt()
    .withMessage('User ID must be a valid integer'),
  validate
];

// Comment validation rules
const validateComment = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required'),
  validate
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer'),
  validate
];

const validateTaskId = [
  param('taskId')
    .isInt()
    .withMessage('Task ID must be a valid integer'),
  validate
];

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateTaskCreate,
  validateTaskUpdate,
  validateTeamCreate,
  validateTeamUpdate,
  validateAddMember,
  validateComment,
  validateId,
  validateTaskId
};


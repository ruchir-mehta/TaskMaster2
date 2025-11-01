const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isAuthenticated } = require('../middleware/auth');
const { validateTaskCreate, validateTaskUpdate, validateId } = require('../middleware/validation');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

// All task routes require authentication
router.use(isAuthenticated);

// Task CRUD operations
router.post('/', validateTaskCreate, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', validateId, taskController.getTaskById);
router.put('/:id', validateId, validateTaskUpdate, taskController.updateTask);
router.delete('/:id', validateId, taskController.deleteTask);

// Task actions
router.patch('/:id/complete', validateId, taskController.completeTask);
router.patch(
  '/:id/assign',
  validateId,
  body('userId').isInt().withMessage('User ID must be a valid integer'),
  validate,
  taskController.assignTask
);

module.exports = router;


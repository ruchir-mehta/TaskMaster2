const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { isAuthenticated } = require('../middleware/auth');
const {
  validateTeamCreate,
  validateTeamUpdate,
  validateAddMember,
  validateId
} = require('../middleware/validation');

// All team routes require authentication
router.use(isAuthenticated);

// Team CRUD operations
router.post('/', validateTeamCreate, teamController.createTeam);
router.get('/', teamController.getTeams);
router.get('/:id', validateId, teamController.getTeamById);
router.put('/:id', validateId, validateTeamUpdate, teamController.updateTeam);
router.delete('/:id', validateId, teamController.deleteTeam);

// Team member management
router.post('/:id/members', validateId, validateAddMember, teamController.addMember);
router.delete('/:id/members/:userId', validateId, teamController.removeMember);

// Team tasks
router.get('/:id/tasks', validateId, teamController.getTeamTasks);

module.exports = router;


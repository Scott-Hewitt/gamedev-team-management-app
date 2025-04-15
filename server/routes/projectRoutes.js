const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');

// All routes are protected
router.post('/', auth, validateProject, projectController.createProject);
router.get('/', auth, projectController.getAllProjects);
router.get('/:id', auth, projectController.getProjectById);
router.put('/:id', auth, validateProject, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);
router.get('/:id/tasks', auth, projectController.getProjectTasks);
router.get('/:id/stats', auth, projectController.getProjectStats);

// Team management routes
router.get('/:id/team', auth, projectController.getProjectTeam);
router.post('/:id/team', auth, projectController.addTeamMember);
router.delete('/:id/team/:userId', auth, projectController.removeTeamMember);

module.exports = router;

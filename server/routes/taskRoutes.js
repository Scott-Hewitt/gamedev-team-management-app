const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { validateTask } = require('../middleware/validation');

// All routes are protected
router.post('/', auth, validateTask, taskController.createTask);
router.get('/', auth, taskController.getAllTasks);
router.get('/:id', auth, taskController.getTaskById);
router.put('/:id', auth, validateTask, taskController.updateTask);
router.delete('/:id', auth, taskController.deleteTask);
router.post('/:id/assign', auth, taskController.assignTask);
router.put('/:id/status', auth, taskController.updateTaskStatus);

// New endpoints for individual user assignment
router.post('/:id/assign-user', auth, taskController.assignSingleUser);
router.delete('/:id/assign/:userId', auth, taskController.removeUserFromTask);

module.exports = router;

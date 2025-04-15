const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

// Public routes
router.post('/register', validateUser, userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.put('/:id', auth, validateUser, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);
router.get('/:id/tasks', auth, userController.getUserTasks);
router.get('/:id/projects', auth, userController.getUserProjects);

module.exports = router;

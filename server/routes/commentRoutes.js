const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Create a new comment
router.post('/', auth, commentController.createComment);

// Get all comments for a task
router.get('/task/:task_id', auth, commentController.getTaskComments);

// Update a comment
router.put('/:id', auth, commentController.updateComment);

// Delete a comment
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;

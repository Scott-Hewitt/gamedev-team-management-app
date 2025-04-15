const { Comment, User, Task, sequelize } = require('../models');

// Create a new comment
const createComment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { task_id, content } = req.body;
    const user_id = req.user.id;

    // Check if task exists
    const task = await Task.findByPk(task_id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create comment
    const comment = await Comment.create({
      content,
      task_id,
      user_id
    }, { transaction });

    await transaction.commit();

    // Get comment with author details
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email', 'role']
      }]
    });

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createComment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all comments for a task
const getTaskComments = async (req, res) => {
  try {
    const { task_id } = req.params;

    // Check if task exists
    const task = await Task.findByPk(task_id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get comments for task
    const comments = await Comment.findAll({
      where: { task_id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('Error in getTaskComments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    // Check if comment exists
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author of the comment
    if (comment.user_id !== user_id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    // Update comment
    await comment.update({ content }, { transaction });

    await transaction.commit();

    // Get updated comment with author details
    const updatedComment = await Comment.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email', 'role']
      }]
    });

    res.json(updatedComment);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateComment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if comment exists
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author of the comment or an admin/manager
    if (comment.user_id !== user_id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete comment
    await comment.destroy({ transaction });

    await transaction.commit();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteComment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment
};

const { Task, User, Project, UserTask, sequelize } = require('../models');

// Create a new task
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      estimated_hours,
      due_date,
      project_id,
      assignee_ids
    } = req.body;

    // Check if project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      status: status || 'backlog',
      priority: priority || 'medium',
      estimated_hours,
      due_date,
      project_id,
      creator_id: req.user.id
    });

    // Assign task to users if assignee_ids provided
    if (assignee_ids && assignee_ids.length > 0) {
      // Check if all users exist
      const users = await User.findAll({
        where: { id: assignee_ids }
      });

      if (users.length !== assignee_ids.length) {
        return res.status(404).json({ message: 'One or more assignees not found' });
      }

      // Add assignees
      await task.addAssignees(users);
    }

    // Get task with assignees
    const taskWithAssignees = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: taskWithAssignees
    });
  } catch (error) {
    console.error('Error in createTask:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, projectId } = req.query;

    // Build where clause based on filters
    const whereClause = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (projectId) whereClause.project_id = projectId;

    console.log('Task filters:', { status, priority, projectId });
    console.log('Where clause:', whereClause);

    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    console.log(`Found ${tasks.length} tasks matching filters`);
    res.json(tasks);
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: ['status', 'assignment_date'] }
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error in getTaskById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      estimated_hours,
      actual_hours,
      due_date,
      project_id
    } = req.body;

    // Check if task exists
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to update task
    const isProjectManager = task.project.manager_id === req.user.id;
    const isTaskCreator = task.creator_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isProjectManager && !isTaskCreator && !isAdmin) {
      // Check if user is assigned to the task
      const isAssignee = await UserTask.findOne({
        where: {
          user_id: req.user.id,
          task_id: id
        }
      });

      if (!isAssignee) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }

      // Assignees can only update status and actual_hours
      if (title || description || priority || estimated_hours || due_date || project_id) {
        return res.status(403).json({
          message: 'Assignees can only update status and actual hours'
        });
      }
    }

    // If changing project, check if new project exists
    if (project_id && project_id !== task.project_id) {
      const newProject = await Project.findByPk(project_id);
      if (!newProject) {
        return res.status(404).json({ message: 'New project not found' });
      }

      // Only project manager or admin can move tasks between projects
      if (!isAdmin && newProject.manager_id !== req.user.id) {
        return res.status(403).json({
          message: 'Not authorized to move task to this project'
        });
      }
    }

    // Update task data
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
    if (actual_hours !== undefined) updateData.actual_hours = actual_hours;
    if (due_date) updateData.due_date = due_date;
    if (project_id) updateData.project_id = project_id;

    await task.update(updateData);

    // Get updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error in updateTask:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Check if task exists
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to delete task
    const isProjectManager = task.project.manager_id === req.user.id;
    const isTaskCreator = task.creator_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isProjectManager && !isTaskCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    // Delete task
    await task.destroy({ transaction });

    await transaction.commit();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteTask:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign task to users
const assignTask = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Check if task exists
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to assign task
    const isProjectManager = task.project.manager_id === req.user.id;
    const isTaskCreator = task.creator_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isProjectManager && !isTaskCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to assign this task' });
    }

    // Check if all users exist
    const users = await User.findAll({
      where: { id: user_ids }
    });

    if (users.length !== user_ids.length) {
      return res.status(404).json({ message: 'One or more users not found' });
    }

    // Remove current assignees and add new ones
    await task.setAssignees(users, { transaction });

    await transaction.commit();

    // Get updated task with assignees
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: ['status', 'assignment_date'] }
        }
      ]
    });

    res.json({
      message: 'Task assigned successfully',
      assignees: updatedTask.assignees
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in assignTask:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update task assignment status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['assigned', 'in_progress', 'completed', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    // Check if task exists
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to the task
    const assignment = await UserTask.findOne({
      where: {
        user_id: req.user.id,
        task_id: id
      }
    });

    if (!assignment) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    // Update assignment status
    await assignment.update({ status });

    // If all assignees have completed the task, update task status to 'done'
    if (status === 'completed') {
      const allAssignments = await UserTask.findAll({
        where: { task_id: id }
      });

      const allCompleted = allAssignments.every(a => a.status === 'completed');

      if (allCompleted) {
        await task.update({ status: 'done' });
      }
    }

    res.json({
      message: 'Task status updated successfully',
      assignment: {
        task_id: assignment.task_id,
        user_id: assignment.user_id,
        status: assignment.status,
        assignment_date: assignment.assignment_date
      }
    });
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign single user to task
const assignSingleUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if task exists
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to assign task
    const isProjectManager = task.project && task.project.manager_id === req.user.id;
    const isTaskCreator = task.creator_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isProjectManager && !isTaskCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to assign this task' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already assigned
    const existingAssignment = await UserTask.findOne({
      where: { task_id: id, user_id: userId }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'User is already assigned to this task' });
    }

    // Add user to task
    await UserTask.create({ task_id: id, user_id: userId }, { transaction });

    await transaction.commit();

    // Get updated task with assignees
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json(updatedTask);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in assignSingleUser:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove user from task
const removeUserFromTask = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, userId } = req.params;

    // Check if task exists
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to modify task
    const isProjectManager = task.project && task.project.manager_id === req.user.id;
    const isTaskCreator = task.creator_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isProjectManager && !isTaskCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to modify this task' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is assigned to task
    const assignment = await UserTask.findOne({
      where: { task_id: id, user_id: userId }
    });

    if (!assignment) {
      return res.status(400).json({ message: 'User is not assigned to this task' });
    }

    // Remove user from task
    await assignment.destroy({ transaction });

    await transaction.commit();

    // Get updated task with assignees
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json(updatedTask);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in removeUserFromTask:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  assignSingleUser,
  removeUserFromTask
};

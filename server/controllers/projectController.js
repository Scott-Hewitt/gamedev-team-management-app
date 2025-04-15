const { Project, User, Task, sequelize } = require('../models');

// Project management functions
const createProject = async (req, res) => {
  try {
    const { title, description, status, start_date, end_date } = req.body;

    const project = await Project.create({
      title,
      description,
      status: status || 'planning',
      start_date,
      end_date,
      manager_id: req.user.id
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json(projects);
  } catch (error) {
    console.error('Error in getAllProjects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: User,
              as: 'assignees',
              attributes: ['id', 'username', 'email', 'role'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error in getProjectById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, start_date, end_date, manager_id } = req.body;

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to update project
    if (project.manager_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // Update project data
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;

    // Only admin or current manager can change manager
    if (manager_id && (req.user.role === 'admin' || project.manager_id === req.user.id)) {
      // Check if new manager exists
      const newManager = await User.findByPk(manager_id);
      if (!newManager) {
        return res.status(404).json({ message: 'New manager not found' });
      }

      updateData.manager_id = manager_id;
    }

    await project.update(updateData);

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to delete project
    if (project.manager_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Delete project (cascade will delete associated tasks)
    await project.destroy({ transaction });

    await transaction.commit();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteProject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get tasks for project
    const tasks = await Task.findAll({
      where: { project_id: id },
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error in getProjectTasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProjectStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get tasks for project
    const tasks = await Task.findAll({
      where: { project_id: id },
      attributes: ['status', 'estimated_hours', 'actual_hours']
    });

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const backlogTasks = tasks.filter(task => task.status === 'backlog').length;
    const todoTasks = tasks.filter(task => task.status === 'todo').length;
    const reviewTasks = tasks.filter(task => task.status === 'review').length;

    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const totalActualHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);

    const stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      backlogTasks,
      todoTasks,
      reviewTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalEstimatedHours,
      totalActualHours,
      hoursVariance: totalEstimatedHours - totalActualHours
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in getProjectStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Team management functions
const getProjectTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project manager
    const manager = await User.findByPk(project.manager_id, {
      attributes: ['id', 'username', 'email', 'role']
    });

    // Get users assigned to tasks in this project
    const projectTasks = await Task.findAll({
      where: { project_id: id },
      include: [{
        model: User,
        as: 'assignees',
        attributes: ['id', 'username', 'email', 'role'],
        through: { attributes: [] }
      }]
    });

    // Extract unique users from tasks
    const teamMembersMap = new Map();

    // Add manager to team
    if (manager) {
      teamMembersMap.set(manager.id, {
        ...manager.toJSON(),
        UserProject: { role: 'manager' }
      });
    }

    // Add task assignees to team
    projectTasks.forEach(task => {
      task.assignees.forEach(user => {
        if (!teamMembersMap.has(user.id)) {
          teamMembersMap.set(user.id, {
            ...user.toJSON(),
            UserProject: { role: 'member' },
            tasks: []
          });
        }

        // Add task to user's tasks
        const userObj = teamMembersMap.get(user.id);
        if (!userObj.tasks) userObj.tasks = [];
        userObj.tasks.push({
          id: task.id,
          title: task.title,
          status: task.status
        });
      });
    });

    // Convert map to array
    const teamMembers = Array.from(teamMembersMap.values());

    res.json(teamMembers);
  } catch (error) {
    console.error('Error in getProjectTeam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to modify project team
    const isProjectManager = project.manager_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isProjectManager && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to modify project team' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Assign user to a task in the project to make them part of the team
    // Find a task in the project
    const task = await Task.findOne({ where: { project_id: id } });

    if (!task) {
      // If no tasks exist, create a placeholder task
      const newTask = await Task.create({
        title: 'Project Setup',
        description: 'Initial project setup and planning',
        status: 'todo',
        priority: 'medium',
        project_id: id,
        creator_id: req.user.id
      });

      // Assign user to the new task
      await newTask.addAssignee(user);
    } else {
      // Assign user to existing task
      await task.addAssignee(user);
    }

    // Get updated team
    const teamMembers = await getProjectTeamHelper(id);

    res.json(teamMembers);
  } catch (error) {
    console.error('Error in addTeamMember:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const removeTeamMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to modify project team
    const isProjectManager = project.manager_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isProjectManager && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to modify project team' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from all tasks in the project
    const projectTasks = await Task.findAll({ where: { project_id: id } });

    for (const task of projectTasks) {
      await task.removeAssignee(user);
    }

    // Get updated team
    const teamMembers = await getProjectTeamHelper(id);

    res.json(teamMembers);
  } catch (error) {
    console.error('Error in removeTeamMember:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function getProjectTeamHelper(projectId) {
  // Check if project exists
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Get project manager
  const manager = await User.findByPk(project.manager_id, {
    attributes: ['id', 'username', 'email', 'role']
  });

  // Get users assigned to tasks in this project
  const projectTasks = await Task.findAll({
    where: { project_id: projectId },
    include: [{
      model: User,
      as: 'assignees',
      attributes: ['id', 'username', 'email', 'role'],
      through: { attributes: [] }
    }]
  });

  // Extract unique users from tasks
  const teamMembersMap = new Map();

  // Add manager to team
  if (manager) {
    teamMembersMap.set(manager.id, {
      ...manager.toJSON(),
      UserProject: { role: 'manager' }
    });
  }

  // Add task assignees to team
  projectTasks.forEach(task => {
    task.assignees.forEach(user => {
      if (!teamMembersMap.has(user.id)) {
        teamMembersMap.set(user.id, {
          ...user.toJSON(),
          UserProject: { role: 'member' },
          tasks: []
        });
      }

      // Add task to user's tasks
      const userObj = teamMembersMap.get(user.id);
      if (!userObj.tasks) userObj.tasks = [];
      userObj.tasks.push({
        id: task.id,
        title: task.title,
        status: task.status
      });
    });
  });

  // Convert map to array
  return Array.from(teamMembersMap.values());
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectTasks,
  getProjectStats,
  getProjectTeam,
  addTeamMember,
  removeTeamMember
};

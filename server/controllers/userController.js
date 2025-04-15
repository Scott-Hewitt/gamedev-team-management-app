const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Project, Task, UserTask, sequelize } = require('../models');

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'developer'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    console.log('Email:', email);
    console.log('Password:', password);

    // Check if user exists - use case-insensitive search
    console.log('Searching for user with email (case-insensitive):', email);

    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        sequelize.fn('LOWER', email)
      )
    });

    console.log('User found:', user ? `ID: ${user.id}, Email: ${user.email}` : 'No user found');

    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Comparing password with hash:', user.password.substring(0, 20) + '...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // Get all users with basic attributes
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
    });

    // Get all task assignments
    const allTaskAssignments = await UserTask.findAll();

    // Get all tasks with their project IDs
    const allTasks = await Task.findAll({
      attributes: ['id', 'project_id'],
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id']
      }]
    });

    // Get all projects
    const allProjects = await Project.findAll();

    // For each user, calculate their tasks and projects
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      // Get tasks assigned to this user
      const userTaskAssignments = allTaskAssignments.filter(ta => ta.user_id === user.id);
      const userTaskCount = userTaskAssignments.length;

      // Get task IDs assigned to this user
      const userTaskIds = userTaskAssignments.map(ta => ta.task_id);

      // Get projects from these tasks
      const userTaskProjects = allTasks
        .filter(task => userTaskIds.includes(task.id) && task.project_id)
        .map(task => task.project_id);

      // Get projects managed by this user
      const userManagedProjects = allProjects
        .filter(p => p.manager_id === user.id)
        .map(p => p.id);

      // Combine both lists and remove duplicates
      const allUserProjectIds = [...new Set([...userTaskProjects, ...userManagedProjects])];
      const userProjectCount = allUserProjectIds.length;

      // Return user with counts
      return {
        ...user.toJSON(),
        projects: userProjectCount,
        tasks: userTaskCount
      };
    }));

    res.json(usersWithCounts);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if authenticated user is updating their own profile or is an admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Update user data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role && req.user.role === 'admin') updateData.role = role;

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete users' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's assigned tasks
const getUserTasks = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get tasks assigned to user
    const tasks = await user.getAssignedTasks({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });

    console.log(`Found ${tasks.length} tasks assigned to user ${id}`);
    res.json(tasks);
  } catch (error) {
    console.error('Error in getUserTasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's projects (both managed and assigned)
const getUserProjects = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get projects managed by user
    const managedProjects = await Project.findAll({
      where: { manager_id: id },
      include: [
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    // Since we don't have a proper user_projects table, we'll get projects through tasks
    // Get all tasks assigned to the user
    const userTasks = await user.getAssignedTasks({
      include: [{
        model: Project,
        as: 'project',
        include: [{
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status']
        }]
      }]
    });

    // Extract unique projects from tasks
    const projectsFromTasks = userTasks
      .filter(task => task.project) // Filter out tasks without a project
      .map(task => task.project);

    // Remove duplicates by project ID
    const projectIds = new Set();
    const uniqueProjectsFromTasks = projectsFromTasks.filter(project => {
      if (projectIds.has(project.id)) {
        return false;
      }
      projectIds.add(project.id);
      return true;
    });

    // Combine managed projects and projects from tasks
    const allProjects = [...managedProjects];

    // Add projects from tasks that aren't already in the managed projects list
    uniqueProjectsFromTasks.forEach(project => {
      if (!allProjects.some(p => p.id === project.id)) {
        allProjects.push(project);
      }
    });

    console.log(`Found ${allProjects.length} projects for user ${id}`);
    res.json(allProjects);
  } catch (error) {
    console.error('Error in getUserProjects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserTasks,
  getUserProjects
};

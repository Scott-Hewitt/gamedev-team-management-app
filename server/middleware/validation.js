// Validation middleware for request data
const validateUser = (req, res, next) => {
  const { username, email, password, role } = req.body;
  const errors = [];

  // Validate username
  if (!username || username.trim() === '') {
    errors.push('Username is required');
  } else if (username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  }

  // Validate email
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate password
  if (!password || password.trim() === '') {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Validate role if provided
  if (role && !['admin', 'manager', 'developer', 'designer', 'tester'].includes(role)) {
    errors.push('Invalid role');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateProject = (req, res, next) => {
  const { title, description, status, start_date, end_date } = req.body;
  const errors = [];

  // Validate title
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  } else if (title.length < 3 || title.length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }

  // Validate status if provided
  if (status && !['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].includes(status)) {
    errors.push('Invalid status');
  }

  // Validate dates if provided
  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format');
    }
    
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
    }
    
    if (startDate > endDate) {
      errors.push('End date must be after start date');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateTask = (req, res, next) => {
  const { title, description, status, priority, estimated_hours, due_date } = req.body;
  const errors = [];

  // Validate title
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  } else if (title.length < 3 || title.length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }

  // Validate status if provided
  if (status && !['backlog', 'todo', 'in_progress', 'review', 'done'].includes(status)) {
    errors.push('Invalid status');
  }

  // Validate priority if provided
  if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
    errors.push('Invalid priority');
  }

  // Validate estimated_hours if provided
  if (estimated_hours && (isNaN(estimated_hours) || estimated_hours < 0)) {
    errors.push('Estimated hours must be a positive number');
  }

  // Validate due_date if provided
  if (due_date) {
    const dueDate = new Date(due_date);
    
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = {
  validateUser,
  validateProject,
  validateTask
};

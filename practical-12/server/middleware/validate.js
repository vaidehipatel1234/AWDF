const mongoose = require('mongoose');

/**
 * Server-side Input Validation Middleware Pipeline (Practical 7)
 * Intercepts requests and enforces field validation before reaching controllers.
 */

// Validate user registration input
const validateRegister = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Email is required and cannot be empty.'
    });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Password is required.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.'
    });
  }

  next();
};

// Validate user login input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Email is required.'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Password is required.'
    });
  }

  next();
};

// Validate task creation and update input
const validateTask = (req, res, next) => {
  const { title, priority } = req.body || {};

  // For POST creation, title is strictly required
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required and cannot be empty.'
      });
    }
  }

  // For PUT update, if title is provided, ensure it's not empty string
  if (req.method === 'PUT' && title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title cannot be empty.'
      });
    }
  }

  // Validate priority if provided
  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (typeof priority !== 'string' || !validPriorities.includes(priority.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: "Priority must be one of: 'low', 'medium', 'high'."
      });
    }
  }

  next();
};

// Validate 24-character hex MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || id.length !== 24 || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid task ID format: '${id}'. Must be a 24-character hexadecimal ObjectId.`
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateObjectId
};

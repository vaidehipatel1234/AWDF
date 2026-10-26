/**
 * Charotar University of Science and Technology (CHARUSAT)
 * Faculty of Technology and Engineering (FTE / CSPIT)
 * Course: Advanced Web Development Frameworks (ITUE301)
 * Practical 7: Authentication and Middleware Pipeline
 * Student: Vaidehi Patel (24CS079)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Task = require('./models/Task');
const authMiddleware = require('./middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateTask,
  validateObjectId
} = require('./middleware/validate');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_db';
const JWT_SECRET = process.env.JWT_SECRET || 'jay_ladva_24cs079_jwt_default_secret_2026';

// ==========================================
// 1. CORS Middleware
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// 2. Built-in JSON Body Parsing Middleware
// ==========================================
app.use(express.json());

// ==========================================
// 3. Global Request Logging Middleware
// ==========================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 4. Content-Type Header Enforcement Middleware
// ==========================================
const requireJsonContent = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Requests with payload (POST/PUT) must include "Content-Type: application/json" header.'
      });
    }
  }
  next();
};

app.use(requireJsonContent);

// ==========================================
// 5. MongoDB Connection
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully to:', MONGO_URI.replace(/:[^:]*@/, ':****@'));
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

// ==========================================
// 6. Base / Health Route
// ==========================================
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    message: 'Welcome to Task Manager API with JWT Authentication (Practical 7)',
    student: 'Vaidehi Patel (24CS079)',
    course: 'ITUE301',
    database: {
      type: 'MongoDB Atlas',
      status: dbStatus
    },
    authEndpoints: {
      register: 'POST /register',
      login: 'POST /login',
      me: 'GET /me'
    },
    taskEndpoints: {
      getAll: 'GET /tasks (Protected)',
      getById: 'GET /tasks/:id (Protected)',
      create: 'POST /tasks (Protected)',
      update: 'PUT /tasks/:id (Protected)',
      delete: 'DELETE /tasks/:id (Protected)'
    }
  });
});

// ==========================================
// 7. Authentication Routes
// ==========================================

/**
 * Step 3: POST /register
 * Hashes password using bcrypt (cost factor 10) before saving User
 */
app.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email address is already registered.'
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name ? name.trim() : ''
    });

    // Sign JWT token for automatic authentication upon registration
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Step 4: POST /login
 * Compares plain password with bcrypt hash and signs JWT token (expires in 1h)
 */
app.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Supplementary Problem 1: GET /me
 * Returns currently logged-in user's details using decoded JWT
 */
app.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 8. Protected Task Routes (Auth & Validation Pipeline)
// ==========================================

/**
 * GET /tasks
 * Retrieves tasks for the authenticated user
 */
app.get('/tasks', authMiddleware, async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    // Query tasks matching current user or unassigned legacy tasks
    const query = {
      $or: [{ user: req.user.id }, { user: { $exists: false } }]
    };

    if (status === 'completed') {
      query.completed = true;
    } else if (status === 'pending') {
      query.completed = false;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      query.priority = priority.toLowerCase();
    }

    if (search && search.trim()) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } }
          ]
        }
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tasks/:id
 * Retrieves single task by ObjectId for the authenticated user
 */
app.get('/tasks/:id', authMiddleware, validateObjectId, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with ID '${req.params.id}' was not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tasks
 * Creates task scoped to the authenticated user with validation pipeline
 */
app.post('/tasks', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const newTask = new Task({
      title,
      description: description || '',
      completed: completed === true,
      priority: priority || 'medium',
      user: req.user.id
    });

    const savedTask = await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /tasks/:id
 * Updates task by ID with validation pipeline
 */
app.put('/tasks/:id', authMiddleware, validateObjectId, validateTask, async (req, res, next) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: `Task with ID '${req.params.id}' was not found.`
      });
    }

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.completed !== undefined) updates.completed = Boolean(req.body.completed);
    if (req.body.priority !== undefined) updates.priority = req.body.priority;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /tasks/:id
 * Deletes task by ID
 */
app.delete('/tasks/:id', authMiddleware, validateObjectId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: `Task with ID '${req.params.id}' was not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 9. Centralized Error Handling Middleware
// ==========================================
app.use((err, req, res, next) => {
  console.error('[Error Pipeline]:', err);

  // Mongoose Validation Error (e.g., enum mismatch, missing required field)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: '${err.value}'`
    });
  }

  // Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value entered. Email must be unique.'
    });
  }

  // Fallback 500 Internal Server Error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// ==========================================
// 10. Fallback 404 Route Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`
  });
});

// ==========================================
// 11. Start Server
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Practical 7 Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;

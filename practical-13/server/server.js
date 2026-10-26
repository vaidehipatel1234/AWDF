/**
 * Charotar University of Science and Technology (CHARUSAT)
 * Faculty of Technology and Engineering (FTE / CSPIT)
 * Course: Advanced Web Development Frameworks (ITUE301)
 * Practical 13: AI API Integration into a Web Application
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

// Practical 9: In-Memory Caching Service
const {
  cache,
  getCached,
  setCached,
  deleteCached,
  invalidateTasksCache,
  getStats,
  resetMetrics
} = require('./services/cacheService');

// Practical 10: Event-Driven Background Processing (Node.js EventEmitter)
const taskEvents = require('./events/events');
const { getNotificationHistory, clearNotificationHistory } = require('./events/listeners');

// Practical 13: AI Service with Graceful Degradation
const { generateTaskDescription } = require('./services/aiService');

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
// 6. Base / Health Route & Discovery
// ==========================================
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    message: 'Welcome to Task Manager API - Containerized with Docker & Docker Compose (Practical 11)',
    student: 'Vaidehi Patel (24CS079)',
    course: 'ITUE301',
    container: {
      isContainerized: Boolean(process.env.HOSTNAME),
      hostname: process.env.HOSTNAME || 'localhost',
      network: 'app-network (Docker Bridge)'
    },
    database: {
      uri: MONGO_URI.replace(/:[^:]*@/, ':****@'),
      status: dbStatus
    },
    eventDriven: {
      status: 'Active',
      emitter: 'Native EventEmitter',
      notificationsEndpoint: 'GET /events/notifications'
    },
    caching: {
      provider: 'node-cache',
      defaultTTL: '60 seconds',
      statsEndpoint: 'GET /cache/stats',
      clearEndpoint: 'POST /cache/clear'
    },
    authEndpoints: {
      register: 'POST /register',
      login: 'POST /login',
      me: 'GET /me'
    },
    taskEndpoints: {
      getAll: 'GET /tasks',
      getById: 'GET /tasks/:id',
      create: 'POST /tasks',
      update: 'PUT /tasks/:id',
      delete: 'DELETE /tasks/:id'
    }
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  res.status(dbStatus === 'UP' ? 200 : 503).json({
    status: dbStatus === 'UP' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 7. Authentication Routes (Practical 7)
// ==========================================

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name ? name.trim() : ''
    });

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
// 8. Cache Debug & Metrics Routes (Supplementary Problem 2)
// ==========================================

/**
 * GET /cache/stats
 * Exposes cache hits, misses, hit ratio, active keys, and key count
 */
app.get('/cache/stats', (req, res) => {
  const stats = getStats();
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * POST /cache/clear
 * Clears the in-memory cache and resets hit/miss counters
 */
app.post('/cache/clear', (req, res) => {
  cache.flushAll();
  resetMetrics();
  res.status(200).json({
    success: true,
    message: 'Cache successfully flushed and metrics reset.'
  });
});

// ==========================================
// 9. Protected Task Routes with node-cache Integration
// ==========================================

/**
 * Step 3: GET /tasks
 * Checks node-cache first. If HIT, returns cached data immediately.
 * If MISS, queries MongoDB, caches the result for 60 seconds, and returns it.
 */
app.get('/tasks', authMiddleware, async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { status, priority, search } = req.query;
    const hasFilters = Boolean(status || priority || search);
    const cacheKey = req.user?.id ? `tasks_${req.user.id}` : 'all_tasks';

    // 1. Check cache first (for unfiltered reads)
    if (!hasFilters) {
      const cached = getCached(cacheKey);
      if (cached.hit) {
        const responseDuration = Date.now() - startTime;
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Response-Time-Source', 'Memory (node-cache)');
        res.setHeader('X-Response-Time-Ms', `${responseDuration}ms`);
        return res.status(200).json(cached.data);
      }
    }

    // 2. Cache MISS: Query MongoDB
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

    const responsePayload = {
      success: true,
      count: tasks.length,
      data: tasks
    };

    // Store in node-cache with 60 seconds TTL
    if (!hasFilters) {
      setCached(cacheKey, responsePayload, 60);
    }

    const responseDuration = Date.now() - startTime;
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time-Source', 'Database (MongoDB Atlas)');
    res.setHeader('X-Response-Time-Ms', `${responseDuration}ms`);

    res.status(200).json(responsePayload);
  } catch (err) {
    next(err);
  }
});

/**
 * Supplementary Problem 1: GET /tasks/:id
 * Caches single-task endpoint independently using `task_<id>` key
 */
app.get('/tasks/:id', authMiddleware, validateObjectId, async (req, res, next) => {
  const startTime = Date.now();
  try {
    const singleCacheKey = `task_${req.params.id}`;

    // Check single-task cache
    const cached = getCached(singleCacheKey);
    if (cached.hit) {
      const responseDuration = Date.now() - startTime;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time-Source', 'Memory (node-cache)');
      res.setHeader('X-Response-Time-Ms', `${responseDuration}ms`);
      return res.status(200).json(cached.data);
    }

    // Cache MISS: Query MongoDB
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with ID '${req.params.id}' was not found.`
      });
    }

    const responsePayload = {
      success: true,
      data: task
    };

    // Store in cache for 60 seconds
    setCached(singleCacheKey, responsePayload, 60);

    const responseDuration = Date.now() - startTime;
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time-Source', 'Database (MongoDB Atlas)');
    res.setHeader('X-Response-Time-Ms', `${responseDuration}ms`);

    res.status(200).json(responsePayload);
  } catch (err) {
    next(err);
  }
});

/**
 * Step 4: POST /tasks
 * Invalidates cache after successful write so stale data is never served
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

    // Invalidate task cache keys (Practical 9)
    invalidateTasksCache(savedTask._id, req.user?.id);

    // Practical 10: Asynchronous Processing with Event-Driven Architecture (Step 3)
    // Send API response immediately, then emit task-created event
    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API] Response sent at ${apiResponseTimestamp} for task: "${savedTask.title}"`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask,
      responseTimestamp: apiResponseTimestamp
    });

    // Emit event asynchronously after sending the response
    taskEvents.emit('task-created', savedTask);
  } catch (err) {
    next(err);
  }
});

/**
 * Step 4: PUT /tasks/:id
 * Invalidates cache after successful write
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

    // Invalidate task cache keys
    invalidateTasksCache(req.params.id, req.user?.id);

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
 * Step 4: DELETE /tasks/:id
 * Invalidates cache and emits task-deleted event (Supplementary Problem 1)
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

    // Invalidate task cache keys
    invalidateTasksCache(req.params.id, req.user?.id);

    // Practical 10 Supplementary Problem 1: Emit task-deleted event
    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API] Response sent at ${apiResponseTimestamp} for deletion of task: "${deletedTask.title}"`);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask,
      responseTimestamp: apiResponseTimestamp
    });

    taskEvents.emit('task-deleted', deletedTask);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 10. Event-Driven Background Processing Debug Endpoints (Practical 10)
// ==========================================

/**
 * GET /events/notifications
 * Exposes live background notification log history
 */
app.get('/events/notifications', (req, res) => {
  const history = getNotificationHistory();
  res.status(200).json({
    success: true,
    count: history.length,
    notifications: history
  });
});

/**
 * POST /events/test-error
 * Supplementary Problem 2: Emits an error event to prove error listener catches it safely
 */
app.post('/events/test-error', (req, res) => {
  const testError = new Error(req.body.message || 'Simulated EventEmitter test background error');
  taskEvents.emit('error', testError);
  res.status(200).json({
    success: true,
    message: 'Error event emitted and caught by error listener without crashing server.'
  });
});
// ==========================================
// 10. Cache Monitoring & Debug Endpoints (Practical 9)
// ==========================================
app.get('/cache/stats', (req, res) => {
  res.status(200).json({
    success: true,
    metrics: getStats()
  });
});

app.post('/cache/clear', (req, res) => {
  cache.flushAll();
  resetMetrics();
  res.status(200).json({
    success: true,
    message: 'Cache flushed and metrics reset successfully'
  });
});

// ==========================================
// 11. Practical 13: AI API Integration Endpoint
// ==========================================
app.post('/api/ai/generate-description', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required to generate an AI description.'
      });
    }

    const clientId = req.ip || req.headers['x-forwarded-for'] || 'client-ip';
    const result = await generateTaskDescription(title.trim(), clientId);

    if (result.rateLimited) {
      return res.status(429).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('[AI Controller Error]:', err.message);
    res.status(200).json({
      success: true,
      description: `Action plan for: "${req.body.title || 'Task'}". Review and define implementation steps.`,
      isFallback: true,
      source: 'Graceful Degradation Fallback',
      disclaimer: 'This suggestion was generated by AI. Please review and modify before saving.'
    });
  }
});

// ==========================================
// 12. Centralized Error Handling Middleware
// ==========================================
app.use((err, req, res, next) => {
  console.error('[Error Pipeline]:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: '${err.value}'`
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value entered. Email must be unique.'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// ==========================================
// 11. Fallback 404 Route Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`
  });
});

// ==========================================
// 12. Start Server
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Practical 11 Docker Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;

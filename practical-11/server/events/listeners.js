const taskEvents = require('./events');

/**
 * Event Listeners Registration Module (Practical 10)
 * Handles background side effects (notifications, audits, analytics)
 * completely decoupled from the main HTTP request-response cycle.
 */

// In-memory notification log history for debugging and frontend monitoring
const notificationHistory = [];

const recordNotification = (entry) => {
  notificationHistory.unshift({
    ...entry,
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
  });
  if (notificationHistory.length > 30) {
    notificationHistory.pop();
  }
};

/**
 * Step 2: Listener for 'task-created' event
 * Simulates an asynchronous background side effect (e.g., email notification, push alert)
 * with a deliberate delay to prove non-blocking execution against the API response.
 */
taskEvents.on('task-created', (task) => {
  const handlerStartTime = new Date().toISOString();
  console.log(`[Event: task-created] Handler received for task: "${task.title}" at ${handlerStartTime}`);

  // Simulate asynchronous background job (e.g., 800ms email/notification dispatch)
  setTimeout(() => {
    const completionTime = new Date().toISOString();
    const logMessage = `[Notification] Background notification delivered for task "${task.title}" (Priority: ${task.priority || 'medium'}) at ${completionTime}`;
    console.log(logMessage);

    recordNotification({
      event: 'task-created',
      title: task.title,
      taskId: task._id || task.id,
      priority: task.priority || 'medium',
      receivedAt: handlerStartTime,
      completedAt: completionTime,
      status: 'DELIVERED',
      simulatedDelayMs: 800
    });
  }, 800);
});

/**
 * Supplementary Problem 1: Listener for 'task-deleted' event
 * Logs distinct notification when a task is permanently removed.
 */
taskEvents.on('task-deleted', (task) => {
  const handlerStartTime = new Date().toISOString();
  console.log(`[Event: task-deleted] Handler received for task ID: ${task._id} at ${handlerStartTime}`);

  setTimeout(() => {
    const completionTime = new Date().toISOString();
    const logMessage = `[Audit Notification] Task "${task.title}" (ID: ${task._id}) permanently removed from system at ${completionTime}`;
    console.log(logMessage);

    recordNotification({
      event: 'task-deleted',
      title: task.title,
      taskId: task._id,
      receivedAt: handlerStartTime,
      completedAt: completionTime,
      status: 'AUDITED',
      simulatedDelayMs: 400
    });
  }, 400);
});

/**
 * Supplementary Problem 2: Global Error Event Listener
 * Catches errors emitted on taskEvents, preventing process crashes
 * from unhandled 'error' events in Node.js.
 */
taskEvents.on('error', (err) => {
  const errorTime = new Date().toISOString();
  console.error(`[Event Error Caught] Handled EventEmitter error at ${errorTime}:`, err.message);

  recordNotification({
    event: 'error',
    errorMessage: err.message,
    timestamp: errorTime,
    status: 'CAUGHT_ERROR'
  });
});

module.exports = {
  getNotificationHistory: () => [...notificationHistory],
  clearNotificationHistory: () => {
    notificationHistory.length = 0;
  }
};

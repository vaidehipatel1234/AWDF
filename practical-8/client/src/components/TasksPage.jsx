import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { getTasks, createTask, updateTask, deleteTask, checkBackendHealth } from '../api';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import TaskEditModal from './TaskEditModal';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import DelayedFallback from './DelayedFallback';

// Supplementary Problem 1: Lazy load heavy analytics component on demand
const TaskAnalyticsChart = lazy(() => import('./TaskAnalyticsChart'));

function TasksPage({ currentUser, onOpenAuthModal, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Supplementary Problem 1: Optimistic UI toggle
  const [useOptimisticUi, setUseOptimisticUi] = useState(true);

  // Practical 8 Supplementary Problem 1: Lazy load heavy analytics component
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Active operation loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  // Supplementary Problem 2: Delete confirmation modal
  const [deleteModalTask, setDeleteModalTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal state
  const [editModalTask, setEditModalTask] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch tasks for authenticated user
  const fetchTaskList = useCallback(async (isInitial = false) => {
    if (!currentUser) return;

    if (isInitial) setLoading(true);
    setError(null);
    try {
      const isHealthy = await checkBackendHealth();
      setBackendOnline(isHealthy);
      if (!isHealthy) {
        throw new Error('Express backend on port 5000 is unreachable. Ensure the server is running.');
      }

      const res = await getTasks();
      setTasks(res.data || []);
    } catch (err) {
      if (err.status === 401) {
        // Handled via global listener
        return;
      }
      setError(err.message || 'Failed to communicate with MongoDB Atlas backend');
      showToast(err.message || 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTaskList(true);
    } else {
      setTasks([]);
    }
  }, [currentUser, fetchTaskList]);

  // Handle Create Task (with Optimistic UI support)
  const handleCreateTask = async (taskData) => {
    if (!currentUser) {
      onOpenAuthModal();
      return false;
    }

    setIsSubmitting(true);

    const tempId = 'temp-' + Date.now();
    let rollbackTasks = null;

    if (useOptimisticUi) {
      rollbackTasks = [...tasks];
      const optimisticTask = {
        _id: tempId,
        ...taskData,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };
      setTasks([optimisticTask, ...tasks]);
      showToast('Task added optimistically. Syncing to MongoDB Atlas...', 'success');
    }

    try {
      const res = await createTask(taskData);
      if (useOptimisticUi) {
        setTasks((prev) =>
          prev.map((t) => (t._id === tempId ? res.data : t))
        );
      } else {
        setTasks((prev) => [res.data, ...prev]);
      }
      showToast('Task successfully saved to MongoDB Atlas database!', 'success');
      return true;
    } catch (err) {
      if (useOptimisticUi && rollbackTasks) {
        setTasks(rollbackTasks);
        showToast(`Sync Failed: ${err.message}. Task rolled back.`, 'error');
      } else {
        showToast(err.message || 'Failed to create task', 'error');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Task Completion
  const handleToggleComplete = async (task) => {
    const updatedStatus = !task.completed;
    const previousTasks = [...tasks];

    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, completed: updatedStatus } : t))
    );
    setIsUpdatingId(task._id);

    try {
      await updateTask(task._id, { completed: updatedStatus });
      showToast(
        updatedStatus ? `Task marked as completed!` : `Task marked as pending!`,
        'success'
      );
    } catch (err) {
      setTasks(previousTasks);
      showToast(`Update Failed: ${err.message}. Reverting status.`, 'error');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Open Delete Confirmation Modal
  const handleRequestDelete = (task) => {
    setDeleteModalTask(task);
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteModalTask) return;
    const taskToDelete = deleteModalTask;
    setIsDeleting(true);

    try {
      await deleteTask(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      showToast(`Task "${taskToDelete.title}" deleted from database.`, 'success');
      setDeleteModalTask(null);
    } catch (err) {
      showToast(`Delete Failed: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal
  const handleRequestEdit = (task) => {
    setEditModalTask(task);
  };

  // Save Edit Changes
  const handleSaveEdit = async (id, updatedFields) => {
    setIsSavingEdit(true);
    try {
      const res = await updateTask(id, updatedFields);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      showToast('Task updated successfully!', 'success');
      setEditModalTask(null);
    } catch (err) {
      showToast(`Update Failed: ${err.message}`, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filter & Search Logic
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="tasks-page-container">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Header */}
      <div className="tasks-hero-header">
        <div className="tasks-hero-meta">
          <span className="badge-pill">Practical 7 • Authentication & Middleware Pipeline</span>
          <h1 className="tasks-page-title">Full-Stack Task Dashboard</h1>
          <p className="tasks-page-subtitle">
            Secure full-stack task management with JWT Bearer tokens, bcrypt hashing, input validation pipeline, and MongoDB Atlas.
          </p>
        </div>

        {/* Server & Database Diagnostics */}
        <div className="backend-status-card">
          <div className="status-indicator">
            <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
            <span className="status-label">
              Backend (Port 5000): {backendOnline ? 'Online (CORS Enabled)' : 'Offline'}
            </span>
          </div>
          <div className="atlas-indicator">
            <span className="atlas-icon">🍃</span>
            <span className="atlas-text">MongoDB Atlas: Connected (task_manager_db)</span>
          </div>
        </div>
      </div>

      {/* Auth Banner & Controls */}
      <div className="auth-status-bar">
        {currentUser ? (
          <div className="auth-active-info">
            <div className="auth-user-identity">
              <span className="auth-avatar">👤</span>
              <div>
                <strong>{currentUser.name || 'Student User'}</strong>
                <span className="auth-email-tag">{currentUser.email}</span>
              </div>
            </div>
            <div className="auth-session-details">
              <span className="jwt-badge">🛡️ JWT Active (1h)</span>
              <button
                type="button"
                className="btn btn-secondary auth-logout-btn"
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-prompt-card">
            <div className="auth-prompt-content">
              <span className="lock-icon">🔒</span>
              <div>
                <h3>Authentication Required for Task Access</h3>
                <p>
                  Task routes are protected by Express JWT middleware. Please log in or register an account to view and manage your tasks.
                </p>
              </div>
            </div>
            <div className="auth-prompt-actions">
              <button
                type="button"
                className="btn btn-primary auth-open-btn"
                onClick={onOpenAuthModal}
              >
                🔐 Login / Register
              </button>
            </div>
          </div>
        )}
      </div>

      {/* If Authenticated: Show Tasks Dashboard */}
      {currentUser && (
        <>
          {/* Controls Bar: Optimistic UI Toggle + Search + Status Filter */}
          <div className="tasks-controls-panel">
            <div className="optimistic-toggle-box">
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={useOptimisticUi}
                  onChange={(e) => setUseOptimisticUi(e.target.checked)}
                />
                <span className="toggle-slider" />
                <span className="toggle-text">
                  Optimistic UI: <strong>{useOptimisticUi ? 'ENABLED' : 'DISABLED'}</strong>
                </span>
              </label>
              <small className="toggle-hint">
                {useOptimisticUi
                  ? 'New tasks render immediately while syncing in background'
                  : 'UI waits for MongoDB Atlas response before rendering'}
              </small>
            </div>

            <div className="search-filter-box">
              <input
                type="text"
                placeholder="🔍 Search tasks by title or notes..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="filter-buttons">
                <button
                  type="button"
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed ({completedCount})
                </button>

                <button
                  type="button"
                  className={`filter-btn analytics-toggle-btn ${showAnalytics ? 'active' : ''}`}
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  title="Toggle lazy-loaded analytics component"
                >
                  {showAnalytics ? 'Hide Analytics' : '📊 Analytics (Lazy)'}
                </button>
              </div>
            </div>
          </div>

          {/* Practical 8 Supplementary Problem 1: Lazy-Loaded Heavy Analytics Component */}
          {showAnalytics && (
            <Suspense fallback={<DelayedFallback delay={300} message="Loading heavy TaskAnalytics chart chunk..." />}>
              <TaskAnalyticsChart tasks={tasks} />
            </Suspense>
          )}

          {/* Form and List Grid */}
          <div className="tasks-main-grid">
            <div className="grid-form-column">
              <TaskForm
                onSubmit={handleCreateTask}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className="grid-list-column">
              {loading ? (
                <div className="loading-card">
                  <Spinner />
                  <p>Loading tasks from MongoDB Atlas...</p>
                </div>
              ) : error ? (
                <ErrorMessage
                  message={error}
                  onRetry={() => fetchTaskList(true)}
                />
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  onToggleComplete={handleToggleComplete}
                  onRequestDelete={handleRequestDelete}
                  onRequestEdit={handleRequestEdit}
                  isUpdatingId={isUpdatingId}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalTask)}
        taskTitle={deleteModalTask?.title}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalTask(null)}
      />

      {/* Edit Modal */}
      <TaskEditModal
        isOpen={Boolean(editModalTask)}
        task={editModalTask}
        isSaving={isSavingEdit}
        onSave={handleSaveEdit}
        onCancel={() => setEditModalTask(null)}
      />
    </div>
  );
}

export default TasksPage;

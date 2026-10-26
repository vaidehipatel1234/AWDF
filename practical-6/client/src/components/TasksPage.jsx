import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, checkBackendHealth } from '../api';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import TaskEditModal from './TaskEditModal';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Supplementary Problem 1: Optimistic UI toggle
  const [useOptimisticUi, setUseOptimisticUi] = useState(true);

  // Active operation loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  // Supplementary Problem 2: Delete confirmation modal
  const [deleteModalTask, setDeleteModalTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal state
  const [editModalTask, setEditModalTask] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Supplementary Problem 3: Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch tasks from Express + MongoDB backend
  const fetchTaskList = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const isHealthy = await checkBackendHealth();
      setBackendOnline(isHealthy);
      if (!isHealthy) {
        throw new Error('Express backend on port 5000 is unreachable. Ensure the backend server is running.');
      }

      const res = await getTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to communicate with MongoDB backend');
      showToast(err.message || 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaskList(true);
  }, [fetchTaskList]);

  // Handle Create Task (with Optimistic UI support)
  const handleCreateTask = async (taskData) => {
    setIsSubmitting(true);

    const tempId = 'temp-' + Date.now();
    let rollbackTasks = null;

    if (useOptimisticUi) {
      // Supplementary Problem 1: Optimistically add task before server confirms
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
        // Replace temporary optimistic item with verified MongoDB document
        setTasks((prev) =>
          prev.map((t) => (t._id === tempId ? res.data : t))
        );
      } else {
        setTasks((prev) => [res.data, ...prev]);
      }
      showToast('Task successfully saved to MongoDB database!', 'success');
      return true;
    } catch (err) {
      if (useOptimisticUi && rollbackTasks) {
        // Rollback state on error
        setTasks(rollbackTasks);
      }
      showToast(err.message || 'Error creating task', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Complete
  const handleToggleComplete = async (task) => {
    setIsUpdatingId(task._id);
    const updatedStatus = !task.completed;

    try {
      const res = await updateTask(task._id, { completed: updatedStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? res.data : t))
      );
      showToast(
        `Task marked as ${updatedStatus ? 'Completed' : 'Pending'} in MongoDB`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update task', 'error');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (id, updatedFields) => {
    setIsSavingEdit(true);
    try {
      const res = await updateTask(id, updatedFields);
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? res.data : t))
      );
      setEditModalTask(null);
      showToast('Task updated successfully in MongoDB!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Confirmation & Execution
  const handleDeleteConfirm = async (id) => {
    setIsDeleting(true);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setDeleteModalTask(null);
      showToast('Task permanently deleted from MongoDB', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tasks locally by status and search query
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title && task.title.toLowerCase().includes(q);
      const matchDesc = task.description && task.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="page-content tasks-page">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="section-header card">
        <div className="api-badge-row">
          <span className="api-badge">Full Stack Integration</span>
          <span className="api-user-badge">React (5173) &harr; Express (5000) &harr; MongoDB Atlas</span>
          <span className={`db-status-pill ${backendOnline ? 'online' : 'offline'}`}>
            {backendOnline ? '● MongoDB Atlas Connected' : '○ Backend Offline'}
          </span>
        </div>

        <h2>Task Management System</h2>
        <p>
          Practical 6: End-to-end full-stack integration wiring React functional components with Express RESTful API and persistent cloud MongoDB database.
        </p>

        {/* Controls: Search, Filters, Optimistic Toggle, and Refresh */}
        <div className="task-controls-bar">
          <div className="search-box-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="18"
              height="18"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks in database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>

          <div className="filter-buttons-group">
            {['all', 'pending', 'completed'].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="feature-toggles">
            <label className="toggle-label" title="Show new tasks immediately before server confirmation">
              <input
                type="checkbox"
                checked={useOptimisticUi}
                onChange={(e) => setUseOptimisticUi(e.target.checked)}
              />
              Optimistic UI Updates
            </label>

            <button
              type="button"
              className="refresh-btn"
              onClick={() => fetchTaskList(false)}
              disabled={loading}
              title="Re-sync data with MongoDB"
            >
              ⟳ Sync DB
            </button>
          </div>
        </div>

        {!loading && !error && (
          <div className="repo-status-counter">
            Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks in MongoDB
          </div>
        )}
      </div>

      {/* Task Creation Form */}
      <TaskForm onTaskCreated={handleCreateTask} isSubmitting={isSubmitting} />

      {/* Content Rendering (Loading / Error / Task List) */}
      {loading && <Spinner message="Connecting to MongoDB Atlas and fetching tasks..." />}
      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchTaskList(true)}
        />
      )}
      {!loading && !error && (
        <TaskList
          tasks={filteredTasks}
          onToggleComplete={handleToggleComplete}
          onEditClick={(task) => setEditModalTask(task)}
          onDeleteClick={(task) => setDeleteModalTask(task)}
          isUpdatingId={isUpdatingId}
        />
      )}

      {/* Edit Modal Dialog */}
      <TaskEditModal
        isOpen={Boolean(editModalTask)}
        task={editModalTask}
        onSave={handleSaveEdit}
        onCancel={() => setEditModalTask(null)}
        isSaving={isSavingEdit}
      />

      {/* Delete Confirmation Modal (Supplementary Problem 2) */}
      <ConfirmModal
        isOpen={Boolean(deleteModalTask)}
        task={deleteModalTask}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalTask(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default TasksPage;

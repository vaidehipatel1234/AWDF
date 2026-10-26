import { useState } from 'react';

/**
 * Task Creation Form Component (Practical 6 Step 4)
 * Posts new task data to backend /tasks endpoint
 */
function TaskForm({ onTaskCreated, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Task title is required.');
      return;
    }
    setValidationError('');

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      completed: false
    };

    const success = await onTaskCreated(taskData);
    if (success) {
      setTitle('');
      setDescription('');
      setPriority('medium');
    }
  };

  return (
    <div className="card task-form-card">
      <div className="form-header">
        <h3>Create New Task</h3>
        <span className="form-subtext">Persists directly into MongoDB via Express backend</span>
      </div>

      {validationError && (
        <div className="client-validation-error">
          <span>⚠️ {validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-row">
          <div className="form-group flex-3">
            <label htmlFor="task-title">Task Title *</label>
            <input
              type="text"
              id="task-title"
              className="form-control"
              placeholder="e.g. Integrate MongoDB Atlas with Express"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-desc">Description (Optional)</label>
          <input
            type="text"
            id="task-desc"
            className="form-control"
            placeholder="Additional notes or specifications..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary submit-task-btn"
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span> Creating Task...
              </>
            ) : (
              '+ Add Task to MongoDB'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;

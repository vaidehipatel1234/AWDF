import { useState, useEffect } from 'react';

/**
 * Task Edit Modal Dialog
 * Allows editing task title, description, priority, and status
 */
function TaskEditModal({ isOpen, task, onSave, onCancel, isSaving }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setCompleted(Boolean(task.completed));
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(task._id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      completed
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card edit-modal-card">
        <div className="modal-header-row">
          <h3>Edit Task</h3>
          <button type="button" className="close-btn" onClick={onCancel}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-edit-form">
          <div className="form-group">
            <label htmlFor="edit-title">Task Title *</label>
            <input
              type="text"
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-control"
              placeholder="e.g. Complete React Frontend Integration"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="form-control"
              placeholder="Enter task details..."
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-control"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group half-width checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                />
                Mark as Completed
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskEditModal;

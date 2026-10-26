/**
 * Task List Component (Practical 6 Step 5)
 * Renders individual task cards with action buttons (Toggle, Edit, Delete)
 */
function TaskList({ tasks, onToggleComplete, onEditClick, onDeleteClick, isUpdatingId }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="card empty-tasks-card">
        <div className="empty-icon">📝</div>
        <h3>No Tasks Found</h3>
        <p>No tasks match your current filter. Create a new task above to populate the database.</p>
      </div>
    );
  }

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'badge-priority-high';
      case 'low':
        return 'badge-priority-low';
      case 'medium':
      default:
        return 'badge-priority-medium';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="tasks-grid">
      {tasks.map((task) => {
        const isBusy = isUpdatingId === task._id;

        return (
          <div
            key={task._id || task.id}
            className={`card task-card ${task.completed ? 'task-card-completed' : ''} ${
              task.isOptimistic ? 'task-card-optimistic' : ''
            }`}
          >
            <div className="task-card-header">
              <div className="task-badges">
                <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                  {task.priority || 'medium'}
                </span>
                <span className={`badge ${task.completed ? 'badge-completed' : 'badge-pending'}`}>
                  {task.completed ? 'Completed' : 'Pending'}
                </span>
                {task.isOptimistic && (
                  <span className="badge badge-optimistic" title="Saving to MongoDB...">
                    Optimistic
                  </span>
                )}
              </div>

              <span className="task-date">{formatDate(task.createdAt)}</span>
            </div>

            <div className="task-card-body">
              <h4 className={`task-title ${task.completed ? 'text-strikethrough' : ''}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
            </div>

            <div className="task-card-actions">
              <button
                type="button"
                className={`btn btn-sm ${task.completed ? 'btn-undo' : 'btn-complete'}`}
                onClick={() => onToggleComplete(task)}
                disabled={isBusy || task.isOptimistic}
                title={task.completed ? 'Mark as Pending' : 'Mark as Completed'}
              >
                {task.completed ? '↩ Undo' : '✓ Done'}
              </button>

              <button
                type="button"
                className="btn btn-sm btn-edit"
                onClick={() => onEditClick(task)}
                disabled={isBusy || task.isOptimistic}
                title="Edit Task"
              >
                ✎ Edit
              </button>

              <button
                type="button"
                className="btn btn-sm btn-delete"
                onClick={() => onDeleteClick(task)}
                disabled={isBusy || task.isOptimistic}
                title="Delete Task"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;

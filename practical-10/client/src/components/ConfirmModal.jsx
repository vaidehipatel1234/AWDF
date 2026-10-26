/**
 * Confirmation Dialog Component (Supplementary Problem 2)
 * Confirms task deletion before making DELETE API request
 */
function ConfirmModal({ isOpen, task, onConfirm, onCancel, isDeleting }) {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content card confirm-modal-card">
        <div className="modal-warning-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3>Confirm Task Deletion</h3>
        <p>
          Are you sure you want to permanently delete <strong>&ldquo;{task.title}&rdquo;</strong> from MongoDB?
        </p>
        <span className="modal-subtext">This action cannot be undone.</span>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(task._id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting from DB...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

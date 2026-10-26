import { useEffect } from 'react';

/**
 * Toast Notification Component (Supplementary Problem 3)
 * Displays success or failure feedback after each operation
 */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`toast-notification ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      <div className="toast-icon">
        {isSuccess ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <div className="toast-message">
        <strong>{isSuccess ? 'Success' : 'Error'}</strong>
        <p>{toast.message}</p>
      </div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        &times;
      </button>
    </div>
  );
}

export default Toast;

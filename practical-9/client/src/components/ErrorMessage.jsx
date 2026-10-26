function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container card">
      <div className="error-icon-wrapper">
        <svg
          className="error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="48"
          height="48"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="error-title">Failed to Fetch Repositories</h3>
      <p className="error-description">
        {message || "An unexpected error occurred while communicating with the GitHub REST API."}
      </p>
      <div className="error-troubleshoot">
        <strong>Troubleshooting / Diagnostic Notes:</strong>
        <ul>
          <li>Check internet connection or network proxy.</li>
          <li>Ensure the requested endpoint URL is valid.</li>
          <li>GitHub API unauthenticated rate limit may be temporarily exceeded (60 req/hr).</li>
        </ul>
      </div>
      {onRetry && (
        <button type="button" className="retry-btn" onClick={onRetry}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="16"
            height="16"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Retry API Request
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;

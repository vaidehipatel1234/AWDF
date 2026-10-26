import { useState, useEffect } from 'react';

/**
 * Supplementary Problem 2: Minimum-Delay Fallback Component
 * Prevents flickering loading states on fast connections by delaying
 * the rendering of the fallback UI until a specified threshold (e.g. 300ms) has passed.
 * If the lazy chunk loads within 300ms, the fallback is never rendered.
 */
function DelayedFallback({ delay = 300, message = 'Loading page chunk...' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    // Return empty placeholder while waiting for delay threshold
    return null;
  }

  return (
    <div className="lazy-fallback-container" role="status" aria-live="polite">
      <div className="lazy-skeleton-wrapper">
        <div className="lazy-spinner-ring" />
        <div className="lazy-skeleton-content">
          <div className="skeleton-bar title-bar" />
          <div className="skeleton-bar subtitle-bar" />
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
        <p className="lazy-loading-text">
          <span className="pulse-dot">⚡</span> {message}
          <span className="delay-badge">({delay}ms debounce applied)</span>
        </p>
      </div>
    </div>
  );
}

export default DelayedFallback;

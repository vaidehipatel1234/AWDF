import { useState } from 'react';
import { loginUser, registerUser } from '../api';

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (!isLoginMode && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      let result;
      if (isLoginMode) {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password, name);
      }

      setLoading(false);
      onAuthSuccess(result.user, isLoginMode ? 'Logged in successfully!' : 'Account registered and logged in!');
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleFillDemo = () => {
    setEmail('24cs079@charusat.edu.in');
    setPassword('VaidehiPatel2026!');
    setName('Vaidehi Patel (24CS079)');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="auth-header-title">
            <span className="auth-icon">{isLoginMode ? '🔐' : '📝'}</span>
            <h3 className="modal-title">
              {isLoginMode ? 'User Login' : 'Create Account'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${isLoginMode ? 'active' : ''}`}
            onClick={() => {
              setIsLoginMode(true);
              setError('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${!isLoginMode ? 'active' : ''}`}
            onClick={() => {
              setIsLoginMode(false);
              setError('');
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="auth-error-alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name (Optional)</label>
              <input
                id="auth-name"
                type="text"
                className="form-control"
                placeholder="e.g. Vaidehi Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-control"
              placeholder="e.g. user@charusat.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password (min 6 characters)</label>
            <input
              id="auth-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-actions">
            <button
              type="button"
              className="btn btn-secondary demo-fill-btn"
              onClick={handleFillDemo}
            >
              Fill Demo Credentials
            </button>
            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : isLoginMode ? 'Login' : 'Register & Login'}
            </button>
          </div>
        </form>

        <div className="auth-footer-note">
          <small>
            Practical 7 Authentication & Middleware Pipeline • Passwords hashed with bcrypt (salt rounds: 10) • JWT with 1h expiry
          </small>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;

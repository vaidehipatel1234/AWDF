import { NavLink } from 'react-router-dom';

function NavBar({ darkMode, setDarkMode, currentUser, onOpenAuthModal, onLogout }) {
  return (
    <header className="navbar-container">
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-badge">VP</div>
          <div className="brand-details">
            <span className="brand-name">Vaidehi Patel</span>
            <span className="brand-sub">ID: 24CS079</span>
          </div>
        </div>
        <div className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Home
          </NavLink>
          <NavLink 
            to="/tasks" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Tasks (Protected)
          </NavLink>
          <NavLink 
            to="/projects" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            GitHub
          </NavLink>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Contact
          </NavLink>

          {/* Practical 7: Authentication Controls */}
          {currentUser ? (
            <div className="nav-auth-box">
              <span className="nav-user-badge" title={currentUser.email}>
                👤 {currentUser.name ? currentUser.name : currentUser.email.split('@')[0]}
              </span>
              <button
                type="button"
                className="nav-auth-btn logout-btn"
                onClick={onLogout}
                title="Log out and clear JWT token"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="nav-auth-btn login-btn"
              onClick={onOpenAuthModal}
              title="Login or Register with JWT"
            >
              🔐 Login / Register
            </button>
          )}

          <button 
            type="button"
            className="theme-toggle-btn" 
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark / Light Theme"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;

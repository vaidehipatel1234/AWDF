import { NavLink } from 'react-router-dom';

function NavBar({ darkMode, setDarkMode }) {
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
            to="/projects" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Projects
          </NavLink>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Contact
          </NavLink>
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

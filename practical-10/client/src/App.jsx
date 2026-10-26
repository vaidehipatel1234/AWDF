import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import DelayedFallback from './components/DelayedFallback';
import { getStoredUser, setStoredUser, logoutUser, getMe, getToken } from './api';
import './App.css';

// Practical 8: Route-based Code Splitting using React.lazy()
const Home = lazy(() => import('./components/Home'));
const Projects = lazy(() => import('./components/Projects'));
const TasksPage = lazy(() => import('./components/TasksPage'));
const Contact = lazy(() => import('./components/Contact'));
const NotFound = lazy(() => import('./components/NotFound'));

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState(null);

  const showGlobalToast = (message, type = 'success') => {
    setGlobalToast({ message, type });
  };

  // Verify stored session on mount via /me endpoint
  useEffect(() => {
    const verifySession = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await getMe();
        if (res.user) {
          setCurrentUser(res.user);
          setStoredUser(res.user);
        }
      } catch (err) {
        // If token has expired or is invalid, clean up
        setCurrentUser(null);
      }
    };

    verifySession();
  }, []);

  // Global listener for 401 token expiry
  useEffect(() => {
    const handleUnauthorized = (e) => {
      setCurrentUser(null);
      setIsAuthModalOpen(true);
      showGlobalToast(e.detail?.message || 'Session expired. Please log in again.', 'error');
    };

    const handleLogoutEvent = () => {
      setCurrentUser(null);
      showGlobalToast('Logged out successfully.', 'info');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const handleAuthSuccess = (user, msg) => {
    setCurrentUser(user);
    showGlobalToast(msg || 'Authentication successful!', 'success');
  };

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className={`app-shell ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <NavBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="main-viewport">
        {/* Practical 8: Suspense with Debounced Minimum-Delay Fallback UI */}
        <Suspense fallback={<DelayedFallback delay={300} message="Loading route chunk..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  currentUser={currentUser}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onLogout={handleLogout}
                />
              }
            />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {/* Auth Modal for Login and Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Global Toast */}
      {globalToast && (
        <Toast
          message={globalToast.message}
          type={globalToast.type}
          onClose={() => setGlobalToast(null)}
        />
      )}
    </div>
  );
}

export default App;
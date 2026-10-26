import { useState, useEffect } from 'react';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import RepoList from './RepoList';

const GITHUB_USERNAME = 'vaidehipatel1234';

function Projects() {
  // Supplementary Problem: Search/filter input state
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialLoading = searchParams?.get('loading') === 'true';
  const initialError = searchParams?.get('error') === 'true' 
    ? 'HTTP 404: Failed to fetch repositories (Not Found - User/endpoint does not exist)' 
    : null;
  const initialQuery = searchParams?.get('q') || '';

  // Step 1: 3 core state variables for data, loading, and error
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(initialLoading || !initialError);
  const [error, setError] = useState(initialError);

  // Supplementary Problem: Search/filter input state
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Supplementary & Testing: Retry counter and error simulation toggle
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [simulateError, setSimulateError] = useState(searchParams?.get('error') === 'true');

  // Step 2: Use useEffect to fetch data when component mounts or retry is triggered
  useEffect(() => {
    if (searchParams?.get('loading') === 'true') {
      setLoading(true);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Endpoint: optionally break URL if simulateError is toggled (Step 6)
    const apiEndpoint = simulateError
      ? 'https://api.github.com/users/invalid-nonexistent-user-error-test-404/repos'
      : `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated`;

    fetch(apiEndpoint)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch repositories (${res.statusText})`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data)) {
            setRepos(data);
          } else {
            throw new Error(data.message || 'Unexpected response format from API');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'An error occurred during fetch');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [retryTrigger, simulateError]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryTrigger((prev) => prev + 1);
  };

  const handleToggleSimulateError = () => {
    setSimulateError((prev) => !prev);
  };

  // Supplementary Problem: Filter repositories by name
  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-content projects-page">
      {/* Top Header Card */}
      <div className="section-header card">
        <div className="api-badge-row">
          <span className="api-badge">GitHub REST API v3</span>
          <span className="api-user-badge">User: @{GITHUB_USERNAME}</span>
        </div>
        <h2>GitHub Repositories</h2>
        <p>
          Live data fetched asynchronously using React's <code>useEffect</code> hook with comprehensive loading, error, and success state handling.
        </p>

        {/* Search Bar & Controls (Supplementary Problems) */}
        <div className="projects-controls">
          <div className="search-box-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              id="repo-search-input"
              className="search-input"
              placeholder="Search repositories by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading || !!error}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="controls-actions">
            <button
              type="button"
              className="refresh-btn"
              onClick={handleRetry}
              disabled={loading}
              title="Re-fetch repositories"
            >
              Refresh
            </button>
            <button
              type="button"
              className={`test-error-toggle ${simulateError ? 'active' : ''}`}
              onClick={handleToggleSimulateError}
              title="Test error handling by breaking API endpoint"
            >
              {simulateError ? 'Error Test: Active (Click to Reset)' : 'Simulate Error Path'}
            </button>
          </div>
        </div>

        {!loading && !error && (
          <div className="repo-status-counter">
            Showing <strong>{filteredRepos.length}</strong> of <strong>{repos.length}</strong> repositories
          </div>
        )}
      </div>

      {/* Step 3: Conditionally render based on state */}
      {loading && <Spinner message="Fetching live repositories from GitHub API..." />}
      {!loading && error && <ErrorMessage message={error} onRetry={handleRetry} />}
      {!loading && !error && <RepoList data={filteredRepos} />}
    </div>
  );
}

export default Projects;

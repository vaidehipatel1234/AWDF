import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="page-content not-found-page">
      <div className="card not-found-card">
        <h1 className="error-code">404</h1>
        <h2>Page Not Found</h2>
        <p>The route you are looking for does not exist or may have been moved.</p>
        <Link to="/" className="home-link-btn">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;

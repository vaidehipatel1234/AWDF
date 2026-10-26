function RepoList({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card empty-repos-card">
        <h3>No Repositories Found</h3>
        <p>No repository matching your search criteria was found in the fetched dataset.</p>
      </div>
    );
  }

  return (
    <div className="projects-grid">
      {data.map((repo) => (
        <div key={repo.id} className="project-card card repo-card">
          <div className="repo-header-row">
            <span className="repo-language-badge">
              {repo.language || 'Code'}
            </span>
            <div className="repo-stats-badge" title="GitHub Stars">
              <span className="star-icon">⭐</span>
              <span className="star-count">{repo.stargazers_count ?? 0}</span>
              {repo.forks_count > 0 && (
                <>
                  <span className="fork-icon">🍴</span>
                  <span className="fork-count">{repo.forks_count}</span>
                </>
              )}
            </div>
          </div>

          <h3 className="repo-name" title={repo.name}>
            {repo.name}
          </h3>

          <p className="project-desc repo-desc">
            {repo.description || "No public description provided for this repository."}
          </p>

          <div className="repo-meta-footer">
            <span className="repo-visibility">
              {repo.private ? 'Private' : 'Public'}
            </span>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="repo-btn github-link-btn"
            >
              View on GitHub &rarr;
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RepoList;

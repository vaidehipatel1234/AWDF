function Spinner({ message = "Fetching repositories from GitHub API..." }) {
  return (
    <div className="spinner-container card">
      <div className="spinner-ring"></div>
      <p className="spinner-message">{message}</p>
      <span className="spinner-sub">Handling asynchronous network request via useEffect...</span>
    </div>
  );
}

export default Spinner;

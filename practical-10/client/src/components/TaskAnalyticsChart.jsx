import { useMemo } from 'react';

/**
 * Supplementary Problem 1: Heavy Analytics & Chart Component
 * Lazy loaded on-demand only when the user requests productivity metrics.
 * Demonstrates component-level code splitting beyond route splitting.
 */
function TaskAnalyticsChart({ tasks = [] }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;

    return { total, completed, pending, rate, high, medium, low };
  }, [tasks]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (stats.rate / 100) * circumference;

  return (
    <div className="analytics-chart-container">
      <div className="analytics-header">
        <div className="analytics-title-box">
          <span className="analytics-badge">📊 Lazy-Loaded Heavy Component</span>
          <h3>Productivity & Task Metrics</h3>
        </div>
        <div className="analytics-chip">Rendered on-demand via React.lazy()</div>
      </div>

      <div className="analytics-grid">
        {/* Circular Progress Gauge */}
        <div className="metric-card donut-card">
          <h4>Completion Ratio</h4>
          <div className="svg-gauge-box">
            <svg viewBox="0 0 100 100" className="gauge-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="gauge-bg"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="gauge-progress"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="gauge-text">
              <span className="gauge-percent">{stats.rate}%</span>
              <span className="gauge-sub">Complete</span>
            </div>
          </div>
          <p className="metric-caption">
            {stats.completed} of {stats.total} total tasks finished
          </p>
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="metric-card breakdown-card">
          <h4>Priority Distribution</h4>
          <div className="priority-bars-container">
            <div className="bar-row">
              <div className="bar-label">
                <span>🔴 High Priority</span>
                <strong>{stats.high}</strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill high-fill"
                  style={{ width: `${stats.total > 0 ? (stats.high / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bar-row">
              <div className="bar-label">
                <span>🟡 Medium Priority</span>
                <strong>{stats.medium}</strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill medium-fill"
                  style={{ width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bar-row">
              <div className="bar-label">
                <span>🟢 Low Priority</span>
                <strong>{stats.low}</strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill low-fill"
                  style={{ width: `${stats.total > 0 ? (stats.low / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key KPI Stats */}
        <div className="metric-card kpi-card">
          <h4>Execution Summary</h4>
          <div className="kpi-grid">
            <div className="kpi-box">
              <span className="kpi-num">{stats.total}</span>
              <span className="kpi-label">Total Assigned</span>
            </div>
            <div className="kpi-box success">
              <span className="kpi-num">{stats.completed}</span>
              <span className="kpi-label">Completed</span>
            </div>
            <div className="kpi-box warning">
              <span className="kpi-num">{stats.pending}</span>
              <span className="kpi-label">In Progress</span>
            </div>
            <div className="kpi-box info">
              <span className="kpi-num">0ms</span>
              <span className="kpi-label">Render Lag</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskAnalyticsChart;

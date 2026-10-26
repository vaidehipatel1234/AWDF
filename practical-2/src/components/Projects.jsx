import { useState } from 'react';

function Projects() {
  const [activeCategory, setActiveCategory] = useState('All');

  const projectList = [
    {
      id: 1,
      name: "React Student Portfolio",
      category: "React",
      description: "A responsive portfolio application built with React, modular functional components, and React Router client-side routing.",
      technologies: ["React", "React Router", "Vite", "CSS3"],
      repoLink: "https://github.com/vaidehipatel1234/AWDF/tree/main/practical-1"
    },
    {
      id: 2,
      name: "Automobile Showcase Application",
      category: "Frontend",
      description: "Interactive car showcase application with component hierarchy and reusable card components passing data through props.",
      technologies: ["React", "JavaScript", "HTML5", "CSS3"],
      repoLink: "https://github.com/vaidehipatel1234"
    },
    {
      id: 3,
      name: "Campus Management Portal",
      category: "FullStack",
      description: "Web application managing student activities, schedules, and real-time interaction for college departments.",
      technologies: ["Node.js", "Express", "React", "MongoDB"],
      repoLink: "https://github.com/vaidehipatel1234"
    }
  ];

  const filteredProjects = activeCategory === 'All' 
    ? projectList 
    : projectList.filter(p => p.category === activeCategory);

  return (
    <div className="page-content projects-page">
      <div className="section-header card">
        <h2>My Projects</h2>
        <p>Explore practical projects built demonstrating component-based architecture and state management.</p>
        
        <div className="category-filters">
          {['All', 'React', 'Frontend', 'FullStack'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.map((item) => (
          <div key={item.id} className="project-card card">
            <div className="project-category-badge">{item.category}</div>
            <h3>{item.name}</h3>
            <p className="project-desc">{item.description}</p>
            <div className="tech-stack">
              {item.technologies.map((t, idx) => (
                <span key={idx} className="tech-badge">{t}</span>
              ))}
            </div>
            <a 
              href={item.repoLink} 
              target="_blank" 
              rel="noreferrer" 
              className="repo-btn"
            >
              GitHub Repository &rarr;
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;

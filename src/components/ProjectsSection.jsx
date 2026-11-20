'use client';

import JapaneseTempleViewer from './JapaneseTempleViewer';
import Reveal from './Reveal';

export default function ProjectsSection({ projects }) {
  const featuredProject = projects.find((project) => project.featured) || projects[0];
  const secondaryProjects = projects.filter((project) => project.slug !== featuredProject?.slug);

  return (
    <section className="portfolio-section" id="proyectos" data-section="proyectos">
      <div className="container">
        <Reveal as="header" className="section-head">
          <div className="section-eyebrow">
            <span className="eyebrow-index">02</span>
            <span className="eyebrow-sep">/</span>
            <span>Proyectos destacados</span>
          </div>
          <h2 className="section-title">
            Demostraciones interactivas y sistemas construidos para producción.
          </h2>
        </Reveal>

        {featuredProject && (
          <Reveal as="article" className="featured-project glass-card" delay={1}>
            <JapaneseTempleViewer model3d={featuredProject.model3d} />

            <div className="featured-project-body">
              <div className="project-meta-row">
                <span className="project-badge">{featuredProject.badge}</span>
                <span className="project-category">{featuredProject.category}</span>
              </div>

              <h3 className="project-title-lg">{featuredProject.title}</h3>

              <p className="project-description">
                Experiencia interactiva en Three.js construida sobre <strong>Next.js</strong> y{' '}
                <strong>React</strong> que renderiza el santuario japonés en formato{' '}
                <strong>glTF 2.0</strong> con normalización automática de geometría (
                <code>Box3</code>), filtrado anisotrópico de texturas PBR, iluminación física con
                mapeo de tonos <code>ACESFilmic</code>, transiciones cúbicas de cámara y modos de
                inspección técnica en tiempo real.
              </p>

              <ul className="tech-tag-list">
                {featuredProject.tags.map((tag) => (
                  <li className="tech-tag" key={tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        <div className="secondary-projects-grid">
          {secondaryProjects.map((project, index) => (
            <Reveal
              as="article"
              key={project.slug}
              className="project-card glass-card"
              delay={(index % 2) + 1}
            >
              <div className="project-meta-row">
                <span className="project-badge">{project.badge}</span>
                <span className="project-category">{project.category}</span>
              </div>
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <ul className="tech-tag-list">
                {project.tags.map((tag) => (
                  <li className="tech-tag" key={tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

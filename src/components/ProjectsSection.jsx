'use client';

import F1CarViewer from './F1CarViewer';
import JapaneseTempleViewer from './JapaneseTempleViewer';
import Reveal from './Reveal';

function renderFeaturedViewer(project) {
  if (project.viewerType === 'f1-rb22') {
    return <F1CarViewer model3d={project.model3d} />;
  }
  return <JapaneseTempleViewer model3d={project.model3d} />;
}

function renderFeaturedDescription(project) {
  if (project.slug === 'japanese-shrine-3d') {
    return (
      <p className="project-description">
        Experiencia interactiva en Three.js construida sobre <strong>Next.js</strong> y{' '}
        <strong>React</strong> que renderiza el santuario japonés en formato{' '}
        <strong>glTF 2.0</strong> con normalización automática de geometría (<code>Box3</code>),
        filtrado anisotrópico de texturas PBR, iluminación física con mapeo de tonos{' '}
        <code>ACESFilmic</code>, transiciones cúbicas de cámara y modos de inspección técnica en
        tiempo real.
      </p>
    );
  }

  if (project.slug === 'rb22-f1-3d') {
    return (
      <p className="project-description">
        Banco de homologación interactivo en Three.js del monoplaza{' '}
        <strong>Oracle Red Bull Racing RB22</strong> (normativa <strong>FIA 2026</strong>) en
        formato <strong>GLB</strong> binario con 27 grupos de malla PBR, plataforma de metrología a
        escala real (<code>5400 × 1900 mm</code>), simulación de flujo aerodinámico de túnel de
        viento (<code>Modo Z</code> / <code>Modo X</code>), seis estaciones calibradas de cámara y
        modos de inspección técnica en tiempo real.
      </p>
    );
  }

  return <p className="project-description">{project.description}</p>;
}

export default function ProjectsSection({ projects }) {
  const featuredProjects = projects.filter((project) => project.featured);
  const secondaryProjects = projects.filter((project) => !project.featured);

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

        {featuredProjects.map((project, index) => (
          <Reveal
            as="article"
            key={project.slug}
            className="featured-project glass-card"
            delay={index === 0 ? 1 : 2}
          >
            {renderFeaturedViewer(project)}

            <div className="featured-project-body">
              <div className="project-meta-row">
                <span className="project-badge">{project.badge}</span>
                <span className="project-category">{project.category}</span>
              </div>

              <h3 className="project-title-lg">{project.title}</h3>

              {renderFeaturedDescription(project)}

              <ul className="tech-tag-list">
                {project.tags.map((tag) => (
                  <li className="tech-tag" key={tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}

        {secondaryProjects.length > 0 && (
          <div
            className={`secondary-projects-grid${
              secondaryProjects.length === 1 ? ' is-single' : ''
            }`}
          >
            {secondaryProjects.map((project, index) => (
              <Reveal
                as="article"
                key={project.slug}
                className="project-card glass-card"
                delay={(index % 2) + 1}
              >
                <div className="project-card-content">
                  <div className="project-meta-row">
                    <span className="project-badge">{project.badge}</span>
                    <span className="project-category">{project.category}</span>
                  </div>

                  <h3 className="project-title">{project.title}</h3>

                  {project.role && (
                    <p className="project-role">
                      <span className="project-role-label">Rol</span>
                      <span className="project-role-value">{project.role}</span>
                    </p>
                  )}

                  <p className="project-description">{project.description}</p>
                </div>

                <div className="project-card-footer">
                  <ul className="tech-tag-list">
                    {project.tags.map((tag) => (
                      <li className="tech-tag" key={tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>

                  {project.links && (project.links.demo || project.links.github) && (
                    <div className="project-actions">
                      {project.links.demo && (
                        <a
                          href={project.links.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary project-action-btn"
                        >
                          <span>Demo en vivo</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      )}
                      {project.links.github && (
                        <a
                          href={project.links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary project-action-btn"
                        >
                          <span>Código (GitHub)</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import Reveal from './Reveal';

export default function HeroSection({ profile, galaxyStats, logosCount }) {
  const starsLabel = `${Math.round((galaxyStats.stars || 160000) / 1000)}K`;

  return (
    <section className="hero-section" id="inicio" data-section="inicio">
      <div className="container hero-layout">
        <div className="hero-content">
          <Reveal as="div" className="hero-status-pill" immediate>
            <span className="ember-dot" />
            <span>{profile.availabilityPill}</span>
          </Reveal>

          <Reveal as="h1" className="hero-title" delay={1} immediate>
            {profile.name}
          </Reveal>

          <Reveal as="p" className="hero-role" delay={2} immediate>
            {profile.role}
          </Reveal>

          <Reveal as="p" className="hero-summary" delay={3} immediate>
            {profile.summary}
          </Reveal>

          <Reveal as="div" className="hero-cta-row" delay={4} immediate>
            <a href="#proyectos" className="btn-primary">
              Ver proyectos
              <span aria-hidden="true">→</span>
            </a>
            <a href="#contacto" className="btn-secondary">
              Iniciar conversación
            </a>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              {profile.githubLabel}
            </a>
          </Reveal>
        </div>

        <Reveal as="div" className="hero-bottom-bar" delay={4} immediate>
          <a href="#perfil" className="scroll-cue">
            <span className="scroll-mouse" aria-hidden="true">
              <span className="scroll-wheel" />
            </span>
            <span>Desliza para descubrir mi portafolio</span>
          </a>

          <div className="galaxy-telemetry" aria-label="Telemetría de escena 3D">
            <span className="telemetry-chip">
              Galaxia 3D · <strong id="galaxy-stars-count">{starsLabel}</strong> partículas
            </span>
            <span className="telemetry-chip">{logosCount} Logos .GLB en órbita</span>
            <span className="telemetry-chip">
              <strong id="galaxy-fps">{galaxyStats.fps} FPS</strong>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

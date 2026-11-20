import Reveal from './Reveal';

export default function StackSection({
  stackFilters,
  capabilities,
  pinnedDomain,
  onSelectDomain,
  onHoverDomain,
}) {
  return (
    <section className="portfolio-section" id="stack" data-section="stack">
      <div className="container">
        <Reveal as="header" className="section-head">
          <div className="section-eyebrow">
            <span className="eyebrow-index">03</span>
            <span className="eyebrow-sep">/</span>
            <span>Stack técnico &amp; constelación 3D</span>
          </div>
          <h2 className="section-title">
            Tecnologías en órbita: interactúa con cada área para resaltar sus logos 3D en la
            galaxia.
          </h2>
        </Reveal>

        <Reveal
          as="div"
          className="stack-filter-bar"
          role="group"
          aria-label="Filtrar logos 3D del fondo por especialidad"
          delay={1}
        >
          {stackFilters.map((filter) => {
            const isActive = (pinnedDomain || '') === filter.domain;
            return (
              <button
                key={filter.domain || 'all'}
                type="button"
                className={`filter-pill${isActive ? ' active' : ''}`}
                data-bg-domain={filter.domain}
                onClick={() => onSelectDomain(filter.domain || null)}
              >
                {filter.hasDot && <span className="ember-dot" />}
                {filter.label}
              </button>
            );
          })}
        </Reveal>

        <div className="capabilities-grid">
          {capabilities.map((cap, index) => (
            <Reveal
              as="article"
              key={cap.domain}
              className="capability-card glass-card"
              data-domain={cap.domain}
              delay={(index % 2) + 1}
              onMouseEnter={() => onHoverDomain(cap.domain)}
              onMouseLeave={() => onHoverDomain(null)}
              onTouchStart={() => onHoverDomain(cap.domain)}
            >
              <div className="cap-card-head">
                <h3 className="cap-title">{cap.title}</h3>
                <span className="cap-subtitle">{cap.subtitle}</span>
              </div>
              <p className="cap-desc">{cap.description}</p>
              <ul className="tech-tag-list">
                {cap.tags.map((tag) => (
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

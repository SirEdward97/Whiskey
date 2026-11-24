import Reveal from './Reveal';

export default function ProfileSection({ profile }) {
  return (
    <section className="portfolio-section" id="perfil" data-section="perfil">
      <div className="container">
        <Reveal as="header" className="section-head">
          <div className="section-eyebrow">
            <span className="eyebrow-index">01</span>
            <span className="eyebrow-sep">/</span>
            <span>Perfil profesional</span>
          </div>
          <h2 className="section-title">
            Tecnólogo Frontend enfocado en diseño web y experiencias 3D
          </h2>
        </Reveal>

        <div className="profile-grid">
          <Reveal as="div" className="profile-narrative glass-card" delay={1}>
            <p className="lead-paragraph">
              {profile.leadIntro.prefix}
              <strong>{profile.leadIntro.name}</strong> (<code>{profile.leadIntro.handle}</code>)
              {profile.leadIntro.suffix}
            </p>
            <p className="body-paragraph">{profile.bodyParagraph}</p>

            <div className="profile-meta-strip">
              {profile.metaStats.map((stat) => (
                <div className="meta-stat" key={stat.label}>
                  <span className="meta-label">{stat.label}</span>
                  <span className="meta-value">{stat.value}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="pillars-stack">
            {profile.pillars.map((pillar, index) => (
              <Reveal
                as="article"
                className="pillar-card glass-card"
                key={pillar.index}
                delay={index + 1}
              >
                <span className="pillar-index">{pillar.index}</span>
                <div>
                  <h3 className="pillar-title">{pillar.title}</h3>
                  <p className="pillar-desc">{pillar.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

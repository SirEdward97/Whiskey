const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'stack', label: 'Stack' },
  { id: 'contacto', label: 'Contacto' },
];

export default function Header({ profile, activeSection, orbitMode, onToggleOrbit }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#inicio" className="header-brand">
          <div className="brand-logo-frame">
            <img
              src={profile.logoUrl}
              alt={`Logotipo de ${profile.name}`}
              className="brand-logo-img"
            />
          </div>
          <div className="brand-identity">
            <div className="brand-title-row">
              <span className="brand-name">{profile.name}</span>
              <span className="ember-dot" title="Disponible para proyectos" />
            </div>
            <span className="brand-handle">{profile.handle}</span>
          </div>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-link${activeSection === item.id ? ' active' : ''}`}
              data-nav={item.id}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className={`chip-btn chip-accent${orbitMode ? ' active' : ''}`}
            id="btn-inspect-3d"
            onClick={onToggleOrbit}
            title="Despejar la interfaz para orbitar libremente la Galaxia 3D y los logos"
          >
            <span className="ember-dot" />
            <span id="label-inspect-3d">{orbitMode ? 'Volver' : 'Explorar 3D'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

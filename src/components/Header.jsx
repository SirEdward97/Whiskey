'use client';

import { useEffect, useRef, useState } from 'react';

const NAV_ITEMS = [
  { id: 'inicio', index: '01', label: 'Inicio' },
  { id: 'perfil', index: '02', label: 'Perfil' },
  { id: 'proyectos', index: '03', label: 'Proyectos' },
  { id: 'contacto', index: '04', label: 'Contacto' },
];

export default function Header({
  profile,
  activeSection,
  orbitMode,
  onToggleOrbit,
  theme,
  onToggleTheme,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const centerWrapRef = useRef(null);

  // Sincronizar porcentaje de scroll en tiempo real para la píldora central (0% - 100%)
  useEffect(() => {
    const updateScrollPercent = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100)));
      setScrollPercent(pct);
    };

    updateScrollPercent();
    window.addEventListener('scroll', updateScrollPercent, { passive: true });
    window.addEventListener('resize', updateScrollPercent, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollPercent);
      window.removeEventListener('resize', updateScrollPercent);
    };
  }, []);

  // Cerrar el menú al hacer clic fuera o al presionar Escape
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (centerWrapRef.current && !centerWrapRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleScrollBadgeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Izquierda: Monograma geométrico */}
        <a
          href="#inicio"
          className="header-brand-mark"
          aria-label={`${profile.name} (${profile.handle}) — Ir al inicio`}
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/logo/edward-mark.png"
            alt={`Logotipo de ${profile.name}`}
            className="brand-mark-img"
          />
        </a>

        {/* Centro: Cápsula flotante con Menu + Tema + Progreso % */}
        <div className="header-center-wrap" ref={centerWrapRef}>
          <div className="header-pill" role="navigation" aria-label="Navegación principal">
            <button
              type="button"
              className={`pill-menu-btn${menuOpen ? ' is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="header-menu-popover"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="pill-menu-icon" aria-hidden="true">
                <span className="menu-line menu-line-top" />
                <span className="menu-line menu-line-bottom" />
              </span>
              <span>Menu</span>
            
              
            </button>

            <button
              type="button"
              className="pill-scroll-badge"
              onClick={handleScrollBadgeClick}
              title={scrollPercent > 0 ? 'Volver arriba' : 'Progreso de lectura'}
              aria-label={`Progreso de desplazamiento: ${scrollPercent} por ciento`}
            >
              {scrollPercent}%
            </button>
          </div>

          <div
            id="header-menu-popover"
            className={`header-menu-popover${menuOpen ? ' open' : ''}`}
            aria-hidden={!menuOpen}
          >
            <nav className="popover-nav-list" aria-label="Secciones del portafolio">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`popover-nav-link${activeSection === item.id ? ' active' : ''}`}
                  data-nav={item.id}
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="popover-nav-index">{item.index}</span>
                  <span className="popover-nav-label">{item.label}</span>
                  {activeSection === item.id && <span className="ember-dot" />}
                </a>
              ))}
            </nav>

            <div className="popover-footer">
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="popover-github-link"
                tabIndex={menuOpen ? 0 : -1}
              >
                {profile.handle} ↗
              </a>
              <span className="popover-status">
                <span className="ember-dot" />
                Disponible
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Acceso perfil + Botón cápsula principal */}
        <div className="header-actions">
          
          <button
            type="button"
            className={`header-cta-pill${orbitMode ? ' active' : ''}`}
            id="btn-inspect-3d"
            onClick={onToggleOrbit}
            title="Despejar la interfaz para orbitar libremente la Galaxia 3D y los logos"
          >
            <span id="label-inspect-3d">{orbitMode ? 'Volver' : 'Explorar 3D'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

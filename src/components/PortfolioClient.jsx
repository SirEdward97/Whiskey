'use client';

import { useCallback, useEffect, useState } from 'react';
import ChapterRail from './ChapterRail';
import ContactSection from './ContactSection';
import FloatingOrbitDock from './FloatingOrbitDock';
import GalaxyBackgroundCanvas from './GalaxyBackgroundCanvas';
import Header from './Header';
import HeroSection from './HeroSection';
import ProfileSection from './ProfileSection';
import ProjectsSection from './ProjectsSection';
import ScrollProgressBar from './ScrollProgressBar';
import StageLoader from './StageLoader';

export default function PortfolioClient({ initialPortfolio }) {
  const [portfolio] = useState(initialPortfolio);
  const [activeSection, setActiveSection] = useState('inicio');
  const [orbitMode, setOrbitMode] = useState(false);
  const [theme, setTheme] = useState('dark');

  const [galaxyLoader, setGalaxyLoader] = useState({
    progress: 0,
    text: 'CARGANDO GALAXIA 3D...',
    hidden: false,
  });

  const [galaxyStats, setGalaxyStats] = useState({
    stars: 160000,
    fps: 60,
  });

  // Habilitar clases de revelado suave en body una vez hidratado en cliente
  useEffect(() => {
    document.body.classList.add('js-reveal-ready');
    return () => {
      document.body.classList.remove('js-reveal-ready');
    };
  }, []);

  // Sincronizar clase inspect-3d-background en body al entrar/salir de "Explorar 3D"
  useEffect(() => {
    document.body.classList.toggle('inspect-3d-background', orbitMode);
    return () => {
      document.body.classList.remove('inspect-3d-background');
    };
  }, [orbitMode]);

  // Sincronizar tema visual (oscuro / claro) en body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [theme]);

  // Sincronizar capítulos activos (Header + Rail lateral) con IntersectionObserver
  useEffect(() => {
    const sections = document.querySelectorAll('section[data-section]');
    if (!('IntersectionObserver' in window) || sections.length === 0) return undefined;

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) setActiveSection(id);
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: '-12% 0px -35% 0px',
      }
    );

    sections.forEach((sec) => sectionObserver.observe(sec));
    return () => sectionObserver.disconnect();
  }, []);

  // Atajo Escape para salir del modo Explorar 3D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOrbitMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoadProgress = useCallback((progress, text) => {
    setGalaxyLoader((prev) => ({ ...prev, progress, text }));
  }, []);

  const handleLoadComplete = useCallback(() => {
    setGalaxyLoader((prev) => ({ ...prev, hidden: true }));
  }, []);

  const handleTelemetryUpdate = useCallback((stats) => {
    setGalaxyStats(stats);
  }, []);

  return (
    <>
      <GalaxyBackgroundCanvas
        logosManifest={portfolio.logos3d}
        orbitMode={orbitMode}
        highlightDomain={null}
        onLoadProgress={handleLoadProgress}
        onLoadComplete={handleLoadComplete}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      <ScrollProgressBar />

      <StageLoader
        progress={galaxyLoader.progress}
        text={galaxyLoader.text}
        hidden={galaxyLoader.hidden}
      />

      <ChapterRail activeSection={activeSection} />

      <div className="page-shell">
        <Header
          profile={portfolio.profile}
          activeSection={activeSection}
          orbitMode={orbitMode}
          onToggleOrbit={() => setOrbitMode((prev) => !prev)}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />

        <main>
          <HeroSection
            profile={portfolio.profile}
            galaxyStats={galaxyStats}
            logosCount={portfolio.logos3d.length}
          />

          <ProfileSection profile={portfolio.profile} />

          <ProjectsSection projects={portfolio.projects} />

          <ContactSection contact={portfolio.contact} />
        </main>
      </div>

      <FloatingOrbitDock onExitOrbit={() => setOrbitMode(false)} />
    </>
  );
}

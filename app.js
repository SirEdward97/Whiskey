/**
 * ==========================================================================
 * APP CONTROLLER — Portafolio de Edwar Granados (@SirEdward97)
 * Coordina:
 * 1. Fondo cósmico 3D persistente (`GalaxyBackground3D`): Galaxia Vía Láctea
 *    (./galaxy/scene.gltf) + 10 logos 3D (./dev/*.glb) con cámara guiada por scroll
 * 2. Cuadro demostrativo 3D del proyecto Japanese Shrine (`JapaneseTempleShowcase`)
 * 3. Sistema de revelado progresivo al hacer scroll, barra de progreso y capítulos
 * 4. Filtros de stack 3D, inspector PBR y formulario de contacto
 * ==========================================================================
 */

import { GalaxyBackground3D } from './galaxy-bg.js';
import { JapaneseTempleShowcase } from './temple-showcase.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar escenas 3D
  const galaxyScene = new GalaxyBackground3D('galaxy-canvas');
  const templeShowcase = new JapaneseTempleShowcase('japanese-project-canvas');

  // 2. Sistema de revelado progresivo al hacer scroll
  document.body.classList.add('js-reveal-ready');
  const revealElements = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-reveal', 'visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -48px 0px'
      }
    );

    revealElements.forEach((el) => {
      // Revelar inmediatamente los elementos del Hero en cascada suave al entrar
      if (el.closest('#inicio')) {
        requestAnimationFrame(() => {
          el.setAttribute('data-reveal', 'visible');
        });
      } else {
        revealObserver.observe(el);
      }
    });
  } else {
    revealElements.forEach((el) => el.setAttribute('data-reveal', 'visible'));
  }

  // 3. Progreso de scroll + sincronización de capítulos activos (Header + Rail lateral)
  const progressFill = document.getElementById('scroll-progress-fill');
  const navLinks = document.querySelectorAll('.nav-link[data-nav]');
  const chapterDots = document.querySelectorAll('.chapter-dot[data-chapter]');
  const sections = document.querySelectorAll('section[data-section]');

  function updateScrollBar() {
    if (!progressFill) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
    progressFill.style.width = `${pct.toFixed(2)}%`;
  }

  updateScrollBar();
  window.addEventListener('scroll', updateScrollBar, { passive: true });
  window.addEventListener('resize', updateScrollBar, { passive: true });

  function setActiveChapter(sectionId) {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === sectionId);
    });
    chapterDots.forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.chapter === sectionId);
    });
  }

  if ('IntersectionObserver' in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.dataset.section);
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: '-12% 0px -35% 0px'
      }
    );
    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  // 4. Modo "Explorar 3D": despejar interfaz y orbitar libremente la Galaxia + 10 Logos
  const btnInspect3D = document.getElementById('btn-inspect-3d');
  const labelInspect3D = document.getElementById('label-inspect-3d');
  const btnExitOrbitDock = document.getElementById('btn-exit-orbit-dock');

  function setOrbitMode(active) {
    document.body.classList.toggle('inspect-3d-background', active);
    galaxyScene.setInteractiveOrbit(active);
    if (btnInspect3D) btnInspect3D.classList.toggle('active', active);
    if (labelInspect3D) {
      labelInspect3D.textContent = active ? 'Volver' : 'Explorar 3D';
    }
  }

  if (btnInspect3D) {
    btnInspect3D.addEventListener('click', () => {
      const next = !document.body.classList.contains('inspect-3d-background');
      setOrbitMode(next);
    });
  }

  if (btnExitOrbitDock) {
    btnExitOrbitDock.addEventListener('click', () => setOrbitMode(false));
  }

  // 5. Interacción entre los filtros/tarjetas del Stack y los 10 logos 3D en la Galaxia
  let pinnedBgDomain = null;
  const filterPills = document.querySelectorAll('.filter-pill[data-bg-domain]');
  const capabilityCards = document.querySelectorAll('.capability-card[data-domain]');

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      pinnedBgDomain = pill.dataset.bgDomain || null;
      galaxyScene.setHighlightDomain(pinnedBgDomain);
    });
  });

  capabilityCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      galaxyScene.setHighlightDomain(card.dataset.domain);
    });
    card.addEventListener('mouseleave', () => {
      galaxyScene.setHighlightDomain(pinnedBgDomain);
    });
    card.addEventListener(
      'touchstart',
      () => {
        galaxyScene.setHighlightDomain(card.dataset.domain);
      },
      { passive: true }
    );
  });

  // 6. Controles del cuadro demostrativo 3D del proyecto Japanese Shrine
  const presetButtons = document.querySelectorAll('[data-camera-preset]');
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.cameraPreset;
      presetButtons.forEach((b) => b.classList.toggle('active', b.dataset.cameraPreset === target));
      templeShowcase.setCameraPreset(target);
    });
  });

  const modeButtons = document.querySelectorAll('[data-render-mode]');
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.renderMode;
      modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.renderMode === target));
      templeShowcase.setRenderMode(target);
    });
  });

  const btnLightMood = document.getElementById('btn-toggle-lighting');
  if (btnLightMood) {
    btnLightMood.addEventListener('click', () => {
      const isNight = templeShowcase.toggleLightingMood();
      btnLightMood.classList.toggle('active', isNight);
      btnLightMood.textContent = isNight ? 'Luz Nocturna' : 'Luz Estudio';
    });
  }

  const btnAutoRotate = document.getElementById('btn-toggle-autorotate');
  if (btnAutoRotate) {
    btnAutoRotate.addEventListener('click', () => {
      const active = templeShowcase.toggleAutoRotate();
      btnAutoRotate.classList.toggle('active', active);
    });
  }

  const btnZoomIn = document.getElementById('btn-temple-zoom-in');
  const btnZoomOut = document.getElementById('btn-temple-zoom-out');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => templeShowcase.zoomStep(-1));
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => templeShowcase.zoomStep(1));
  }

  // 7. Inspector Modal de Mapas PBR del proyecto Japanese Temple
  const textureCards = document.querySelectorAll('.texture-card');
  const modal = document.getElementById('texture-modal');
  const modalTitle = document.getElementById('modal-texture-title');
  const modalImg = document.getElementById('modal-texture-img');
  const modalDesc = document.getElementById('modal-texture-desc');
  const modalClose = document.getElementById('btn-close-modal');

  function closeModal() {
    if (modal) modal.classList.remove('open');
  }

  textureCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (!modal) return;
      modalTitle.textContent = card.dataset.texTitle;
      modalImg.src = card.dataset.texSrc;
      modalImg.alt = card.dataset.texTitle;
      modalDesc.textContent = card.dataset.texDesc;
      modal.classList.add('open');
    });
  });

  if (modalClose && modal) {
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      if (document.body.classList.contains('inspect-3d-background')) {
        setOrbitMode(false);
      }
    }
  });

  // 8. Formulario de contacto (copia resumen estructurado al portapapeles)
  const contactForm = document.getElementById('contact-form');
  const feedbackEl = document.getElementById('form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('input-name').value.trim();
      const stack = document.getElementById('input-stack').value;
      const msg = document.getElementById('input-message').value.trim();

      const summary = `Hola Edwar (@SirEdward97), soy ${name}. Área: ${stack}. Objetivo: ${msg}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary).catch(() => {});
      }

      if (feedbackEl) {
        feedbackEl.textContent = '✓ Resumen del encargo copiado al portapapeles.';
      }
    });
  }
});

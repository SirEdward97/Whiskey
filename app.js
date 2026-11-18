/**
 * ==========================================================================
 * APP CONTROLLER — Portafolio de Edwar Granados (@SirEdward97)
 * Coordina:
 * 1. El fondo 3D completo (`TempleScene3D`): Japanese Temple (`scene.gltf`)
 *    + los 10 logos 3D `.glb` (`./dev/*.glb`) adaptados para Móvil y Escritorio
 * 2. La atmósfera de pliegues verticales (`AtmosphereBackground` — `sk.md` + `hi.md`)
 * 3. Modo "VISTA MÓVIL" (394px Portrait Simulator) + Modo "ORBITAR 3D" táctil
 * ==========================================================================
 */

import { AtmosphereBackground } from './atmosphere.js';
import { TempleScene3D } from './scene3d.js';

document.addEventListener('DOMContentLoaded', () => {
  const atmosphere = new AtmosphereBackground('atmosphere-canvas');
  const templeScene = new TempleScene3D('temple-canvas');

  atmosphere.onThemeChange((theme) => {
    templeScene.syncAccentColor(theme.rimHex);
  });

  // 1. Conmutador de Vista Móvil (394px Portrait) / Vista Escritorio
  const btnMobilePreview = document.getElementById('btn-mobile-preview');
  const labelMobilePreview = document.getElementById('label-mobile-preview');

  if (btnMobilePreview) {
    btnMobilePreview.addEventListener('click', () => {
      const isMobilePreview = document.body.classList.toggle('mobile-preview-active');
      btnMobilePreview.classList.toggle('active', isMobilePreview);
      if (labelMobilePreview) {
        labelMobilePreview.textContent = isMobilePreview ? 'VISTA ESCRITORIO' : 'VISTA MÓVIL';
      }
      requestAnimationFrame(() => {
        atmosphere.handleViewportChange();
        templeScene.handleViewportChange();
      });
    });
  }

  // 2. Botón para despejar la interfaz y orbitar libremente el fondo 3D (con soporte táctil)
  const btnInspect3D = document.getElementById('btn-inspect-3d');
  const labelInspect3D = document.getElementById('label-inspect-3d');
  const btnExitOrbitDock = document.getElementById('btn-exit-orbit-dock');

  function setOrbitMode(active) {
    document.body.classList.toggle('inspect-3d-background', active);
    templeScene.setInteractiveOrbit(active);
    if (btnInspect3D) btnInspect3D.classList.toggle('active', active);
    if (labelInspect3D) {
      labelInspect3D.textContent = active ? 'VOLVER A LECTURA' : 'ORBITAR 3D';
    }
  }

  if (btnInspect3D) {
    btnInspect3D.addEventListener('click', () => {
      const next = !document.body.classList.contains('inspect-3d-background');
      setOrbitMode(next);
    });
  }

  if (btnExitOrbitDock) {
    btnExitOrbitDock.addEventListener('click', () => {
      setOrbitMode(false);
    });
  }

  // 3. Interacción entre la tira de logos (.tech-logo-strip), filas de capacidades y los logos 3D del fondo
  let pinnedBgDomain = null;
  const stripCells = document.querySelectorAll('.tech-strip-cell');
  const capabilityRows = document.querySelectorAll('.capability-row[data-domain]');

  stripCells.forEach((cell) => {
    cell.addEventListener('click', () => {
      stripCells.forEach((c) => c.classList.remove('active'));
      cell.classList.add('active');
      pinnedBgDomain = cell.dataset.bgDomain || null;
      templeScene.setHighlightDomain(pinnedBgDomain);
    });
  });

  capabilityRows.forEach((row) => {
    row.addEventListener('mouseenter', () => {
      templeScene.setHighlightDomain(row.dataset.domain);
    });
    row.addEventListener('mouseleave', () => {
      templeScene.setHighlightDomain(pinnedBgDomain);
    });
    // Soporte táctil en móviles: tocar una fila resalta sus logos 3D en el fondo
    row.addEventListener(
      'touchstart',
      () => {
        templeScene.setHighlightDomain(row.dataset.domain);
      },
      { passive: true }
    );
  });

  // 4. Panel de ajuste de atmósfera (sk.md + hi.md)
  const drawer = document.getElementById('atmosphere-drawer');
  const toggleBtn = document.getElementById('btn-atmosphere-toggle');
  const closeDrawerBtn = document.getElementById('btn-close-drawer');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggleBtn.classList.toggle('active', isOpen);
    });
  }
  if (closeDrawerBtn && drawer) {
    closeDrawerBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
      if (toggleBtn) toggleBtn.classList.remove('active');
    });
  }

  const foldCountSlider = document.getElementById('knob-folds');
  const foldCountVal = document.getElementById('val-folds');
  if (foldCountSlider) {
    foldCountSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (foldCountVal) foldCountVal.textContent = `${val}`;
      atmosphere.setConfig({ foldCount: val });
    });
  }

  const driftSlider = document.getElementById('knob-drift');
  const driftVal = document.getElementById('val-drift');
  if (driftSlider) {
    driftSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (driftVal) driftVal.textContent = `${Math.round(val * 100)}%`;
      atmosphere.setConfig({ drift: val });
    });
  }

  const softnessSlider = document.getElementById('knob-softness');
  const softnessVal = document.getElementById('val-softness');
  if (softnessSlider) {
    softnessSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (softnessVal) softnessVal.textContent = `${Math.round(val * 100)}%`;
      atmosphere.setConfig({ softness: val });
    });
  }

  const themeButtons = document.querySelectorAll('.theme-swatch');
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      themeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      atmosphere.setConfig({ themeKey: btn.dataset.theme });
    });
  });

  // 5. Controles de la estructura 3D (sincronizados entre Hero y Dock flotante móvil)
  const modeButtons = document.querySelectorAll('[data-render-mode]');
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetMode = btn.dataset.renderMode;
      modeButtons.forEach((b) => {
        b.classList.toggle('active', b.dataset.renderMode === targetMode);
      });
      templeScene.setRenderMode(targetMode);
    });
  });

  const presetButtons = document.querySelectorAll('[data-camera-preset]');
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetPreset = btn.dataset.cameraPreset;
      presetButtons.forEach((b) => {
        b.classList.toggle('active', b.dataset.cameraPreset === targetPreset);
      });
      templeScene.setCameraPreset(targetPreset);
    });
  });

  const btnLightMood = document.getElementById('btn-toggle-lighting');
  if (btnLightMood) {
    btnLightMood.addEventListener('click', () => {
      const isNight = templeScene.toggleLightingMood();
      btnLightMood.classList.toggle('active', isNight);
      btnLightMood.innerHTML = isNight
        ? '<span class="glyph">+</span> LUZ NOCTURNA'
        : '<span class="glyph">+</span> LUZ ESTUDIO';
    });
  }

  // 6. Inspector de mapas PBR
  const textureCards = document.querySelectorAll('.texture-card');
  const modal = document.getElementById('texture-modal');
  const modalTitle = document.getElementById('modal-texture-title');
  const modalImg = document.getElementById('modal-texture-img');
  const modalDesc = document.getElementById('modal-texture-desc');
  const modalClose = document.getElementById('btn-close-modal');

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
    modalClose.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  // 7. Formulario de encargo
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
        feedbackEl.textContent = 'RESUMEN DEL ENCARGO COPIADO AL PORTAPAPELES.';
      }
    });
  }
});

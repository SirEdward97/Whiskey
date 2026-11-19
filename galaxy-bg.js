/**
 * ==========================================================================
 * 3D GALAXY + DEV LOGOS PERSISTENT BACKGROUND ENGINE — `galaxy-bg.js`
 * Renderiza en el fondo fijo de toda la página (`#galaxy-canvas`):
 * 1. Galaxia 3D "Our Milky Way galaxy" (`./galaxy/scene.gltf`, 160,000 estrellas)
 *    mejorada con sprites radiales de brillo estelar y mezcla aditiva.
 * 2. Constelación orbital de los 10 logos 3D (`./dev/*.glb`) flotando junto
 *    a los brazos espirales de la galaxia.
 * 3. Coreografía de cámara impulsada por el scroll (Catmull-Rom spline de
 *    5 capítulos) + paralaje suave + modo interactivo "Explorar 3D".
 * ==========================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DEV_LOGOS_MANIFEST } from './bg-logos.js';

export class GalaxyBackground3D {
  constructor(canvasId = 'galaxy-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.logoItems = [];
    this.galaxyPoints = [];
    this.interactiveOrbit = false;
    this.activeDomain = null;

    this.scrollProgress = 0;
    this.smoothScroll = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    this.stats = {
      stars: 160000,
      logosLoaded: 0,
      fps: 60
    };
    this._frameCount = 0;
    this._lastFpsUpdate = this.startTime;

    this._initScene();
    this._initLights();
    this._initScrollCurves();
    this._initControls();
    this._initAmbientStarfield();
    this._loadGalaxyModel();
    this._loadDevLogos();
    this._bindEvents();
    this._animate();
  }

  _isMobileViewport() {
    return this.width < 768 || this.width / Math.max(1, this.height) < 0.85;
  }

  _createStarGlowTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const half = size / 2;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.16, 'rgba(255, 250, 242, 0.92)');
    grad.addColorStop(0.38, 'rgba(215, 226, 255, 0.30)');
    grad.addColorStop(0.72, 'rgba(140, 170, 255, 0.06)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  _createCoreHaloTexture() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const half = size / 2;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, 'rgba(255, 232, 200, 0.92)');
    grad.addColorStop(0.2, 'rgba(255, 178, 120, 0.42)');
    grad.addColorStop(0.5, 'rgba(130, 150, 235, 0.12)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  _initScene() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const isMobile = this._isMobileViewport();

    this.scene = new THREE.Scene();

    const mobileScale = isMobile ? 1.24 : 1.0;
    this.camera = new THREE.PerspectiveCamera(
      isMobile ? 54 : 46,
      this.width / Math.max(1, this.height),
      0.1,
      200
    );
    this.camera.position.set(0.8 * mobileScale, 5.4 * mobileScale, 15.2 * mobileScale);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.starTexture = this._createStarGlowTexture();

    // Grupo contenedor con inclinación artística de la galaxia
    this.galaxyTiltGroup = new THREE.Group();
    this.galaxyTiltGroup.rotation.set(0.28, 0, -0.15);
    this.scene.add(this.galaxyTiltGroup);

    // Grupo rotatorio interno de la galaxia
    this.galaxySpinGroup = new THREE.Group();
    this.galaxyTiltGroup.add(this.galaxySpinGroup);

    // Grupo orbital para los 10 logos 3D de tecnologías (.glb)
    this.logosGroup = new THREE.Group();
    this.scene.add(this.logosGroup);

    // Vectores temporales para evitar GC por frame
    this._tmpCamPos = new THREE.Vector3();
    this._tmpCamTarget = new THREE.Vector3();
    this._currentLookAt = new THREE.Vector3(0, -0.2, 0);
  }

  _initLights() {
    // Iluminación equilibrada para esculpir los 10 logos 3D sobre el espacio profundo
    this.hemiLight = new THREE.HemisphereLight(0xe2ecff, 0x0b0e1a, 1.55);
    this.hemiLight.position.set(0, 14, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4ea, 2.75);
    this.keyLight.position.set(8, 10, 9);
    this.scene.add(this.keyLight);

    // Rim Light sincronizada con el acento activo (Ember / Silver / Cyan)
    this.rimLight = new THREE.DirectionalLight(0xff6b3d, 2.4);
    this.rimLight.position.set(-9, 4, -7);
    this.scene.add(this.rimLight);

    // Luz fría de relleno estelar para los contornos
    this.cosmicFill = new THREE.DirectionalLight(0x7dd3fc, 1.55);
    this.cosmicFill.position.set(6, -6, -8);
    this.scene.add(this.cosmicFill);

    // Resplandor cálido emanando del núcleo galáctico
    this.coreLight = new THREE.PointLight(0xffb47d, 2.2, 22);
    this.coreLight.position.set(0, 0, 0);
    this.scene.add(this.coreLight);
  }

  _initScrollCurves() {
    const mobileScale = this._isMobileViewport() ? 1.22 : 1.0;

    // 5 capítulos de inmersión progresiva: la cámara desciende y se adentra en la galaxia al scrollear
    this.camPosCurve = new THREE.CatmullRomCurve3(
      [
        // 01 Inicio (Hero): plano panorámico viendo toda la galaxia completa
        new THREE.Vector3(0.8 * mobileScale, 5.4 * mobileScale, 15.2 * mobileScale),
        // 02 Perfil: aproximación hacia los brazos espirales exteriores
        new THREE.Vector3(-2.2 * mobileScale, 3.25 * mobileScale, 10.6 * mobileScale),
        // 03 Proyectos: cruce inmersivo entrando en el plano luminoso de los brazos
        new THREE.Vector3(-1.2 * mobileScale, 1.45 * mobileScale, 6.4 * mobileScale),
        // 04 Stack 3D: vuelo profundo entre estrellas y la constelación de logos .glb
        new THREE.Vector3(1.1 * mobileScale, 0.65 * mobileScale, 3.0 * mobileScale),
        // 05 Contacto: inmersión total en el interior expandido de la Vía Láctea
        new THREE.Vector3(0.15 * mobileScale, 0.2 * mobileScale, 0.75 * mobileScale)
      ],
      false,
      'catmullrom',
      0.5
    );

    this.camTargetCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.0, -0.1, 0.0),
        new THREE.Vector3(0.2, -0.15, -0.8),
        new THREE.Vector3(0.0, -0.1, -1.8),
        new THREE.Vector3(-0.15, 0.0, -2.8),
        new THREE.Vector3(0.0, 0.0, -4.5)
      ],
      false,
      'catmullrom',
      0.5
    );
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.85;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 32.0;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.45;
    this.controls.enabled = false;
  }

  _initAmbientStarfield() {
    // Campo estelar lejano sutil para dar profundidad infinita en todos los ángulos
    const count = 850;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color(0xe2e8f0),
      new THREE.Color(0xbfdbfe),
      new THREE.Color(0xfed7aa),
      new THREE.Color(0xc7d2fe)
    ];

    for (let i = 0; i < count; i++) {
      const r = 24 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[i % palette.length];
      const intensity = 0.45 + Math.random() * 0.55;
      colors[i * 3] = c.r * intensity;
      colors[i * 3 + 1] = c.g * intensity;
      colors[i * 3 + 2] = c.b * intensity;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      sizeAttenuation: true,
      map: this.starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.ambientStars = new THREE.Points(geo, mat);
    this.scene.add(this.ambientStars);
  }

  _loadGalaxyModel() {
    const loader = new GLTFLoader();
    const progressBar = document.getElementById('loader-progress-bar');
    const loaderText = document.getElementById('loader-text');
    const loaderOverlay = document.getElementById('stage-loader');

    loader.load(
      './galaxy/scene.gltf',
      (gltf) => {
        const galaxy = gltf.scene;

        galaxy.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(galaxy);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        // Normalizar la galaxia a ~21 unidades de diámetro visual
        const scaleFactor = 21.0 / maxDim;
        galaxy.scale.multiplyScalar(scaleFactor);
        galaxy.position.sub(center.multiplyScalar(scaleFactor));

        const isMobile = this._isMobileViewport();
        let totalStars = 0;

        galaxy.traverse((child) => {
          if (child.isPoints) {
            const geom = child.geometry;
            const posAttr = geom.attributes.position;
            if (posAttr) totalStars += posAttr.count;

            // Realzar sutilmente la vitalidad de los colores estelares (núcleo ámbar + brazos azules)
            const colAttr = geom.attributes.color;
            if (colAttr) {
              for (let i = 0; i < colAttr.count; i++) {
                const r = colAttr.getX(i);
                const g = colAttr.getY(i);
                const b = colAttr.getZ(i);
                // Curva equilibrada para realzar el núcleo cálido y los brazos azules sin saturar
                colAttr.setXYZ(
                  i,
                  Math.min(1, r * 1.38),
                  Math.min(1, g * 1.28),
                  Math.min(1, b * 1.48)
                );
              }
              colAttr.needsUpdate = true;
            }

            if (child.material) {
              child.material.dispose();
            }

            child.material = new THREE.PointsMaterial({
              size: isMobile ? 0.068 : 0.055,
              sizeAttenuation: true,
              map: this.starTexture,
              vertexColors: true,
              transparent: true,
              opacity: 0.48,
              blending: THREE.AdditiveBlending,
              depthWrite: false
            });

            this.galaxyPoints.push(child);
          }
        });

        this.galaxySpinGroup.add(galaxy);

        // Halo cálido volumétrico sutil en el núcleo galáctico
        const haloMat = new THREE.SpriteMaterial({
          map: this._createCoreHaloTexture(),
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.coreHalo = new THREE.Sprite(haloMat);
        this.coreHalo.scale.set(5.4, 3.6, 1);
        this.galaxySpinGroup.add(this.coreHalo);

        this.stats.stars = totalStars || 160000;
        this._updateTelemetryDOM();

        if (progressBar) progressBar.style.width = '100%';
        if (loaderText) loaderText.textContent = 'GALAXIA 3D LISTA';
        setTimeout(() => {
          if (loaderOverlay) loaderOverlay.classList.add('hidden');
        }, 280);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (loaderText) loaderText.textContent = `CARGANDO GALAXIA 3D (${pct}%)`;
        }
      },
      (error) => {
        console.error('Error cargando ./galaxy/scene.gltf:', error);
        if (loaderOverlay) loaderOverlay.classList.add('hidden');
      }
    );
  }

  _loadDevLogos() {
    const loader = new GLTFLoader();

    // Constelación orbital 3D equilibrada alrededor de la galaxia (10 logos .glb)
    // Distribuidos en anillo helicoidal para lucir en todos los capítulos del scroll
    const orbitalSlots = [
      { angle: 0.25, radius: 6.4, y: 1.8, size: 1.05 },  // Three.js
      { angle: 0.88, radius: 7.2, y: -1.1, size: 0.98 }, // HTML5
      { angle: 1.52, radius: 6.1, y: 2.3, size: 0.96 },  // JavaScript
      { angle: 2.15, radius: 7.0, y: -0.6, size: 1.08 }, // Python
      { angle: 2.78, radius: 6.3, y: 1.5, size: 1.0 },   // Tailwind CSS
      { angle: 3.42, radius: 7.3, y: -1.5, size: 1.04 }, // Node.js
      { angle: 4.05, radius: 6.0, y: 2.0, size: 0.95 },  // CSS3
      { angle: 4.68, radius: 7.1, y: -0.9, size: 1.05 }, // MongoDB
      { angle: 5.30, radius: 6.5, y: 1.3, size: 1.06 },  // Docker
      { angle: 5.92, radius: 7.0, y: -1.4, size: 1.02 }  // Kubernetes
    ];

    DEV_LOGOS_MANIFEST.forEach((entry, idx) => {
      const slot = orbitalSlots[idx] || {
        angle: (idx / DEV_LOGOS_MANIFEST.length) * Math.PI * 2,
        radius: 6.6,
        y: idx % 2 === 0 ? 1.6 : -1.2,
        size: 1.0
      };

      loader.load(
        entry.file,
        (gltf) => {
          const rawModel = gltf.scene;

          rawModel.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(rawModel);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          rawModel.scale.multiplyScalar(slot.size / maxDim);

          rawModel.updateMatrixWorld(true);
          const scaledBox = new THREE.Box3().setFromObject(rawModel);
          const center = scaledBox.getCenter(new THREE.Vector3());
          rawModel.position.sub(center);

          const logoMaterials = [];

          rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material.clone();
              if (entry.id === 'threejs') {
                // Acabado platino brillante para que el logo Three.js destaque sobre el espacio
                mat.color.setHex(0xe8eef8);
                mat.metalness = 0.55;
                mat.roughness = 0.22;
                mat.emissive = new THREE.Color(0x94a3b8);
                mat.emissiveIntensity = 0.2;
              } else {
                mat.metalness = Math.max(mat.metalness || 0, 0.22);
                mat.roughness = Math.min(mat.roughness || 0.35, 0.3);
                if (mat.color) {
                  mat.emissive = mat.color.clone().multiplyScalar(0.32);
                  mat.emissiveIntensity = 0.22;
                }
              }
              mat.transparent = true;
              mat.opacity = 0.9;
              child.material = mat;
              logoMaterials.push(mat);
            }
          });

          const isMobile = this._isMobileViewport();
          const holder = new THREE.Group();
          const radiusScale = isMobile ? 0.88 : 1.0;

          const baseX = Math.cos(slot.angle) * slot.radius * radiusScale;
          const baseZ = Math.sin(slot.angle) * slot.radius * radiusScale;
          const baseY = slot.y;

          holder.position.set(baseX, baseY, baseZ);
          holder.add(rawModel);
          this.logosGroup.add(holder);

          const baseScale = isMobile ? 0.82 : 1.0;
          this.logoItems.push({
            ...entry,
            slot,
            holder,
            rawModel,
            materials: logoMaterials,
            currentScale: baseScale,
            targetScale: baseScale,
            currentOpacity: 0.9,
            targetOpacity: 0.9,
            currentEmissive: 0.22,
            targetEmissive: 0.22
          });

          this.stats.logosLoaded = this.logoItems.length;
        },
        undefined,
        (err) => {
          console.warn(`No se pudo cargar ${entry.file}:`, err);
        }
      );
    });
  }

  setHighlightDomain(domain) {
    this.activeDomain = domain || null;
    const baseScale = this._isMobileViewport() ? 0.82 : 1.0;

    this.logoItems.forEach((item) => {
      const isMatch =
        !domain ||
        item.domain === domain ||
        (domain === 'ai' && (item.id === 'python' || item.id === 'nodejs' || item.id === 'docker'));

      if (!domain) {
        item.targetScale = baseScale;
        item.targetOpacity = 0.9;
        item.targetEmissive = 0.22;
      } else if (isMatch) {
        item.targetScale = baseScale * 1.42;
        item.targetOpacity = 1.0;
        item.targetEmissive = 0.55;
      } else {
        item.targetScale = baseScale * 0.72;
        item.targetOpacity = 0.2;
        item.targetEmissive = 0.06;
      }
    });
  }

  setInteractiveOrbit(enabled) {
    this.interactiveOrbit = enabled;
    if (this.controls) {
      this.controls.enabled = enabled;
      if (enabled) {
        this.controls.target.copy(this._currentLookAt);
        this.controls.update();
      }
    }
    this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    this.canvas.style.touchAction = enabled ? 'none' : 'auto';
    return this.interactiveOrbit;
  }

  handleViewportChange() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const isMobile = this._isMobileViewport();

    this.camera.fov = isMobile ? 54 : 46;
    this.camera.aspect = this.width / Math.max(1, this.height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));

    this._initScrollCurves();

    // Ajustar tamaño de estrellas en móvil vs escritorio
    const starSize = isMobile ? 0.068 : 0.055;
    this.galaxyPoints.forEach((pts) => {
      if (pts.material) pts.material.size = starSize;
    });

    this.setHighlightDomain(this.activeDomain);
  }

  _updateTelemetryDOM() {
    const starsEl = document.getElementById('galaxy-stars-count');
    const fpsEl = document.getElementById('galaxy-fps');
    if (starsEl) {
      starsEl.textContent = `${Math.round(this.stats.stars / 1000)}K`;
    }
    if (fpsEl) {
      fpsEl.textContent = `${this.stats.fps} FPS`;
    }
  }

  _updateScrollProgress() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.scrollProgress = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));
  }

  _bindEvents() {
    this._updateScrollProgress();

    window.addEventListener(
      'scroll',
      () => {
        this._updateScrollProgress();
      },
      { passive: true }
    );

    window.addEventListener(
      'mousemove',
      (e) => {
        this.targetMouseX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        this.targetMouseY = -(e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (this.interactiveOrbit || !e.touches || !e.touches[0]) return;
        const touch = e.touches[0];
        this.targetMouseX = (touch.clientX / Math.max(1, window.innerWidth) - 0.5) * 1.4;
        this.targetMouseY = -(touch.clientY / Math.max(1, window.innerHeight) - 0.5) * 1.2;
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      this.handleViewportChange();
    });
  }

  _animate() {
    const tick = (now) => {
      const dt = Math.min(0.05, (now - this.lastFrameTime) * 0.001);
      this.lastFrameTime = now;
      const t = (now - this.startTime) * 0.001;

      // FPS Telemetry
      this._frameCount++;
      if (now - this._lastFpsUpdate >= 700) {
        this.stats.fps = Math.min(
          144,
          Math.round((this._frameCount * 1000) / (now - this._lastFpsUpdate))
        );
        this._frameCount = 0;
        this._lastFpsUpdate = now;
        const fpsEl = document.getElementById('galaxy-fps');
        if (fpsEl) fpsEl.textContent = `${this.stats.fps} FPS`;
      }

      // Inercia suave para mouse y scroll
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.045;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.045;
      this.smoothScroll += (this.scrollProgress - this.smoothScroll) * 0.055;

      const isMobile = this._isMobileViewport();
      const expandProgress = Math.pow(this.smoothScroll, 1.12);

      // Expansión orgánica + rotación acelerada de la galaxia mientras nos adentramos
      if (this.galaxySpinGroup) {
        this.galaxySpinGroup.rotation.y += dt * (0.036 + this.smoothScroll * 0.05);
        const galaxyScale = 1.0 + expandProgress * 1.45;
        this.galaxySpinGroup.scale.setScalar(galaxyScale);
      }

      // Nivelar progresivamente el plano galáctico para sentir que cruzamos entre sus brazos
      if (this.galaxyTiltGroup) {
        this.galaxyTiltGroup.rotation.x = 0.30 * (1 - this.smoothScroll * 0.62) + this.mouseY * 0.04;
        this.galaxyTiltGroup.rotation.z = -0.15 * (1 - this.smoothScroll * 0.55) + this.mouseX * 0.03;
      }

      // Escalar suavemente las partículas y moderar el brillo del núcleo al entrar cerca
      const baseStarSize = isMobile ? 0.068 : 0.055;
      const dynamicStarSize = baseStarSize * (1 + this.smoothScroll * 0.45);
      for (let i = 0; i < this.galaxyPoints.length; i++) {
        if (this.galaxyPoints[i].material) {
          this.galaxyPoints[i].material.size = dynamicStarSize;
        }
      }
      if (this.coreHalo && this.coreHalo.material) {
        this.coreHalo.material.opacity = 0.28 * (1 - this.smoothScroll * 0.58);
      }

      // Campo estelar lejano con sensación de avance profundo
      if (this.ambientStars) {
        this.ambientStars.rotation.y = t * 0.006;
        this.ambientStars.scale.setScalar(1.0 + this.smoothScroll * 0.35);
        this.ambientStars.position.z = this.smoothScroll * 3.5;
      }

      // Órbita de los 10 logos 3D expandiéndose y acompañando el viaje hacia adentro
      const logoRingExpand = 1.0 + expandProgress * 0.52;
      if (this.logosGroup) {
        this.logosGroup.rotation.y = t * 0.05 + this.smoothScroll * Math.PI * 0.9;
        this.logosGroup.position.z = -this.smoothScroll * 4.2;
      }

      const radiusScale = (isMobile ? 0.88 : 1.0) * logoRingExpand;

      for (let i = 0; i < this.logoItems.length; i++) {
        const item = this.logoItems[i];
        const h = item.holder;
        const s = item.slot;

        const baseX = Math.cos(s.angle) * s.radius * radiusScale;
        const baseZ = Math.sin(s.angle) * s.radius * radiusScale;
        const floatY = Math.sin(t * item.speed + item.phase) * 0.28;
        const floatR = Math.cos(t * item.speed * 0.65 + item.phase) * 0.16;

        h.position.x = baseX + Math.cos(s.angle) * floatR;
        h.position.y = s.y * (1 + this.smoothScroll * 0.2) + floatY;
        h.position.z = baseZ + Math.sin(s.angle) * floatR;

        // Rotación tridimensional propia de cada logo
        h.rotation.y = t * (0.28 + item.speed * 0.22) + item.phase;
        h.rotation.x = Math.sin(t * item.speed * 0.5 + item.phase) * 0.2;

        // Transiciones suaves de escala, opacidad y brillo al filtrar stack
        item.currentScale += (item.targetScale - item.currentScale) * 0.08;
        h.scale.setScalar(item.currentScale);

        if (Math.abs(item.currentOpacity - item.targetOpacity) > 0.003) {
          item.currentOpacity += (item.targetOpacity - item.currentOpacity) * 0.08;
          item.materials.forEach((m) => {
            m.opacity = item.currentOpacity;
          });
        }

        if (Math.abs(item.currentEmissive - item.targetEmissive) > 0.003) {
          item.currentEmissive += (item.targetEmissive - item.currentEmissive) * 0.08;
          item.materials.forEach((m) => {
            if (m.emissive) m.emissiveIntensity = item.currentEmissive;
          });
        }
      }

      // Cámara: modo Orbitar libre vs Inmersión progresiva hacia el interior de la galaxia
      if (this.interactiveOrbit && this.controls) {
        this.controls.update();
      } else {
        this.camPosCurve.getPointAt(this.smoothScroll, this._tmpCamPos);
        this.camTargetCurve.getPointAt(this.smoothScroll, this._tmpCamTarget);

        // Paralaje sutil con el cursor (se modera suavemente al entrar muy profundo)
        const parallaxScale = 1 - this.smoothScroll * 0.4;
        this._tmpCamPos.x += this.mouseX * 0.65 * parallaxScale;
        this._tmpCamPos.y += this.mouseY * 0.45 * parallaxScale;

        this.camera.position.lerp(this._tmpCamPos, 0.08);
        this._currentLookAt.lerp(this._tmpCamTarget, 0.08);
        this.camera.lookAt(this._currentLookAt);

        // Apertura suave del FOV (+10°) para intensificar la sensación de expansión e inmersión
        const baseFov = isMobile ? 54 : 46;
        const targetFov = baseFov + this.smoothScroll * 10;
        if (Math.abs(this.camera.fov - targetFov) > 0.02) {
          this.camera.fov += (targetFov - this.camera.fov) * 0.08;
          this.camera.updateProjectionMatrix();
        }
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}

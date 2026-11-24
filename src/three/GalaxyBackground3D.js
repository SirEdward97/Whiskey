/**
 * ==========================================================================
 * 3D GALAXY + DEV LOGOS PERSISTENT BACKGROUND ENGINE — `GalaxyBackground3D.js`
 * Renderiza en el fondo fijo de toda la página (`#galaxy-canvas`):
 * 1. Galaxia 3D "Our Milky Way galaxy" (`/galaxy/stars.glb`, 160,000 estrellas)
 *    renderizada con shaders GLSL analíticos de alta nitidez (PSF óptico,
 *    anti-aliasing subpíxel, difracción sutil y atenuación cerca de la lente).
 * 2. Constelación orbital de los 10 logos 3D (`/dev/*.glb`) flotando junto
 *    a los brazos espirales de la galaxia.
 * 3. Coreografía inmersiva de cámara impulsada por el scroll del mouse
 *    (Catmull-Rom spline de 5 capítulos que se acerca y sumerge entre las
 *    estrellas) + paralaje suave + modo interactivo "Explorar 3D".
 * ==========================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DEFAULT_DEV_LOGOS_MANIFEST } from './logosManifest';

const GALAXY_MODEL_URL = '/galaxy/stars.glb';

const STAR_VERTEX_SHADER = /* glsl */ `
  uniform float uViewportScale;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform float uSizeMultiplier;

  attribute float aSize;
  attribute float aAlpha;
  attribute float aPhase;
  attribute float aSpike;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpike;
  varying float vCssSize;

  void main() {
    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = max(0.05, -mvPosition.z);

    // Centelleo orgánico muy sutil para mantener nitidez astronómica
    float twinkleFreq = 1.15 + fract(aPhase * 7.13) * 1.45;
    float twinkle = 0.90 + 0.10 * sin(uTime * twinkleFreq + aPhase * 6.2831853);

    // Tamaño proyectado en píxeles físicos proporcional a la cercanía a la cámara
    float rawPx = aSize * uSizeMultiplier * uViewportScale / dist;

    // Anti-aliasing subpíxel en estrellas lejanas y techo limpio en acercamientos profundos
    float minPx = 1.35 * uPixelRatio;
    float maxPx = (aSpike > 0.05 ? 20.0 : 12.0) * uPixelRatio;
    float clampedPx = clamp(rawPx, minPx, maxPx);
    float coverage = clamp(rawPx / minPx, 0.36, 1.0);

    // Desvanecimiento suave al cruzar muy cerca de la lente durante el vuelo por scroll
    float nearFade = smoothstep(0.18, 0.85, dist);

    gl_PointSize = clampedPx;
    vCssSize = clampedPx / max(1.0, uPixelRatio);
    vAlpha = aAlpha * twinkle * coverage * nearFade;
    vSpike = aSpike;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpike;
  varying float vCssSize;

  void main() {
    vec2 uv = (gl_PointCoord - 0.5) * 2.0;
    float r2 = dot(uv, uv);
    if (r2 > 1.0) discard;

    float r = sqrt(r2);
    float edgeMask = smoothstep(1.0, 0.08, r);

    // Función de dispersión óptica (PSF): núcleo puntual nítido + corona luminosa suave
    float core = exp(-r2 * 22.0);
    float innerCorona = exp(-r * 4.8) * 0.5;
    float outerHalo = pow(max(0.0, 1.0 - r), 2.8) * 0.2;

    // Cruz de difracción óptica sutil solo en las estrellas más brillantes al acercarse
    float diffraction = 0.0;
    if (vSpike > 0.05 && vCssSize > 3.6) {
      float ax = abs(uv.x);
      float ay = abs(uv.y);
      float rayX = exp(-ay * 18.0) * exp(-ax * 3.4);
      float rayY = exp(-ax * 18.0) * exp(-ay * 3.4);
      diffraction = (rayX + rayY) * 0.34 * vSpike * smoothstep(3.6, 7.2, vCssSize);
    }

    float intensity = (core + innerCorona + outerHalo + diffraction) * edgeMask;

    // Núcleo incandescente rodeado del tono espectral real de cada estrella
    vec3 finalColor = mix(vColor, vec3(1.0, 0.99, 0.97), clamp(core * 0.56, 0.0, 0.56));
    float alpha = clamp(intensity * vAlpha, 0.0, 1.0);

    if (alpha < 0.002) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function createSeededRandom(seed = 19970524) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeMilkyWayColor(r, g, b, rNorm) {
  // Realce fotográfico calibrado para los colores base de stars.glb (media ~0.32)
  let nr = Math.min(1.0, r * 1.78);
  let ng = Math.min(1.0, g * 1.66);
  let nb = Math.min(1.0, b * 1.92);

  const luma = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
  const satBoost = 1.42;

  nr = THREE.MathUtils.clamp(luma + (nr - luma) * satBoost, 0.12, 1.0);
  ng = THREE.MathUtils.clamp(luma + (ng - luma) * satBoost, 0.12, 1.0);
  nb = THREE.MathUtils.clamp(luma + (nb - luma) * satBoost, 0.14, 1.0);

  // Calidez dorada delicada en el núcleo y azul cristalino en los brazos exteriores
  const coreWarmth = Math.max(0, 1 - rNorm / 0.28);
  const outerCool = THREE.MathUtils.smoothstep(rNorm, 0.28, 0.9);

  nr = THREE.MathUtils.clamp(nr * (1 + coreWarmth * 0.14 - outerCool * 0.06), 0.12, 1.0);
  ng = THREE.MathUtils.clamp(ng * (1 + coreWarmth * 0.05), 0.14, 1.0);
  nb = THREE.MathUtils.clamp(nb * (1 - coreWarmth * 0.1 + outerCool * 0.1), 0.18, 1.0);

  return [nr, ng, nb];
}

export class GalaxyBackground3D {
  constructor(canvas, options = {}) {
    this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!this.canvas) return;

    this.logosManifest =
      Array.isArray(options.logosManifest) && options.logosManifest.length > 0
        ? options.logosManifest
        : DEFAULT_DEV_LOGOS_MANIFEST;
    this.onLoadProgress = options.onLoadProgress || null;
    this.onLoadComplete = options.onLoadComplete || null;
    this.onTelemetryUpdate = options.onTelemetryUpdate || null;

    this._disposed = false;
    this._rafId = null;
    this._hideTimer = null;

    this.logoItems = [];
    this.galaxyShaderMaterials = [];
    this.galaxyStarMaterial = null;
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
      fps: 60,
    };
    this._frameCount = 0;
    this._lastFpsUpdate = this.startTime;

    this._onScroll = () => this._updateScrollProgress();
    this._onMouseMove = (e) => {
      this.targetMouseX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      this.targetMouseY = -(e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    this._onTouchMove = (e) => {
      if (this.interactiveOrbit || !e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      this.targetMouseX = (touch.clientX / Math.max(1, window.innerWidth) - 0.5) * 1.4;
      this.targetMouseY = -(touch.clientY / Math.max(1, window.innerHeight) - 0.5) * 1.2;
    };
    this._onResize = () => this.handleViewportChange();

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

  _getTargetPixelRatio(isMobile) {
    return Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2.5);
  }

  _getViewportScale() {
    return this.height * this.pixelRatio * 0.5;
  }

  _createCoreHaloTexture() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const half = size / 2;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, 'rgba(255, 232, 200, 0.88)');
    grad.addColorStop(0.2, 'rgba(255, 178, 120, 0.38)');
    grad.addColorStop(0.5, 'rgba(130, 150, 235, 0.11)');
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
    this.pixelRatio = this._getTargetPixelRatio(isMobile);

    this.scene = new THREE.Scene();

    const mobileScale = isMobile ? 1.22 : 1.0;
    this.camera = new THREE.PerspectiveCamera(
      isMobile ? 54 : 46,
      this.width / Math.max(1, this.height),
      0.1,
      240
    );
    this.camera.position.set(0.8 * mobileScale, 5.4 * mobileScale, 15.2 * mobileScale);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

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
    this._currentLookAt = new THREE.Vector3(0, -0.1, 0);
  }

  _initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xe2ecff, 0x0b0e1a, 1.55);
    this.hemiLight.position.set(0, 14, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4ea, 2.75);
    this.keyLight.position.set(8, 10, 9);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xff6b3d, 2.4);
    this.rimLight.position.set(-9, 4, -7);
    this.scene.add(this.rimLight);

    this.cosmicFill = new THREE.DirectionalLight(0x7dd3fc, 1.55);
    this.cosmicFill.position.set(6, -6, -8);
    this.scene.add(this.cosmicFill);

    this.coreLight = new THREE.PointLight(0xffb47d, 2.2, 24);
    this.coreLight.position.set(0, 0, 0);
    this.scene.add(this.coreLight);
  }

  _initScrollCurves() {
    const mobileScale = this._isMobileViewport() ? 1.2 : 1.0;

    // Trayectoria inmersiva: al hacer scroll con el mouse la cámara se acerca y atraviesa las estrellas
    this.camPosCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.8 * mobileScale, 5.4 * mobileScale, 15.2 * mobileScale),
        new THREE.Vector3(-2.0 * mobileScale, 2.9 * mobileScale, 9.4 * mobileScale),
        new THREE.Vector3(-1.0 * mobileScale, 1.15 * mobileScale, 4.6 * mobileScale),
        new THREE.Vector3(0.85 * mobileScale, 0.42 * mobileScale, 1.85 * mobileScale),
        new THREE.Vector3(0.1 * mobileScale, 0.12 * mobileScale, 0.32 * mobileScale),
      ],
      false,
      'catmullrom',
      0.5
    );

    this.camTargetCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.0, -0.1, 0.0),
        new THREE.Vector3(0.2, -0.12, -1.0),
        new THREE.Vector3(0.0, -0.08, -2.4),
        new THREE.Vector3(-0.12, 0.0, -4.0),
        new THREE.Vector3(0.0, 0.0, -6.2),
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
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.95;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 32.0;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.45;
    this.controls.enabled = false;
  }

  _createStarShaderMaterial(sizeMultiplier = 1.0) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uViewportScale: { value: this._getViewportScale() },
        uPixelRatio: { value: this.pixelRatio },
        uTime: { value: 0 },
        uSizeMultiplier: { value: sizeMultiplier },
      },
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.galaxyShaderMaterials.push(mat);
    return mat;
  }

  _initAmbientStarfield() {
    const rand = createSeededRandom(424242);
    const count = 1100;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const phases = new Float32Array(count);
    const spikes = new Float32Array(count);

    const palette = [
      new THREE.Color(0xe6eefc),
      new THREE.Color(0xbfdbfe),
      new THREE.Color(0xfed7aa),
      new THREE.Color(0xc7d2fe),
    ];

    for (let i = 0; i < count; i++) {
      const r = 26 + rand() * 38;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(rand() * palette.length)];
      const intensity = 0.5 + rand() * 0.5;
      colors[i * 3] = c.r * intensity;
      colors[i * 3 + 1] = c.g * intensity;
      colors[i * 3 + 2] = c.b * intensity;

      const mag = rand();
      sizes[i] = mag > 0.94 ? 0.26 + rand() * 0.12 : 0.11 + rand() * 0.1;
      alphas[i] = mag > 0.94 ? 0.65 : 0.28 + rand() * 0.34;
      phases[i] = rand();
      spikes[i] = mag > 0.97 ? 0.5 : 0.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpike', new THREE.BufferAttribute(spikes, 1));

    const mat = this._createStarShaderMaterial(1.0);
    this.ambientStars = new THREE.Points(geo, mat);
    this.scene.add(this.ambientStars);
  }

  _disposeObject3D(root) {
    if (!root) return;
    root.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      }
    });
  }

  _buildGalaxyStarfield(gltfScene) {
    gltfScene.updateMatrixWorld(true);

    // 1. Consolidar los puntos de stars.glb (160,000 estrellas en 3 primitivas) en un solo draw call HD
    const rawPositions = [];
    const rawColors = [];
    const tmpPos = new THREE.Vector3();

    const box = new THREE.Box3().setFromObject(gltfScene);
    const boxSize = box.getSize(new THREE.Vector3());
    const boxCenter = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z) || 1;
    const scaleFactor = 21.0 / maxDim;
    const maxRadius = 10.5;

    gltfScene.traverse((child) => {
      if (!child.isPoints || !child.geometry?.attributes?.position) return;

      const posAttr = child.geometry.attributes.position;
      const colAttr = child.geometry.attributes.color;
      const worldMat = child.matrixWorld;

      for (let i = 0; i < posAttr.count; i++) {
        tmpPos.fromBufferAttribute(posAttr, i).applyMatrix4(worldMat);
        rawPositions.push(
          (tmpPos.x - boxCenter.x) * scaleFactor,
          (tmpPos.y - boxCenter.y) * scaleFactor,
          (tmpPos.z - boxCenter.z) * scaleFactor
        );

        if (colAttr) {
          rawColors.push(colAttr.getX(i), colAttr.getY(i), colAttr.getZ(i));
        } else {
          rawColors.push(0.84, 0.88, 1.0);
        }
      }
    });

    const totalStars = rawPositions.length / 3;
    if (totalStars === 0) return 0;

    const rand = createSeededRandom(19970524);
    const positions = new Float32Array(rawPositions);
    const colors = new Float32Array(totalStars * 3);
    const sizes = new Float32Array(totalStars);
    const alphas = new Float32Array(totalStars);
    const phases = new Float32Array(totalStars);
    const spikes = new Float32Array(totalStars);

    for (let i = 0; i < totalStars; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      const rNorm = Math.min(1.15, Math.hypot(px, py, pz) / maxRadius);

      const [cr, cg, cb] = gradeMilkyWayColor(
        rawColors[i * 3],
        rawColors[i * 3 + 1],
        rawColors[i * 3 + 2],
        rNorm
      );

      colors[i * 3] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;

      // Balance suave en el núcleo para conservar definición estelar al acercarse
      const coreDamp = THREE.MathUtils.lerp(
        0.58,
        1.0,
        THREE.MathUtils.smoothstep(rNorm, 0.02, 0.26)
      );

      const mag = rand();
      let starSize;
      let starAlpha;
      let starSpike = 0.0;

      if (mag > 0.965) {
        starSize = 0.145 + rand() * 0.07;
        starAlpha = (0.68 + rand() * 0.22) * coreDamp;
        starSpike = 0.45 + rand() * 0.35;
      } else if (mag > 0.74) {
        starSize = 0.082 + rand() * 0.04;
        starAlpha = (0.5 + rand() * 0.22) * coreDamp;
      } else {
        starSize = 0.048 + rand() * 0.028;
        starAlpha = (0.34 + rand() * 0.22) * coreDamp;
      }

      sizes[i] = starSize;
      alphas[i] = starAlpha;
      phases[i] = rand();
      spikes[i] = starSpike;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    starGeo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    starGeo.setAttribute('aSpike', new THREE.BufferAttribute(spikes, 1));
    starGeo.computeBoundingSphere();

    const isMobile = this._isMobileViewport();
    this.galaxyStarMaterial = this._createStarShaderMaterial(isMobile ? 1.15 : 1.0);
    this.galaxyStarPoints = new THREE.Points(starGeo, this.galaxyStarMaterial);
    this.galaxyStarPoints.frustumCulled = false;
    this.galaxySpinGroup.add(this.galaxyStarPoints);

    // Halo central cálido que se atenúa al sumergirse entre las estrellas
    this.coreHaloTexture = this._createCoreHaloTexture();
    const haloMat = new THREE.SpriteMaterial({
      map: this.coreHaloTexture,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.coreHalo = new THREE.Sprite(haloMat);
    this.coreHalo.scale.set(5.0, 3.3, 1);
    this.galaxySpinGroup.add(this.coreHalo);

    return totalStars;
  }

  _loadGalaxyModel() {
    const loader = new GLTFLoader();

    loader.load(
      GALAXY_MODEL_URL,
      (gltf) => {
        if (this._disposed) {
          this._disposeObject3D(gltf.scene);
          return;
        }

        const totalStars = this._buildGalaxyStarfield(gltf.scene);
        this._disposeObject3D(gltf.scene);

        this.stats.stars = totalStars || 160000;
        this._emitTelemetry();

        if (this.onLoadProgress) {
          this.onLoadProgress(100, 'GALAXIA 3D LISTA');
        }
        this._hideTimer = setTimeout(() => {
          if (!this._disposed && this.onLoadComplete) {
            this.onLoadComplete();
          }
        }, 260);
      },
      (xhr) => {
        if (this._disposed) return;
        if (xhr.lengthComputable && this.onLoadProgress) {
          const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          this.onLoadProgress(pct, `CARGANDO GALAXIA 3D (${pct}%)`);
        }
      },
      (error) => {
        if (this._disposed) return;
        console.error(`Error cargando ${GALAXY_MODEL_URL}:`, error);
        if (this.onLoadComplete) {
          this.onLoadComplete();
        }
      }
    );
  }

  _loadDevLogos() {
    const loader = new GLTFLoader();

    const defaultOrbitalSlots = [
      { angle: 0.25, radius: 6.4, y: 1.8, size: 1.05 },
      { angle: 0.88, radius: 7.2, y: -1.1, size: 0.98 },
      { angle: 1.52, radius: 6.1, y: 2.3, size: 0.96 },
      { angle: 2.15, radius: 7.0, y: -0.6, size: 1.08 },
      { angle: 2.78, radius: 6.3, y: 1.5, size: 1.0 },
      { angle: 3.42, radius: 7.3, y: -1.5, size: 1.04 },
      { angle: 4.05, radius: 6.0, y: 2.0, size: 0.95 },
      { angle: 4.68, radius: 7.1, y: -0.9, size: 1.05 },
      { angle: 5.3, radius: 6.5, y: 1.3, size: 1.06 },
      { angle: 5.92, radius: 7.0, y: -1.4, size: 1.02 },
    ];

    this.logosManifest.forEach((entry, idx) => {
      const slot =
        entry.orbitalSlot ||
        defaultOrbitalSlots[idx] || {
          angle: (idx / this.logosManifest.length) * Math.PI * 2,
          radius: 6.6,
          y: idx % 2 === 0 ? 1.6 : -1.2,
          size: 1.0,
        };

      const filePath = entry.file.startsWith('./') ? entry.file.slice(1) : entry.file;

      loader.load(
        filePath,
        (gltf) => {
          if (this._disposed) {
            this._disposeObject3D(gltf.scene);
            return;
          }

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
            targetEmissive: 0.22,
          });

          this.stats.logosLoaded = this.logoItems.length;

          if (this.activeDomain) {
            this.setHighlightDomain(this.activeDomain);
          }
        },
        undefined,
        (err) => {
          if (!this._disposed) {
            console.warn(`No se pudo cargar ${filePath}:`, err);
          }
        }
      );
    });
  }

  setHighlightDomain(domain) {
    this.activeDomain = domain || null;
    const baseScale = this._isMobileViewport() ? 0.82 : 1.0;

    this.logoItems.forEach((item) => {
      const isMatch =
        !this.activeDomain ||
        item.domain === this.activeDomain ||
        (this.activeDomain === 'ai' &&
          (item.id === 'python' || item.id === 'nodejs' || item.id === 'docker'));

      if (!this.activeDomain) {
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
    this.interactiveOrbit = Boolean(enabled);
    if (this.controls) {
      this.controls.enabled = this.interactiveOrbit;
      if (this.interactiveOrbit) {
        this.controls.target.copy(this._currentLookAt);
        this.controls.update();
      }
    }
    if (this.canvas) {
      this.canvas.style.pointerEvents = this.interactiveOrbit ? 'auto' : 'none';
      this.canvas.style.touchAction = this.interactiveOrbit ? 'none' : 'auto';
    }
    return this.interactiveOrbit;
  }

  handleViewportChange() {
    if (this._disposed) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const isMobile = this._isMobileViewport();
    this.pixelRatio = this._getTargetPixelRatio(isMobile);

    this.camera.fov = isMobile ? 54 : 46;
    this.camera.aspect = this.width / Math.max(1, this.height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(this.pixelRatio);

    this._initScrollCurves();

    const viewportScale = this._getViewportScale();
    this.galaxyShaderMaterials.forEach((mat) => {
      mat.uniforms.uViewportScale.value = viewportScale;
      mat.uniforms.uPixelRatio.value = this.pixelRatio;
    });

    this.setHighlightDomain(this.activeDomain);
  }

  _emitTelemetry() {
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        stars: this.stats.stars,
        fps: this.stats.fps,
      });
    }
  }

  _updateScrollProgress() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.scrollProgress = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));
  }

  _bindEvents() {
    this._updateScrollProgress();

    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: true });
    window.addEventListener('resize', this._onResize);
  }

  _animate() {
    const tick = (now) => {
      if (this._disposed) return;
      this._rafId = requestAnimationFrame(tick);

      const dt = Math.min(0.05, (now - this.lastFrameTime) * 0.001);
      this.lastFrameTime = now;
      const t = (now - this.startTime) * 0.001;

      this._frameCount++;
      if (now - this._lastFpsUpdate >= 700) {
        this.stats.fps = Math.min(
          144,
          Math.round((this._frameCount * 1000) / (now - this._lastFpsUpdate))
        );
        this._frameCount = 0;
        this._lastFpsUpdate = now;
        this._emitTelemetry();
      }

      this.mouseX += (this.targetMouseX - this.mouseX) * 0.045;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.045;
      this.smoothScroll += (this.scrollProgress - this.smoothScroll) * 0.085;

      const isMobile = this._isMobileViewport();
      const expandProgress = Math.pow(this.smoothScroll, 1.06);

      // Expansión inmersiva de la galaxia al hacer scroll para sumergirse entre las estrellas
      if (this.galaxySpinGroup) {
        this.galaxySpinGroup.rotation.y += dt * (0.036 + this.smoothScroll * 0.055);
        const galaxyScale = 1.0 + expandProgress * 1.65;
        this.galaxySpinGroup.scale.setScalar(galaxyScale);
      }

      if (this.galaxyTiltGroup) {
        this.galaxyTiltGroup.rotation.x =
          0.3 * (1 - this.smoothScroll * 0.65) + this.mouseY * 0.04;
        this.galaxyTiltGroup.rotation.z =
          -0.15 * (1 - this.smoothScroll * 0.58) + this.mouseX * 0.03;
      }

      // Actualizar tiempo y presencia estelar progresiva al acercarse
      for (let i = 0; i < this.galaxyShaderMaterials.length; i++) {
        this.galaxyShaderMaterials[i].uniforms.uTime.value = t;
      }
      if (this.galaxyStarMaterial) {
        const baseMult = isMobile ? 1.15 : 1.0;
        this.galaxyStarMaterial.uniforms.uSizeMultiplier.value =
          baseMult * (1.0 + this.smoothScroll * 0.42);
      }

      if (this.coreHalo && this.coreHalo.material) {
        this.coreHalo.material.opacity = 0.24 * (1 - this.smoothScroll * 0.72);
      }

      if (this.ambientStars) {
        this.ambientStars.rotation.y = t * 0.006;
        this.ambientStars.scale.setScalar(1.0 + this.smoothScroll * 0.45);
        this.ambientStars.position.z = this.smoothScroll * 4.2;
      }

      const logoRingExpand = 1.0 + expandProgress * 0.55;
      if (this.logosGroup) {
        this.logosGroup.rotation.y = t * 0.05 + this.smoothScroll * Math.PI * 0.9;
        this.logosGroup.position.z = -this.smoothScroll * 4.4;
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

        h.rotation.y = t * (0.28 + item.speed * 0.22) + item.phase;
        h.rotation.x = Math.sin(t * item.speed * 0.5 + item.phase) * 0.2;

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

      if (this.interactiveOrbit && this.controls) {
        this.controls.update();
      } else {
        this.camPosCurve.getPointAt(this.smoothScroll, this._tmpCamPos);
        this.camTargetCurve.getPointAt(this.smoothScroll, this._tmpCamTarget);

        const parallaxScale = 1 - this.smoothScroll * 0.4;
        this._tmpCamPos.x += this.mouseX * 0.65 * parallaxScale;
        this._tmpCamPos.y += this.mouseY * 0.45 * parallaxScale;

        this.camera.position.lerp(this._tmpCamPos, 0.095);
        this._currentLookAt.lerp(this._tmpCamTarget, 0.095);
        this.camera.lookAt(this._currentLookAt);

        const baseFov = isMobile ? 54 : 46;
        const targetFov = baseFov + this.smoothScroll * 12;
        if (Math.abs(this.camera.fov - targetFov) > 0.02) {
          this.camera.fov += (targetFov - this.camera.fov) * 0.09;
          this.camera.updateProjectionMatrix();
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  destroy() {
    this._disposed = true;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }

    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('resize', this._onResize);

    if (this.controls) {
      this.controls.dispose();
    }
    if (this.scene) {
      this._disposeObject3D(this.scene);
    }
    if (this.coreHaloTexture) {
      this.coreHaloTexture.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

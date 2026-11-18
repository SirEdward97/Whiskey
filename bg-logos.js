/**
 * ==========================================================================
 * BACKGROUND 3D LOGOS CONSTELLATION — `./dev/*.glb`
 * Renderiza en el fondo de la página los 10 modelos 3D (.glb) organizados
 * en la carpeta `./dev/`, representando el ecosistema técnico de
 * Edwar Granados (@SirEdward97).
 * ==========================================================================
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const DEV_LOGOS_MANIFEST = [
  {
    id: 'threejs',
    name: 'Three.js',
    domain: 'frontend',
    file: './dev/three-js-logo.glb',
    baseX: -5.4,
    baseY: 2.9,
    baseZ: -0.6,
    size: 1.55,
    speed: 0.55,
    phase: 0.2
  },
  {
    id: 'html',
    name: 'HTML5',
    domain: 'frontend',
    file: './dev/html-logo.glb',
    baseX: 5.6,
    baseY: 3.1,
    baseZ: -1.1,
    size: 1.45,
    speed: 0.48,
    phase: 1.1
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    domain: 'frontend',
    file: './dev/js-logo.glb',
    baseX: -6.1,
    baseY: 0.3,
    baseZ: -0.4,
    size: 1.4,
    speed: 0.62,
    phase: 2.0
  },
  {
    id: 'python',
    name: 'Python',
    domain: 'backend',
    file: './dev/python-logo.glb',
    baseX: 5.8,
    baseY: 0.4,
    baseZ: -0.3,
    size: 1.55,
    speed: 0.52,
    phase: 2.8
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    domain: 'frontend',
    file: './dev/tailwindcss-logo.glb',
    baseX: -4.8,
    baseY: -2.2,
    baseZ: -0.9,
    size: 1.45,
    speed: 0.5,
    phase: 3.5
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    domain: 'backend',
    file: './dev/node-js-logo.glb',
    baseX: 5.1,
    baseY: -2.1,
    baseZ: -0.7,
    size: 1.5,
    speed: 0.58,
    phase: 4.1
  },
  {
    id: 'css',
    name: 'CSS3',
    domain: 'frontend',
    file: './dev/css-logo.glb',
    baseX: -5.7,
    baseY: -4.8,
    baseZ: -1.0,
    size: 1.4,
    speed: 0.46,
    phase: 4.9
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    domain: 'data',
    file: './dev/mongodb-logo.glb',
    baseX: 5.7,
    baseY: -4.7,
    baseZ: -0.5,
    size: 1.5,
    speed: 0.54,
    phase: 5.4
  },
  {
    id: 'docker',
    name: 'Docker',
    domain: 'data',
    file: './dev/docker-logo.glb',
    baseX: -4.9,
    baseY: -7.3,
    baseZ: -0.6,
    size: 1.55,
    speed: 0.49,
    phase: 0.8
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    domain: 'data',
    file: './dev/kubernetes-logo.glb',
    baseX: 5.2,
    baseY: -7.4,
    baseZ: -0.8,
    size: 1.5,
    speed: 0.44,
    phase: 1.7
  }
];

export class BackgroundLogos3D {
  constructor(canvasId = 'bg-logos-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.logoItems = [];
    this.activeDomain = null; // null | 'frontend' | 'backend' | 'data' | 'ai'
    this.scrollY = window.scrollY || 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.startTime = performance.now();

    this._initScene();
    this._initLights();
    this._loadAllLogos();
    this._bindEvents();
    this._animate();
  }

  _initScene() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.1, 60);
    this.camera.position.set(0, 0, 10.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.constellationGroup = new THREE.Group();
    this.scene.add(this.constellationGroup);
  }

  _initLights() {
    // Iluminación arquitectónica de estudio calibrada para resaltar los biseles 3D sobre el fondo alabastro
    const ambient = new THREE.HemisphereLight(0xffffff, 0xd6d3c9, 1.75);
    this.scene.add(ambient);

    const dirMain = new THREE.DirectionalLight(0xffffff, 2.2);
    dirMain.position.set(6, 10, 8);
    this.scene.add(dirMain);

    const dirFill = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    dirFill.position.set(-7, -4, 6);
    this.scene.add(dirFill);

    const rimWarm = new THREE.DirectionalLight(0xfed7aa, 1.1);
    rimWarm.position.set(0, 6, -6);
    this.scene.add(rimWarm);
  }

  _loadAllLogos() {
    const loader = new GLTFLoader();

    DEV_LOGOS_MANIFEST.forEach((entry) => {
      loader.load(
        entry.file,
        (gltf) => {
          const rawModel = gltf.scene;

          // 1. Medir bounding box inicial y normalizar tamaño a `entry.size`
          rawModel.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(rawModel);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = entry.size / maxDim;
          rawModel.scale.multiplyScalar(scale);

          // 2. Centrar el pivote geométrico exactamente en (0, 0, 0)
          rawModel.updateMatrixWorld(true);
          const scaledBox = new THREE.Box3().setFromObject(rawModel);
          const center = scaledBox.getCenter(new THREE.Vector3());
          rawModel.position.sub(center);

          // 3. Refinar materiales PBR para que tengan presencia arquitectónica sutil en el fondo
          rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material.clone();
              // Si es el logo de Three.js (negro puro), darle acabado grafito metálico para que se distingan sus aristas 3D
              if (entry.id === 'threejs') {
                mat.color.setHex(0x272a30);
                mat.metalness = 0.45;
                mat.roughness = 0.28;
              } else {
                mat.metalness = Math.max(mat.metalness || 0, 0.15);
                mat.roughness = Math.min(mat.roughness || 0.4, 0.35);
              }
              mat.transparent = true;
              mat.opacity = 0.24; // Opacidad sutil de fondo para no competir con la lectura editorial (ill.md l.21)
              child.material = mat;
            }
          });

          const holder = new THREE.Group();
          holder.position.set(entry.baseX, entry.baseY, entry.baseZ);
          holder.add(rawModel);

          this.constellationGroup.add(holder);
          this.logoItems.push({
            ...entry,
            holder,
            rawModel,
            currentScale: 1.0,
            targetScale: 1.0,
            currentOpacity: 0.24,
            targetOpacity: 0.24
          });
        },
        undefined,
        (err) => {
          console.warn(`No se pudo cargar ${entry.file}:`, err);
        }
      );
    });
  }

  /**
   * Destaca los logos 3D del fondo que pertenecen a una especialidad cuando el usuario
   * explora las filas de capacidades ('frontend' | 'backend' | 'data' | 'ai' | null)
   */
  setHighlightDomain(domain) {
    this.activeDomain = domain;
    this.logoItems.forEach((item) => {
      if (!domain) {
        item.targetScale = 1.0;
        item.targetOpacity = 0.24;
      } else if (
        item.domain === domain ||
        (domain === 'ai' && (item.id === 'python' || item.id === 'nodejs' || item.id === 'docker'))
      ) {
        item.targetScale = 1.32;
        item.targetOpacity = 0.62;
      } else {
        item.targetScale = 0.82;
        item.targetOpacity = 0.1;
      }
    });
  }

  _bindEvents() {
    window.addEventListener(
      'scroll',
      () => {
        this.scrollY = window.scrollY || 0;
      },
      { passive: true }
    );

    window.addEventListener(
      'mousemove',
      (e) => {
        this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height, false);
    });
  }

  _animate() {
    const tick = (now) => {
      const t = (now - this.startTime) * 0.001;

      // Suavizado de paralaje con el cursor
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      // Desplazamiento vertical suave vinculado al scroll para recorrer la constelación de 10 logos
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollNorm = Math.min(1, Math.max(0, this.scrollY / maxScroll));
      const targetGroupY = scrollNorm * 7.6;
      this.constellationGroup.position.y += (targetGroupY - this.constellationGroup.position.y) * 0.08;

      // Sutil inclinación espacial del grupo según el mouse
      this.constellationGroup.rotation.y = this.mouseX * 0.12;
      this.constellationGroup.rotation.x = this.mouseY * 0.08;

      // Adaptar separación horizontal en pantallas más estrechas
      const xSpread = this.width < 900 ? 0.62 : 1.0;

      for (let i = 0; i < this.logoItems.length; i++) {
        const item = this.logoItems[i];
        const h = item.holder;

        // Flotación sinusoidal meditativa y rotación 3D suave
        const floatY = Math.sin(t * item.speed + item.phase) * 0.24;
        const floatX = Math.cos(t * (item.speed * 0.7) + item.phase) * 0.14;
        h.position.x = item.baseX * xSpread + floatX;
        h.position.y = item.baseY + floatY;

        h.rotation.y = Math.sin(t * item.speed * 0.85 + item.phase) * 0.48 + t * 0.18;
        h.rotation.x = Math.cos(t * item.speed * 0.6 + item.phase) * 0.22;
        h.rotation.z = Math.sin(t * item.speed * 0.45 + item.phase) * 0.1;

        // Interpolación suave de escala y opacidad al destacar especialidades
        item.currentScale += (item.targetScale - item.currentScale) * 0.08;
        h.scale.setScalar(item.currentScale);

        if (Math.abs(item.currentOpacity - item.targetOpacity) > 0.002) {
          item.currentOpacity += (item.targetOpacity - item.currentOpacity) * 0.08;
          item.rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.opacity = item.currentOpacity;
            }
          });
        }
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

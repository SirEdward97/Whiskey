/**
 * ==========================================================================
 * UNIFIED FULL-PAGE 3D BACKGROUND ENGINE — `scene3d.js`
 * Renderiza en el fondo completo de la página:
 * 1. La estructura principal: Japanese Temple (`./scene.gltf` + `scene.bin` + PBR textures)
 * 2. La constelación de 10 logos 3D de conocimientos (`./dev/*.glb`) orbitando en profundidad
 * Iluminación calibrada según `hi.md` ("Brutalist type foundry at dusk" — Ember Orange #ff6436)
 * ==========================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DEV_LOGOS_MANIFEST } from './bg-logos.js';

export class TempleScene3D {
  constructor(canvasId = 'temple-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.meshes = [];
    this.originalMaterials = new Map();
    this.wireframeOverlays = [];
    this.logoItems = [];
    this.renderMode = 'pbr'; // 'pbr' | 'wireframe' | 'clay'
    this.autoRotate = true;
    this.nightLighting = false;
    this.interactiveOrbit = false;

    this.scrollY = window.scrollY || 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.startTime = performance.now();

    // Telemetría
    this.stats = {
      vertices: 0,
      triangles: 0,
      fps: 60
    };
    this._frameCount = 0;
    this._lastFpsUpdate = performance.now();
    this.cameraTransition = null;

    this._initScene();
    this._initLights();
    this._initPedestal();
    this._initControls();
    this._loadGLTFModel();
    this._loadDevLogos();
    this._bindEvents();
    this._animate();
  }

  _initScene() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.set(4.1, 1.35, 5.1);

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
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Grupo para la estructura Japanese Temple
    this.pivotGroup = new THREE.Group();
    this.scene.add(this.pivotGroup);

    // Grupo para la constelación de 10 logos 3D (.glb) en el fondo alrededor del templo
    this.logosGroup = new THREE.Group();
    this.scene.add(this.logosGroup);
  }

  _initLights() {
    // 1. Luz hemisférica de crepúsculo (dusk — hi.md)
    this.hemiLight = new THREE.HemisphereLight(0xf1f1f1, 0x161616, 1.35);
    this.hemiLight.position.set(0, 12, 0);
    this.scene.add(this.hemiLight);

    // 2. Luz principal direccional cálida para resaltar madera bermellón, oro y biseles 3D
    this.keyLight = new THREE.DirectionalLight(0xfff4e8, 2.8);
    this.keyLight.position.set(6.0, 8.0, 5.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 24;
    const d = 4.0;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // 3. Luz de contra (Rim Light) en Ember Orange (#ff6436 — token principal de hi.md)
    this.rimLight = new THREE.DirectionalLight(0xff6436, 2.5);
    this.rimLight.position.set(-5.5, 3.5, -4.5);
    this.scene.add(this.rimLight);

    // 4. Luz interior del pórtico
    this.lanternLight = new THREE.PointLight(0xff7b47, 2.1, 8.0);
    this.lanternLight.position.set(0, -0.05, 1.35);
    this.scene.add(this.lanternLight);
  }

  _initPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -1.85;

    const discGeo = new THREE.CylinderGeometry(2.25, 2.45, 0.06, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x161616,
      roughness: 0.4,
      metalness: 0.6
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.receiveShadow = true;
    pedestalGroup.add(discMesh);

    const ringGeo = new THREE.RingGeometry(2.24, 2.27, 64);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6436,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    ringMesh.position.y = 0.035;
    pedestalGroup.add(ringMesh);

    this.pivotGroup.add(pedestalGroup);
    this.pedestalGroup = pedestalGroup;
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.75;
    this.controls.zoomSpeed = 0.9;
    this.controls.minDistance = 2.1;
    this.controls.maxDistance = 10.5;
    this.controls.maxPolarAngle = Math.PI * 0.53;
    this.controls.target.set(0, 0.15, 0);
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.enabled = false; // Se activa al pulsar "ORBITAR 3D EN VIVO" para no bloquear el scroll de página
  }

  setInteractiveOrbit(enabled) {
    this.interactiveOrbit = enabled;
    if (this.controls) {
      this.controls.enabled = enabled;
    }
    this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    return this.interactiveOrbit;
  }

  _loadGLTFModel() {
    const loader = new GLTFLoader();
    const progressBar = document.getElementById('loader-progress-bar');
    const loaderText = document.getElementById('loader-text');
    const loaderOverlay = document.getElementById('stage-loader');

    loader.load(
      './scene.gltf',
      (gltf) => {
        const model = gltf.scene;

        model.updateMatrixWorld(true);
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;

        const targetDimension = 3.75;
        const scaleFactor = targetDimension / maxDim;
        model.scale.multiplyScalar(scaleFactor);

        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

        model.position.x -= scaledCenter.x;
        model.position.z -= scaledCenter.z;
        model.position.y -= (scaledBox.min.y - (-1.81));

        const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let totalVertices = 0;
        let totalTriangles = 0;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            this.meshes.push(child);

            const geom = child.geometry;
            if (geom) {
              const posAttr = geom.attributes.position;
              if (posAttr) totalVertices += posAttr.count;
              if (geom.index) {
                totalTriangles += Math.round(geom.index.count / 3);
              } else if (posAttr) {
                totalTriangles += Math.round(posAttr.count / 3);
              }
            }

            if (child.material) {
              const mat = child.material;
              ['map', 'normalMap', 'metalnessMap', 'roughnessMap', 'aoMap'].forEach((mapKey) => {
                if (mat[mapKey]) {
                  mat[mapKey].anisotropy = maxAnisotropy;
                  mat[mapKey].needsUpdate = true;
                }
              });
              mat.envMapIntensity = 1.25;
              mat.needsUpdate = true;
              this.originalMaterials.set(child.uuid, mat.clone());
            }
          }
        });

        this.stats.vertices = totalVertices;
        this.stats.triangles = totalTriangles;
        this._updateTelemetryDOM();

        this.pivotGroup.add(model);
        this.model = model;

        if (progressBar) progressBar.style.width = '100%';
        if (loaderText) loaderText.textContent = 'ESCENA 3D LISTA · 100%';
        setTimeout(() => {
          if (loaderOverlay) loaderOverlay.classList.add('hidden');
        }, 220);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (loaderText) loaderText.textContent = `CARGANDO SCENE.GLTF (${pct}%)`;
        }
      },
      (error) => {
        console.error('Error cargando scene.gltf:', error);
      }
    );
  }

  _loadDevLogos() {
    const loader = new GLTFLoader();

    // Posicionamos los 10 logos .glb de ./dev/ en una órbita arquitectónica alrededor de la estructura japonesa
    const orbitalPositions = [
      { x: -3.4, y: 1.55, z: -0.5, size: 0.72 }, // Three.js
      { x: 3.4, y: 1.65, z: -0.7, size: 0.68 },  // HTML5
      { x: -3.9, y: 0.35, z: 0.3, size: 0.66 },  // JavaScript
      { x: 3.8, y: 0.45, z: 0.2, size: 0.74 },   // Python
      { x: -3.2, y: -0.85, z: -0.4, size: 0.68 },// Tailwind CSS
      { x: 3.3, y: -0.75, z: -0.3, size: 0.70 }, // Node.js
      { x: -2.6, y: 2.15, z: -1.4, size: 0.65 }, // CSS3
      { x: 2.6, y: 2.2, z: -1.3, size: 0.72 },   // MongoDB
      { x: -2.7, y: -1.55, z: 0.6, size: 0.72 }, // Docker
      { x: 2.8, y: -1.5, z: 0.5, size: 0.70 }    // Kubernetes
    ];

    DEV_LOGOS_MANIFEST.forEach((entry, idx) => {
      const pos = orbitalPositions[idx] || { x: 3.0, y: 0, z: -1, size: 0.68 };

      loader.load(
        entry.file,
        (gltf) => {
          const rawModel = gltf.scene;

          rawModel.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(rawModel);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          rawModel.scale.multiplyScalar(pos.size / maxDim);

          rawModel.updateMatrixWorld(true);
          const scaledBox = new THREE.Box3().setFromObject(rawModel);
          const center = scaledBox.getCenter(new THREE.Vector3());
          rawModel.position.sub(center);

          rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material.clone();
              if (entry.id === 'threejs') {
                mat.color.setHex(0xdcd6d6);
                mat.metalness = 0.5;
                mat.roughness = 0.25;
              } else {
                mat.metalness = Math.max(mat.metalness || 0, 0.2);
                mat.roughness = Math.min(mat.roughness || 0.35, 0.3);
              }
              mat.transparent = true;
              mat.opacity = 0.86;
              child.material = mat;
            }
          });

          const holder = new THREE.Group();
          holder.position.set(pos.x, pos.y, pos.z);
          holder.add(rawModel);

          this.logosGroup.add(holder);
          this.logoItems.push({
            ...entry,
            baseX: pos.x,
            baseY: pos.y,
            baseZ: pos.z,
            holder,
            rawModel,
            currentScale: 1.0,
            targetScale: 1.0,
            currentOpacity: 0.86,
            targetOpacity: 0.86
          });
        },
        undefined,
        (err) => {
          console.warn(`No se pudo cargar ${entry.file}:`, err);
        }
      );
    });
  }

  setHighlightDomain(domain) {
    this.logoItems.forEach((item) => {
      if (!domain) {
        item.targetScale = 1.0;
        item.targetOpacity = 0.86;
      } else if (
        item.domain === domain ||
        (domain === 'ai' && (item.id === 'python' || item.id === 'nodejs' || item.id === 'docker'))
      ) {
        item.targetScale = 1.38;
        item.targetOpacity = 1.0;
      } else {
        item.targetScale = 0.72;
        item.targetOpacity = 0.25;
      }
    });
  }

  setRenderMode(mode) {
    this.renderMode = mode;

    this.wireframeOverlays.forEach((ov) => {
      if (ov.parent) ov.parent.remove(ov);
      ov.geometry.dispose();
      ov.material.dispose();
    });
    this.wireframeOverlays = [];

    this.meshes.forEach((mesh) => {
      const origMat = this.originalMaterials.get(mesh.uuid);
      if (!origMat) return;

      if (mode === 'pbr') {
        mesh.material = origMat.clone();
      } else if (mode === 'wireframe') {
        const darkCore = new THREE.MeshStandardMaterial({
          color: 0x161616,
          roughness: 0.7,
          metalness: 0.3,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1
        });
        mesh.material = darkCore;

        const wireMat = new THREE.MeshBasicMaterial({
          color: this.rimLight.color.getHex(),
          wireframe: true,
          transparent: true,
          opacity: 0.45
        });
        const wireMesh = new THREE.Mesh(mesh.geometry, wireMat);
        mesh.add(wireMesh);
        this.wireframeOverlays.push(wireMesh);
      } else if (mode === 'clay') {
        const clayMat = new THREE.MeshStandardMaterial({
          color: 0xdcd6d6,
          roughness: 0.4,
          metalness: 0.15,
          normalMap: origMat.normalMap || null,
          roughnessMap: origMat.roughnessMap || null
        });
        mesh.material = clayMat;
      }
    });
  }

  toggleLightingMood() {
    this.nightLighting = !this.nightLighting;
    if (this.nightLighting) {
      this.hemiLight.intensity = 0.6;
      this.keyLight.intensity = 1.2;
      this.keyLight.color.setHex(0xc9c7cc);
      this.rimLight.intensity = 3.6;
      this.lanternLight.intensity = 3.8;
      this.renderer.toneMappingExposure = 1.1;
    } else {
      this.hemiLight.intensity = 1.35;
      this.keyLight.intensity = 2.8;
      this.keyLight.color.setHex(0xfff4e8);
      this.rimLight.intensity = 2.5;
      this.lanternLight.intensity = 2.1;
      this.renderer.toneMappingExposure = 1.22;
    }
    return this.nightLighting;
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
    if (this.controls) {
      this.controls.autoRotate = enabled;
    }
  }

  syncAccentColor(hexColor) {
    if (this.rimLight) {
      this.rimLight.color.setHex(hexColor);
    }
    if (this.ringMat) {
      this.ringMat.color.setHex(hexColor);
    }
    if (this.renderMode === 'wireframe') {
      this.wireframeOverlays.forEach((ov) => ov.material.color.setHex(hexColor));
    }
  }

  setCameraPreset(presetName) {
    const presets = {
      hero: {
        pos: new THREE.Vector3(4.1, 1.35, 5.1),
        target: new THREE.Vector3(0, 0.15, 0)
      },
      dome: {
        pos: new THREE.Vector3(2.05, 1.8, 2.25),
        target: new THREE.Vector3(0, 0.85, 0)
      },
      portico: {
        pos: new THREE.Vector3(0.2, -0.75, 3.35),
        target: new THREE.Vector3(0, -0.05, 0)
      },
      top: {
        pos: new THREE.Vector3(2.8, 4.5, 2.8),
        target: new THREE.Vector3(0, 0.0, 0)
      }
    };

    const chosen = presets[presetName] || presets.hero;
    this.cameraTransition = {
      startPos: this.camera.position.clone(),
      endPos: chosen.pos,
      startTarget: this.controls.target.clone(),
      endTarget: chosen.target,
      startTime: performance.now(),
      duration: 900
    };
  }

  _updateTelemetryDOM() {
    const vertEl = document.getElementById('telemetry-vertices');
    const triEl = document.getElementById('telemetry-triangles');
    const fpsEl = document.getElementById('telemetry-fps');

    if (vertEl) vertEl.textContent = this.stats.vertices.toLocaleString('es-ES');
    if (triEl) triEl.textContent = this.stats.triangles.toLocaleString('es-ES');
    if (fpsEl) fpsEl.textContent = `${this.stats.fps} FPS`;
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

      this._frameCount++;
      if (now - this._lastFpsUpdate >= 600) {
        this.stats.fps = Math.min(144, Math.round((this._frameCount * 1000) / (now - this._lastFpsUpdate)));
        this._frameCount = 0;
        this._lastFpsUpdate = now;
        const fpsEl = document.getElementById('telemetry-fps');
        if (fpsEl) fpsEl.textContent = `${this.stats.fps} FPS`;
      }

      if (this.cameraTransition) {
        const p = Math.min(1, (now - this.cameraTransition.startTime) / this.cameraTransition.duration);
        const ease = 1 - Math.pow(1 - p, 3);
        this.camera.position.lerpVectors(this.cameraTransition.startPos, this.cameraTransition.endPos, ease);
        this.controls.target.lerpVectors(this.cameraTransition.startTarget, this.cameraTransition.endTarget, ease);
        if (p >= 1) this.cameraTransition = null;
      }

      // Paralaje suave con el cursor y el scroll para la estructura japonesa y los logos 3D
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollNorm = Math.min(1, Math.max(0, this.scrollY / maxScroll));

      if (this.pivotGroup) {
        this.pivotGroup.position.y = Math.sin(t * 1.1) * 0.04 + scrollNorm * 0.35;
        if (!this.interactiveOrbit) {
          this.pivotGroup.rotation.y = this.mouseX * 0.14;
        }
      }

      // Animación orbital individual de los 10 logos 3D (.glb) alrededor de la estructura japonesa
      const xSpread = this.width < 900 ? 0.65 : 1.0;
      for (let i = 0; i < this.logoItems.length; i++) {
        const item = this.logoItems[i];
        const h = item.holder;

        const floatY = Math.sin(t * item.speed + item.phase) * 0.18;
        const floatX = Math.cos(t * (item.speed * 0.7) + item.phase) * 0.12;
        h.position.x = item.baseX * xSpread + floatX + this.mouseX * 0.22;
        h.position.y = item.baseY + floatY + this.mouseY * 0.15;

        h.rotation.y = Math.sin(t * item.speed * 0.8 + item.phase) * 0.45 + t * 0.22;
        h.rotation.x = Math.cos(t * item.speed * 0.6 + item.phase) * 0.18;

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

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

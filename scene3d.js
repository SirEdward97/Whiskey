/**
 * ==========================================================================
 * UNIFIED FULL-PAGE 3D BACKGROUND ENGINE — `scene3d.js`
 * Adaptado para Escritorio y Dispositivos Móviles (Portrait & Landscape):
 * 1. Estructura principal: Japanese Temple (`./scene.gltf` + `scene.bin` + PBR)
 * 2. Constelación de 10 logos 3D (`./dev/*.glb`) con distribución adaptativa
 *    para pantallas verticales móviles y monitores de escritorio.
 * 3. Soporte táctil (Touch Parallax + Touch Orbit / Pinch-to-Zoom).
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
    this.currentPreset = 'hero';

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

  _getViewportDimensions() {
    const parent = this.canvas.parentElement;
    if (document.body.classList.contains('mobile-preview-active') && parent) {
      return {
        width: this.canvas.clientWidth || 390,
        height: this.canvas.clientHeight || 844
      };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  _isMobileViewport() {
    return this.width < 768 || (this.width / Math.max(1, this.height)) < 0.85;
  }

  _initScene() {
    const dims = this._getViewportDimensions();
    this.width = dims.width;
    this.height = dims.height;

    this.scene = new THREE.Scene();

    const isMobile = this._isMobileViewport();
    this.camera = new THREE.PerspectiveCamera(
      isMobile ? 46 : 40,
      this.width / this.height,
      0.1,
      100
    );

    const initialPose = this._getPresetVectors('hero');
    this.camera.position.copy(initialPose.pos);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.65 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Grupo para la estructura Japanese Temple
    this.pivotGroup = new THREE.Group();
    this.scene.add(this.pivotGroup);

    // Grupo para la constelación de 10 logos 3D (.glb)
    this.logosGroup = new THREE.Group();
    this.scene.add(this.logosGroup);
  }

  _initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xf1f1f1, 0x161616, 1.4);
    this.hemiLight.position.set(0, 12, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4e8, 2.85);
    this.keyLight.position.set(6.0, 8.0, 5.5);
    this.keyLight.castShadow = true;
    const shadowRes = this._isMobileViewport() ? 1024 : 2048;
    this.keyLight.shadow.mapSize.width = shadowRes;
    this.keyLight.shadow.mapSize.height = shadowRes;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 24;
    const d = 4.0;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Luz de contra en Ember Orange (#ff6436 — hi.md)
    this.rimLight = new THREE.DirectionalLight(0xff6436, 2.55);
    this.rimLight.position.set(-5.5, 3.5, -4.5);
    this.scene.add(this.rimLight);

    // Luz interior del pórtico
    this.lanternLight = new THREE.PointLight(0xff7b47, 2.15, 8.0);
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
      opacity: 0.68
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
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 12.5;
    this.controls.maxPolarAngle = Math.PI * 0.54;
    const initialPose = this._getPresetVectors('hero');
    this.controls.target.copy(initialPose.target);
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.enabled = false;
  }

  setInteractiveOrbit(enabled) {
    this.interactiveOrbit = enabled;
    if (this.controls) {
      this.controls.enabled = enabled;
    }
    this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    this.canvas.style.touchAction = enabled ? 'none' : 'auto';
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
          if (loaderText) loaderText.textContent = `CARGANDO 3D (${pct}%)`;
        }
      },
      (error) => {
        console.error('Error cargando scene.gltf:', error);
      }
    );
  }

  _loadDevLogos() {
    const loader = new GLTFLoader();

    // Coordenadas duales: Desktop (panorámico) vs Mobile (vertical portrait alrededor del templo)
    const orbitalPositions = [
      { dx: -3.4, dy: 1.55, dz: -0.5, mx: -1.45, my: 1.95, mz: -0.4, size: 0.72 }, // Three.js
      { dx: 3.4,  dy: 1.65, dz: -0.7, mx: 1.45,  my: 2.0,  mz: -0.5, size: 0.68 }, // HTML5
      { dx: -3.9, dy: 0.35, dz: 0.3,  mx: -1.65, my: 0.85, mz: 0.2,  size: 0.66 }, // JavaScript
      { dx: 3.8,  dy: 0.45, dz: 0.2,  mx: 1.65,  my: 0.9,  mz: 0.2,  size: 0.74 }, // Python
      { dx: -3.2, dy: -0.85,dz: -0.4, mx: -1.55, my: -0.25,mz: -0.3, size: 0.68 }, // Tailwind CSS
      { dx: 3.3,  dy: -0.75,dz: -0.3, mx: 1.55,  my: -0.2, mz: -0.3, size: 0.70 }, // Node.js
      { dx: -2.6, dy: 2.15, dz: -1.4, mx: -0.85, my: 2.45, mz: -1.1, size: 0.65 }, // CSS3
      { dx: 2.6,  dy: 2.2,  dz: -1.3, mx: 0.85,  my: 2.45, mz: -1.1, size: 0.72 }, // MongoDB
      { dx: -2.7, dy: -1.55,dz: 0.6,  mx: -1.25, my: -1.35,mz: 0.5,  size: 0.72 }, // Docker
      { dx: 2.8,  dy: -1.5, dz: 0.5,  mx: 1.25,  my: -1.35,mz: 0.5,  size: 0.70 }  // Kubernetes
    ];

    DEV_LOGOS_MANIFEST.forEach((entry, idx) => {
      const pos = orbitalPositions[idx] || {
        dx: 3.0, dy: 0, dz: -1, mx: 1.4, my: 0, mz: -0.5, size: 0.68
      };

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

          const isMobile = this._isMobileViewport();
          const holder = new THREE.Group();
          holder.position.set(
            isMobile ? pos.mx : pos.dx,
            isMobile ? pos.my : pos.dy,
            isMobile ? pos.mz : pos.dz
          );
          holder.add(rawModel);

          this.logosGroup.add(holder);
          this.logoItems.push({
            ...entry,
            desktopPos: { x: pos.dx, y: pos.dy, z: pos.dz },
            mobilePos: { x: pos.mx, y: pos.my, z: pos.mz },
            holder,
            rawModel,
            currentScale: isMobile ? 0.78 : 1.0,
            targetScale: isMobile ? 0.78 : 1.0,
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
    const baseMobileScale = this._isMobileViewport() ? 0.78 : 1.0;
    this.logoItems.forEach((item) => {
      if (!domain) {
        item.targetScale = baseMobileScale;
        item.targetOpacity = 0.86;
      } else if (
        item.domain === domain ||
        (domain === 'ai' && (item.id === 'python' || item.id === 'nodejs' || item.id === 'docker'))
      ) {
        item.targetScale = baseMobileScale * 1.36;
        item.targetOpacity = 1.0;
      } else {
        item.targetScale = baseMobileScale * 0.72;
        item.targetOpacity = 0.24;
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
          opacity: 0.48
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
      this.renderer.toneMappingExposure = 1.12;
    } else {
      this.hemiLight.intensity = 1.4;
      this.keyLight.intensity = 2.85;
      this.keyLight.color.setHex(0xfff4e8);
      this.rimLight.intensity = 2.55;
      this.lanternLight.intensity = 2.15;
      this.renderer.toneMappingExposure = 1.24;
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

  _getPresetVectors(presetName) {
    const isMobile = this._isMobileViewport();
    // En pantallas verticales móviles alejamos ligeramente la cámara y centramos el objetivo
    // para que el Japanese Temple y los logos .glb queden encuadrados en la ventana central de lectura
    const distScale = isMobile ? 1.26 : 1.0;
    const yTargetShift = isMobile ? -0.12 : 0.0;

    const presets = {
      hero: {
        pos: new THREE.Vector3(4.1 * distScale, 1.35 * distScale, 5.1 * distScale),
        target: new THREE.Vector3(0, 0.15 + yTargetShift, 0)
      },
      dome: {
        pos: new THREE.Vector3(2.05 * distScale, 1.8, 2.25 * distScale),
        target: new THREE.Vector3(0, 0.85 + yTargetShift, 0)
      },
      portico: {
        pos: new THREE.Vector3(0.2, -0.7, 3.35 * distScale),
        target: new THREE.Vector3(0, -0.05 + yTargetShift, 0)
      },
      top: {
        pos: new THREE.Vector3(2.8 * distScale, 4.6 * distScale, 2.8 * distScale),
        target: new THREE.Vector3(0, 0.0, 0)
      }
    };

    return presets[presetName] || presets.hero;
  }

  setCameraPreset(presetName) {
    this.currentPreset = presetName || 'hero';
    const chosen = this._getPresetVectors(this.currentPreset);
    this.cameraTransition = {
      startPos: this.camera.position.clone(),
      endPos: chosen.pos,
      startTarget: this.controls.target.clone(),
      endTarget: chosen.target,
      startTime: performance.now(),
      duration: 850
    };
  }

  handleViewportChange() {
    const dims = this._getViewportDimensions();
    this.width = Math.max(280, dims.width);
    this.height = Math.max(320, dims.height);
    const isMobile = this._isMobileViewport();

    this.camera.fov = isMobile ? 46 : 40;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);

    // Reencuadrar suavemente al preset actual para la nueva relación de aspecto
    this.setCameraPreset(this.currentPreset);
    this.setHighlightDomain(null);
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
        this.targetMouseX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        this.targetMouseY = -(e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      },
      { passive: true }
    );

    // Soporte táctil en móviles para paralaje suave mientras se lee la página
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

      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollNorm = Math.min(1, Math.max(0, this.scrollY / maxScroll));

      if (this.pivotGroup) {
        this.pivotGroup.position.y = Math.sin(t * 1.1) * 0.04 + scrollNorm * 0.28;
        if (!this.interactiveOrbit) {
          this.pivotGroup.rotation.y = this.mouseX * 0.14;
        }
      }

      const isMobile = this._isMobileViewport();
      for (let i = 0; i < this.logoItems.length; i++) {
        const item = this.logoItems[i];
        const h = item.holder;
        const anchor = isMobile ? item.mobilePos : item.desktopPos;

        const floatY = Math.sin(t * item.speed + item.phase) * (isMobile ? 0.12 : 0.18);
        const floatX = Math.cos(t * (item.speed * 0.7) + item.phase) * (isMobile ? 0.08 : 0.12);
        h.position.x = anchor.x + floatX + this.mouseX * (isMobile ? 0.12 : 0.22);
        h.position.y = anchor.y + floatY + this.mouseY * (isMobile ? 0.1 : 0.15);
        h.position.z = anchor.z;

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

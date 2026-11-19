/**
 * ==========================================================================
 * JAPANESE TEMPLE INTERACTIVE 3D PROJECT SHOWCASE — `temple-showcase.js`
 * Visor WebGL dedicado e independiente montado dentro del cuadro demostrativo
 * del proyecto "Japanese Shrine" (`#japanese-project-canvas`).
 * - OrbitControls directos sin secuestrar el scroll vertical de la página
 * - Auto-pausa inteligente mediante IntersectionObserver fuera de pantalla
 * - Presets de cámara, modos PBR / Wireframe / Relieve, luz Estudio / Nocturna
 * ==========================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class JapaneseTempleShowcase {
  constructor(canvasId = 'japanese-project-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.container = this.canvas.parentElement;
    this.meshes = [];
    this.originalMaterials = new Map();
    this.wireframeOverlays = [];

    this.renderMode = 'pbr';
    this.autoRotate = true;
    this.nightLighting = false;
    this.currentPreset = 'hero';
    this.isVisible = true;

    this.stats = {
      vertices: 33629,
      triangles: 29696,
      fps: 60
    };
    this._frameCount = 0;
    this._lastFpsUpdate = performance.now();
    this.startTime = performance.now();
    this.cameraTransition = null;

    this._initScene();
    this._initLights();
    this._initPedestal();
    this._initControls();
    this._loadModel();
    this._initObservers();
    this._animate();
  }

  _getContainerSize() {
    const rect = this.container
      ? this.container.getBoundingClientRect()
      : { width: 720, height: 460 };
    return {
      width: Math.max(260, Math.round(rect.width) || 720),
      height: Math.max(260, Math.round(rect.height) || 460)
    };
  }

  _initScene() {
    const { width, height } = this._getContainerSize();
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    const initial = this._getPresetVectors('hero');
    this.camera.position.copy(initial.pos);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.pivotGroup = new THREE.Group();
    this.scene.add(this.pivotGroup);
  }

  _initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xf4f6fb, 0x11131d, 1.45);
    this.hemiLight.position.set(0, 10, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4e8, 2.9);
    this.keyLight.position.set(5.5, 7.8, 5.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 22;
    const d = 3.8;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xff6b3d, 2.5);
    this.rimLight.position.set(-5.2, 3.6, -4.4);
    this.scene.add(this.rimLight);

    this.lanternLight = new THREE.PointLight(0xff804f, 2.1, 7.5);
    this.lanternLight.position.set(0, -0.05, 1.35);
    this.scene.add(this.lanternLight);
  }

  _initPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -1.72;

    const discGeo = new THREE.CylinderGeometry(2.15, 2.35, 0.06, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x121521,
      roughness: 0.42,
      metalness: 0.58
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.receiveShadow = true;
    pedestalGroup.add(discMesh);

    const ringGeo = new THREE.RingGeometry(2.14, 2.175, 64);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6b3d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    ringMesh.position.y = 0.036;
    pedestalGroup.add(ringMesh);

    this.pivotGroup.add(pedestalGroup);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.8;
    // Desactivamos zoom con rueda para nunca bloquear el scroll vertical del portafolio
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 9.5;
    this.controls.maxPolarAngle = Math.PI * 0.54;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.65;

    const initial = this._getPresetVectors('hero');
    this.controls.target.copy(initial.target);
    this.controls.update();
  }

  _loadModel() {
    const loader = new GLTFLoader();
    const loaderEl = document.getElementById('temple-loader');
    const loaderBar = document.getElementById('temple-loader-bar');

    loader.load(
      './scene.gltf',
      (gltf) => {
        const model = gltf.scene;

        model.updateMatrixWorld(true);
        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;

        const targetDim = 3.55;
        model.scale.multiplyScalar(targetDim / maxDim);

        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

        model.position.x -= scaledCenter.x;
        model.position.z -= scaledCenter.z;
        model.position.y -= scaledBox.min.y - -1.68;

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
              ['map', 'normalMap', 'metalnessMap', 'roughnessMap', 'aoMap'].forEach((k) => {
                if (mat[k]) {
                  mat[k].anisotropy = maxAnisotropy;
                  mat[k].needsUpdate = true;
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

        if (loaderBar) loaderBar.style.width = '100%';
        setTimeout(() => {
          if (loaderEl) loaderEl.classList.add('hidden');
        }, 240);
      },
      (xhr) => {
        if (xhr.lengthComputable && loaderBar) {
          const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          loaderBar.style.width = `${pct}%`;
        }
      },
      (error) => {
        console.error('Error cargando Japanese Temple (./scene.gltf):', error);
        if (loaderEl) loaderEl.classList.add('hidden');
      }
    );
  }

  _getPresetVectors(presetName) {
    const isNarrow = this.width < 520;
    const distScale = isNarrow ? 1.18 : 1.0;

    const presets = {
      hero: {
        pos: new THREE.Vector3(3.85 * distScale, 1.35 * distScale, 4.75 * distScale),
        target: new THREE.Vector3(0, 0.1, 0)
      },
      dome: {
        pos: new THREE.Vector3(2.05 * distScale, 1.78, 2.25 * distScale),
        target: new THREE.Vector3(0, 0.8, 0)
      },
      portico: {
        pos: new THREE.Vector3(0.22, -0.58, 3.25 * distScale),
        target: new THREE.Vector3(0, -0.05, 0)
      },
      top: {
        pos: new THREE.Vector3(2.65 * distScale, 4.45 * distScale, 2.65 * distScale),
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
      duration: 780
    };
  }

  zoomStep(direction = 1) {
    // direction: -1 acercar, +1 alejar
    const offset = this.camera.position.clone().sub(this.controls.target);
    const currentDist = offset.length();
    const targetDist = THREE.MathUtils.clamp(
      currentDist * (direction < 0 ? 0.82 : 1.22),
      this.controls.minDistance,
      this.controls.maxDistance
    );
    offset.setLength(targetDist);
    const endPos = this.controls.target.clone().add(offset);

    this.cameraTransition = {
      startPos: this.camera.position.clone(),
      endPos,
      startTarget: this.controls.target.clone(),
      endTarget: this.controls.target.clone(),
      startTime: performance.now(),
      duration: 380
    };
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
    return this.autoRotate;
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
          color: 0x10131e,
          roughness: 0.72,
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
          opacity: 0.52
        });
        const wireMesh = new THREE.Mesh(mesh.geometry, wireMat);
        mesh.add(wireMesh);
        this.wireframeOverlays.push(wireMesh);
      } else if (mode === 'clay') {
        const clayMat = new THREE.MeshStandardMaterial({
          color: 0xd8dce6,
          roughness: 0.42,
          metalness: 0.14,
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
      this.hemiLight.intensity = 0.55;
      this.keyLight.intensity = 1.15;
      this.keyLight.color.setHex(0xb8c4dc);
      this.rimLight.intensity = 3.6;
      this.lanternLight.intensity = 3.9;
      this.renderer.toneMappingExposure = 1.12;
    } else {
      this.hemiLight.intensity = 1.45;
      this.keyLight.intensity = 2.9;
      this.keyLight.color.setHex(0xfff4e8);
      this.rimLight.intensity = 2.5;
      this.lanternLight.intensity = 2.1;
      this.renderer.toneMappingExposure = 1.24;
    }
    return this.nightLighting;
  }

  _updateTelemetryDOM() {
    const vertEl = document.getElementById('temple-vertices');
    const triEl = document.getElementById('temple-triangles');
    const fpsEl = document.getElementById('temple-fps');
    if (vertEl) vertEl.textContent = this.stats.vertices.toLocaleString('es-ES');
    if (triEl) triEl.textContent = this.stats.triangles.toLocaleString('es-ES');
    if (fpsEl) fpsEl.textContent = `${this.stats.fps} FPS`;
  }

  _handleResize() {
    const { width, height } = this._getContainerSize();
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  _initObservers() {
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this._resizeObserver = new ResizeObserver(() => this._handleResize());
      this._resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', () => this._handleResize());
    }

    // Pausar renderizado del visor cuando el cuadro del proyecto no es visible en pantalla
    if (typeof IntersectionObserver !== 'undefined' && this.container) {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
          });
        },
        { rootMargin: '120px 0px' }
      );
      this._intersectionObserver.observe(this.container);
    }
  }

  _animate() {
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!this.isVisible) return;

      const t = (now - this.startTime) * 0.001;

      this._frameCount++;
      if (now - this._lastFpsUpdate >= 700) {
        this.stats.fps = Math.min(
          144,
          Math.round((this._frameCount * 1000) / (now - this._lastFpsUpdate))
        );
        this._frameCount = 0;
        this._lastFpsUpdate = now;
        const fpsEl = document.getElementById('temple-fps');
        if (fpsEl) fpsEl.textContent = `${this.stats.fps} FPS`;
      }

      if (this.cameraTransition) {
        const p = Math.min(
          1,
          (now - this.cameraTransition.startTime) / this.cameraTransition.duration
        );
        const ease = 1 - Math.pow(1 - p, 3);
        this.camera.position.lerpVectors(
          this.cameraTransition.startPos,
          this.cameraTransition.endPos,
          ease
        );
        this.controls.target.lerpVectors(
          this.cameraTransition.startTarget,
          this.cameraTransition.endTarget,
          ease
        );
        if (p >= 1) this.cameraTransition = null;
      }

      if (this.pivotGroup) {
        this.pivotGroup.position.y = Math.sin(t * 1.15) * 0.035;
      }

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(tick);
  }
}

/**
 * ==========================================================================
 * ORACLE RED BULL RACING RB22 3D PROJECT SHOWCASE — `F1CarShowcase.js`
 * Visor WebGL dedicado e independiente montado dentro del cuadro demostrativo
 * del proyecto "Oracle Red Bull Racing RB22" (`#f1-project-canvas`).
 * - Carga el modelo binario 4K `/f1/2026_redbull_rb22.glb` respetando escala real FIA 2026
 * - Plataforma de metrología FIA (5400 x 1900 mm) y estelas de túnel de viento
 * - 6 estaciones calibradas de cámara, aerodinámica activa Modo Z / Modo X,
 *   modos PBR / Wireframe / Relieve, luz Estudio / Nocturna y auto-pausa
 * ==========================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const EXPECTED_GLB_BYTES = 30730112;

const TEXTURE_MAP_KEYS = [
  'map',
  'normalMap',
  'metalnessMap',
  'roughnessMap',
  'aoMap',
  'emissiveMap',
  'clearcoatMap',
  'clearcoatRoughnessMap',
  'clearcoatNormalMap',
  'specularIntensityMap',
  'specularColorMap',
];

export class F1CarShowcase {
  constructor(canvas, options = {}) {
    this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!this.canvas) return;

    this.modelUrl = options.modelUrl || '/f1/2026_redbull_rb22.glb';
    this.onLoadProgress = options.onLoadProgress || null;
    this.onLoadComplete = options.onLoadComplete || null;
    this.onTelemetryUpdate = options.onTelemetryUpdate || null;

    this._disposed = false;
    this._rafId = null;
    this._hideTimer = null;
    this._envRenderTarget = null;
    this._boundWindowResize = () => this._handleResize();

    this.container = this.canvas.parentElement;
    this.meshes = [];
    this.originalMaterials = new Map();
    this.wireframeOverlays = [];
    this.airflowStreams = [];

    this.renderMode = 'pbr';
    this.autoRotate = true;
    this.nightLighting = false;
    this.airflowEnabled = true;
    this.aeroMode = 'Z';
    this.currentPreset = 'general';
    this.isVisible = true;

    this.stats = {
      vertices: options.initialVertices || 219938,
      triangles: options.initialTriangles || 280939,
      fps: 60,
    };
    this._frameCount = 0;
    this._lastFpsUpdate = performance.now();
    this._lastFrameTime = performance.now();
    this.cameraTransition = null;

    this._initScene();
    this._initLights();
    this._initPlatform();
    this._initAirflow();
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
      height: Math.max(260, Math.round(rect.height) || 460),
    };
  }

  _initScene() {
    const { width, height } = this._getContainerSize();
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const initial = this._getPresetVectors('general');
    this.camera.position.copy(initial.pos);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this._envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this._envRenderTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);
  }

  _initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xf4f8ff, 0x10182f, 1.25);
    this.hemiLight.position.set(0, 12, 0);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfffaf2, 2.35);
    this.keyLight.position.set(5.5, 9.5, 6.8);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 26;
    const d = 4.2;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 1.6);
    this.rimLight.position.set(-6.0, 4.2, -5.5);
    this.scene.add(this.rimLight);

    this.accentLight = new THREE.DirectionalLight(0xf3b108, 0.85);
    this.accentLight.position.set(4.6, 2.4, -5.2);
    this.scene.add(this.accentLight);
  }

  _initPlatform() {
    const platformGroup = new THREE.Group();
    // Exactamente al ras inferior de los neumáticos Pirelli del RB22
    platformGroup.position.y = -0.032;

    const discGeo = new THREE.CylinderGeometry(3.48, 3.66, 0.05, 72);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x0b1327,
      roughness: 0.46,
      metalness: 0.52,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.position.set(0, -0.026, 0.2);
    discMesh.receiveShadow = true;
    platformGroup.add(discMesh);

    const grid = new THREE.GridHelper(6.6, 22, 0x3b5998, 0x182b59);
    grid.position.set(0, 0.001, 0.2);
    if (Array.isArray(grid.material)) {
      grid.material.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.34;
      });
    } else if (grid.material) {
      grid.material.transparent = true;
      grid.material.opacity = 0.34;
    }
    platformGroup.add(grid);

    // Rectángulo de huella normativa FIA 2026: 1,92 m de ancho x 5,44 m de longitud
    const widthFIA = 1.92;
    const zFront = 2.96;
    const zRear = -2.48;
    const framePoints = [
      new THREE.Vector3(-widthFIA / 2, 0.004, zRear),
      new THREE.Vector3(widthFIA / 2, 0.004, zRear),
      new THREE.Vector3(widthFIA / 2, 0.004, zFront),
      new THREE.Vector3(-widthFIA / 2, 0.004, zFront),
      new THREE.Vector3(-widthFIA / 2, 0.004, zRear),
    ];
    const frameGeo = new THREE.BufferGeometry().setFromPoints(framePoints);
    const frameMat = new THREE.LineBasicMaterial({
      color: 0xf3b108,
      transparent: true,
      opacity: 0.78,
    });
    platformGroup.add(new THREE.Line(frameGeo, frameMat));

    // Anillo perimetral de plataforma giratoria de metrología
    const ringGeo = new THREE.RingGeometry(3.42, 3.465, 96);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0xf3b108,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.62,
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    ringMesh.position.set(0, 0.003, 0.2);
    platformGroup.add(ringMesh);

    this.stageGroup.add(platformGroup);
  }

  _initAirflow() {
    this.airflowGroup = new THREE.Group();
    this.stageGroup.add(this.airflowGroup);

    const profiles = [
      { x: 0.0, yBase: 0.26, yPeak: 1.24, yExit: 0.88, color: 0xf3b108 },
      { x: -0.28, yBase: 0.24, yPeak: 0.86, yExit: 0.78, color: 0xf2f5fa },
      { x: 0.28, yBase: 0.24, yPeak: 0.86, yExit: 0.78, color: 0xf2f5fa },
      { x: -0.62, yBase: 0.2, yPeak: 0.56, yExit: 0.52, color: 0x60a5fa },
      { x: 0.62, yBase: 0.2, yPeak: 0.56, yExit: 0.52, color: 0x60a5fa },
      { x: -0.88, yBase: 0.32, yPeak: 0.42, yExit: 0.38, color: 0xe31837 },
      { x: 0.88, yBase: 0.32, yPeak: 0.42, yExit: 0.38, color: 0xe31837 },
    ];

    profiles.forEach((p, idx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p.x * 0.75, p.yBase, 3.75),
        new THREE.Vector3(p.x * 0.85, p.yBase + 0.06, 2.5),
        new THREE.Vector3(p.x * 1.05, p.yPeak * 0.82, 0.9),
        new THREE.Vector3(p.x * 0.95, p.yPeak, -0.5),
        new THREE.Vector3(p.x * 0.82, p.yExit, -2.35),
        new THREE.Vector3(p.x * 0.9, p.yExit + 0.22, -3.75),
      ]);

      const basePoints = curve.getPoints(84);
      const baseGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
      const baseMat = new THREE.LineBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.16,
      });
      this.airflowGroup.add(new THREE.Line(baseGeo, baseMat));

      const pulseLength = 18;
      const pulseGeo = new THREE.BufferGeometry();
      const pulsePositions = new Float32Array(pulseLength * 3);
      pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
      const pulseMat = new THREE.LineBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.88,
      });
      const pulseLine = new THREE.Line(pulseGeo, pulseMat);
      this.airflowGroup.add(pulseLine);

      this.airflowStreams.push({
        curve,
        pulseLine,
        pulseLength,
        phase: (idx * 0.17) % 1,
      });
    });

    this.airflowGroup.visible = this.airflowEnabled;
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.8;
    // Desactivamos zoom con rueda para no secuestrar el scroll vertical del portafolio
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.45;
    this.controls.maxDistance = 11.5;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.55;

    this.controls.addEventListener('start', () => {
      this.cameraTransition = null;
    });

    const initial = this._getPresetVectors('general');
    this.controls.target.copy(initial.target);
    this.controls.update();
  }

  _disposeMaterial(mat) {
    if (!mat) return;
    TEXTURE_MAP_KEYS.forEach((k) => {
      if (mat[k]) mat[k].dispose();
    });
    mat.dispose();
  }

  _disposeObject3D(root) {
    if (!root) return;
    root.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => this._disposeMaterial(mat));
      }
    });
  }

  _loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      this.modelUrl,
      (gltf) => {
        if (this._disposed) {
          this._disposeObject3D(gltf.scene);
          return;
        }

        // Conservamos el chasis RB22 en su escala y coordenadas nativas FIA 2026
        const model = gltf.scene;
        const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let totalVertices = 0;
        let totalTriangles = 0;

        model.traverse((child) => {
          if (child.isMesh) {
            const rawMats = child.material
              ? Array.isArray(child.material)
                ? child.material
                : [child.material]
              : [];
            const isTransparentDecal = rawMats.some((m) => m && m.transparent);

            child.castShadow = !isTransparentDecal;
            child.receiveShadow = true;
            child.userData.isTransparentDecal = isTransparentDecal;
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
              const enhanceMat = (mat) => {
                TEXTURE_MAP_KEYS.forEach((k) => {
                  if (mat[k]) {
                    mat[k].anisotropy = maxAnisotropy;
                    mat[k].needsUpdate = true;
                  }
                });
                if (typeof mat.envMapIntensity === 'number') {
                  mat.envMapIntensity = 0.78;
                }
                if (mat.transparent) {
                  mat.polygonOffset = true;
                  mat.polygonOffsetFactor = -1;
                  mat.polygonOffsetUnits = -1;
                }
                mat.needsUpdate = true;
                return mat.clone();
              };

              if (Array.isArray(child.material)) {
                this.originalMaterials.set(
                  child.uuid,
                  child.material.map((m) => enhanceMat(m))
                );
              } else {
                this.originalMaterials.set(child.uuid, enhanceMat(child.material));
              }
            }
          }
        });

        this.stats.vertices = totalVertices || this.stats.vertices;
        this.stats.triangles = totalTriangles || this.stats.triangles;
        this._emitTelemetry();

        this.stageGroup.add(model);
        this.model = model;

        if (this.renderMode !== 'pbr') {
          this.setRenderMode(this.renderMode);
        }

        if (this.onLoadProgress) {
          this.onLoadProgress(100, '100%');
        }
        this._hideTimer = setTimeout(() => {
          if (!this._disposed && this.onLoadComplete) {
            this.onLoadComplete();
          }
        }, 240);
      },
      (xhr) => {
        if (this._disposed || !this.onLoadProgress) return;
        const total = xhr.lengthComputable && xhr.total > 0 ? xhr.total : EXPECTED_GLB_BYTES;
        if (xhr.loaded > 0) {
          const pct = Math.min(99, Math.round((xhr.loaded / total) * 100));
          const mb = (xhr.loaded / (1024 * 1024)).toFixed(1);
          const label = xhr.lengthComputable ? `${pct}%` : `${mb} MB`;
          this.onLoadProgress(pct, label);
        }
      },
      (error) => {
        if (this._disposed) return;
        console.error(`Error cargando Oracle Red Bull RB22 (${this.modelUrl}):`, error);
        if (this.onLoadComplete) {
          this.onLoadComplete();
        }
      }
    );
  }

  _getPresetVectors(presetName) {
    const isNarrow = this.width < 540;
    const distScale = isNarrow ? 1.2 : 1.0;

    // Estaciones calibradas sobre las coordenadas reales del RB22
    const presets = {
      general: {
        pos: new THREE.Vector3(4.55, 1.92, 4.45),
        target: new THREE.Vector3(0, 0.42, 0.18),
      },
      morro: {
        pos: new THREE.Vector3(1.75, 0.78, 4.25),
        target: new THREE.Vector3(0, 0.25, 2.35),
      },
      habitaculo: {
        pos: new THREE.Vector3(1.05, 1.24, 1.55),
        target: new THREE.Vector3(0, 0.62, 0.58),
      },
      pontones: {
        pos: new THREE.Vector3(2.95, 0.98, 0.62),
        target: new THREE.Vector3(0.2, 0.38, 0.15),
      },
      potencia: {
        pos: new THREE.Vector3(2.05, 1.52, -1.15),
        target: new THREE.Vector3(0, 0.82, -0.35),
      },
      zaga: {
        pos: new THREE.Vector3(-2.25, 1.18, -3.95),
        target: new THREE.Vector3(0, 0.55, -1.85),
      },
    };

    const chosen = presets[presetName] || presets.general;
    const offset = chosen.pos.clone().sub(chosen.target).multiplyScalar(distScale);
    return {
      pos: chosen.target.clone().add(offset),
      target: chosen.target.clone(),
    };
  }

  setCameraPreset(presetName) {
    this.currentPreset = presetName || 'general';
    const chosen = this._getPresetVectors(this.currentPreset);
    this.cameraTransition = {
      startPos: this.camera.position.clone(),
      endPos: chosen.pos,
      startTarget: this.controls.target.clone(),
      endTarget: chosen.target,
      startTime: performance.now(),
      duration: 780,
    };
  }

  zoomStep(direction = 1) {
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
      duration: 380,
    };
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
    return this.autoRotate;
  }

  toggleAirflow() {
    this.airflowEnabled = !this.airflowEnabled;
    if (this.airflowGroup) {
      this.airflowGroup.visible = this.airflowEnabled;
    }
    return this.airflowEnabled;
  }

  setAeroMode(mode) {
    this.aeroMode = mode === 'X' ? 'X' : 'Z';
    return this.aeroMode;
  }

  setRenderMode(mode) {
    this.renderMode = mode;

    this.wireframeOverlays.forEach((ov) => {
      if (ov.parent) ov.parent.remove(ov);
      if (ov.material) ov.material.dispose();
    });
    this.wireframeOverlays = [];

    this.meshes.forEach((mesh) => {
      const origMat = this.originalMaterials.get(mesh.uuid);
      if (!origMat) return;

      const currentMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      currentMaterials.forEach((mat) => {
        if (mat && mat !== origMat) {
          mat.dispose();
        }
      });

      if (mode === 'pbr') {
        mesh.visible = true;
        mesh.material = Array.isArray(origMat)
          ? origMat.map((m) => m.clone())
          : origMat.clone();
      } else if (mode === 'wireframe') {
        mesh.visible = !mesh.userData?.isTransparentDecal;
        const darkCore = new THREE.MeshStandardMaterial({
          color: 0x0b1224,
          roughness: 0.7,
          metalness: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });
        mesh.material = darkCore;

        const wireMat = new THREE.MeshBasicMaterial({
          color: 0xf3b108,
          wireframe: true,
          transparent: true,
          opacity: 0.42,
        });
        const wireMesh = new THREE.Mesh(mesh.geometry, wireMat);
        mesh.add(wireMesh);
        this.wireframeOverlays.push(wireMesh);
      } else if (mode === 'clay') {
        mesh.visible = !mesh.userData?.isTransparentDecal;
        const refMat = Array.isArray(origMat) ? origMat[0] : origMat;
        const clayMat = new THREE.MeshStandardMaterial({
          color: 0xd8dfec,
          roughness: 0.4,
          metalness: 0.16,
          normalMap: refMat?.normalMap || null,
          roughnessMap: refMat?.roughnessMap || null,
        });
        mesh.material = clayMat;
      }
    });
  }

  toggleLightingMood() {
    this.nightLighting = !this.nightLighting;
    if (this.nightLighting) {
      this.hemiLight.intensity = 0.55;
      this.ambientLight.intensity = 0.24;
      this.keyLight.intensity = 1.35;
      this.keyLight.color.setHex(0xc7dcff);
      this.rimLight.intensity = 2.9;
      this.rimLight.color.setHex(0x60a5fa);
      this.accentLight.intensity = 2.1;
      this.renderer.toneMappingExposure = 1.1;
    } else {
      this.hemiLight.intensity = 1.25;
      this.ambientLight.intensity = 0.48;
      this.keyLight.intensity = 2.35;
      this.keyLight.color.setHex(0xfffaf2);
      this.rimLight.intensity = 1.6;
      this.rimLight.color.setHex(0x93c5fd);
      this.accentLight.intensity = 0.85;
      this.renderer.toneMappingExposure = 1.15;
    }
    return this.nightLighting;
  }

  _emitTelemetry() {
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        vertices: this.stats.vertices,
        triangles: this.stats.triangles,
        fps: this.stats.fps,
      });
    }
  }

  _handleResize() {
    if (this._disposed) return;
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
      window.addEventListener('resize', this._boundWindowResize);
    }

    if (typeof IntersectionObserver !== 'undefined' && this.container) {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              this._lastFrameTime = performance.now();
            }
          });
        },
        { rootMargin: '120px 0px' }
      );
      this._intersectionObserver.observe(this.container);
    }
  }

  _animate() {
    const tick = (now) => {
      if (this._disposed) return;
      this._rafId = requestAnimationFrame(tick);
      if (!this.isVisible) return;

      const dt = Math.min(0.05, (now - this._lastFrameTime) * 0.001);
      this._lastFrameTime = now;

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

      if (this.airflowEnabled && this.airflowStreams.length > 0) {
  const isModeX = this.aeroMode === 'X';
  const speed = isModeX ? 0.68 : 0.36;
  const safeDt = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.1) : 0;

  for (let s = 0; s < this.airflowStreams.length; s++) {
    const stream = this.airflowStreams[s];
    if (!stream?.curve) continue;

    stream.phase = (stream.phase + safeDt * speed) % 1;
    const posAttr = stream.pulseLine.geometry.attributes.position;

    for (let i = 0; i < stream.pulseLength; i++) {
      const rawU = (stream.phase + i * 0.0085) % 1;
      const u = Math.max(0, Math.min(0.999999, rawU < 0 ? rawU + 1 : rawU));
      const pt = stream.curve.getPointAt(u);

      if (!pt) continue;

      const dropX = isModeX && u > 0.55 ? (u - 0.55) * 0.22 : 0;
      posAttr.setXYZ(i, pt.x, pt.y - dropX, pt.z);
    }

    posAttr.needsUpdate = true;
  }
}
      if (this.controls) {
        this.controls.update();
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

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this._boundWindowResize);
    }
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
    }

    this.wireframeOverlays.forEach((ov) => {
      if (ov.parent) ov.parent.remove(ov);
      if (ov.material) ov.material.dispose();
    });
    this.wireframeOverlays = [];

    this.originalMaterials.forEach((entry) => {
      const mats = Array.isArray(entry) ? entry : [entry];
      mats.forEach((mat) => this._disposeMaterial(mat));
    });
    this.originalMaterials.clear();

    if (this.controls) {
      this.controls.dispose();
    }
    if (this.scene) {
      this.scene.environment = null;
      this._disposeObject3D(this.scene);
    }
    if (this._envRenderTarget) {
      this._envRenderTarget.dispose();
      this._envRenderTarget = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

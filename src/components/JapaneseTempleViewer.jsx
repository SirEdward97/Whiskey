'use client';

import { useEffect, useRef, useState } from 'react';
import { JapaneseTempleShowcase } from '../three/JapaneseTempleShowcase';

const CAMERA_PRESETS = [
  { key: 'hero', label: 'General' },
  { key: 'dome', label: 'Cúpula' },
  { key: 'portico', label: 'Pórtico' },
  { key: 'top', label: 'Cenital' },
];

const RENDER_MODES = [
  { key: 'pbr', label: 'PBR' },
  { key: 'wireframe', label: 'Wireframe' },
  { key: 'clay', label: 'Relieve' },
];

export default function JapaneseTempleViewer({ model3d }) {
  const canvasRef = useRef(null);
  const showcaseRef = useRef(null);

  const [cameraPreset, setCameraPreset] = useState('hero');
  const [renderMode, setRenderMode] = useState('pbr');
  const [isNight, setIsNight] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [telemetry, setTelemetry] = useState({
    vertices: model3d?.initialVertices || 33629,
    triangles: model3d?.initialTriangles || 29696,
    fps: 60,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const showcase = new JapaneseTempleShowcase(canvas, {
      modelUrl: model3d?.modelUrl || '/scene.gltf',
      initialVertices: model3d?.initialVertices || 33629,
      initialTriangles: model3d?.initialTriangles || 29696,
      onLoadProgress: (pct) => setLoadProgress(pct),
      onLoadComplete: () => setLoaderHidden(true),
      onTelemetryUpdate: (stats) => setTelemetry(stats),
    });

    showcaseRef.current = showcase;

    return () => {
      showcase.destroy();
      showcaseRef.current = null;
    };
  }, [model3d?.modelUrl, model3d?.initialVertices, model3d?.initialTriangles]);

  const handlePreset = (presetKey) => {
    setCameraPreset(presetKey);
    showcaseRef.current?.setCameraPreset(presetKey);
  };

  const handleRenderMode = (modeKey) => {
    setRenderMode(modeKey);
    showcaseRef.current?.setRenderMode(modeKey);
  };

  const handleToggleLighting = () => {
    if (!showcaseRef.current) return;
    const nextNight = showcaseRef.current.toggleLightingMood();
    setIsNight(nextNight);
  };

  const handleToggleAutoRotate = () => {
    if (!showcaseRef.current) return;
    const nextActive = showcaseRef.current.toggleAutoRotate();
    setAutoRotate(nextActive);
  };

  const handleZoom = (direction) => {
    showcaseRef.current?.zoomStep(direction);
  };

  return (
    <div className="demo-stage">
      <div className="demo-stage-hud-top">
        <span className="demo-live-badge">
          <span className="ember-dot" />
          DEMO 3D EN VIVO · ARRASTRA PARA ROTAR
        </span>
        <div className="demo-telemetry">
          <span>
            Vértices:{' '}
            <strong id="temple-vertices">{telemetry.vertices.toLocaleString('es-ES')}</strong>
          </span>
          <span>
            Triángulos:{' '}
            <strong id="temple-triangles">{telemetry.triangles.toLocaleString('es-ES')}</strong>
          </span>
          <span>
            <strong id="temple-fps">{telemetry.fps} FPS</strong>
          </span>
        </div>
      </div>

      <div className="demo-stage-viewport">
        <canvas
          id="japanese-project-canvas"
          className="demo-stage-canvas"
          ref={canvasRef}
          aria-label="Visor 3D interactivo del proyecto Japanese Shrine"
        />

        <div className={`demo-loader${loaderHidden ? ' hidden' : ''}`} id="temple-loader">
          <span className="demo-loader-label">Cargando modelo Japanese Temple...</span>
          <div className="demo-loader-track">
            <div
              className="demo-loader-bar"
              id="temple-loader-bar"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="demo-controls-bar">
        <div className="demo-control-group" role="group" aria-label="Ángulos de cámara del templo">
          <span className="demo-group-label">Cámara</span>
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`demo-btn${cameraPreset === preset.key ? ' active' : ''}`}
              data-camera-preset={preset.key}
              onClick={() => handlePreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="demo-control-group" role="group" aria-label="Modo de renderizado del templo">
          <span className="demo-group-label">Shader</span>
          {RENDER_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={`demo-btn${renderMode === mode.key ? ' active' : ''}`}
              data-render-mode={mode.key}
              onClick={() => handleRenderMode(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="demo-control-group" role="group" aria-label="Iluminación y zoom del visor">
          <button
            type="button"
            className={`demo-btn${isNight ? ' active' : ''}`}
            id="btn-toggle-lighting"
            onClick={handleToggleLighting}
          >
            {isNight ? 'Luz Nocturna' : 'Luz Estudio'}
          </button>
          <button
            type="button"
            className={`demo-btn${autoRotate ? ' active' : ''}`}
            id="btn-toggle-autorotate"
            onClick={handleToggleAutoRotate}
            title="Activar o pausar giro automático"
          >
            Giro
          </button>
          <button
            type="button"
            className="demo-btn demo-icon-btn"
            id="btn-temple-zoom-in"
            onClick={() => handleZoom(-1)}
            title="Acercar cámara"
          >
            +
          </button>
          <button
            type="button"
            className="demo-btn demo-icon-btn"
            id="btn-temple-zoom-out"
            onClick={() => handleZoom(1)}
            title="Alejar cámara"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}

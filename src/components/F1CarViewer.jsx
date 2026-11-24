'use client';

import { useEffect, useRef, useState } from 'react';
import { F1CarShowcase } from '../three/F1CarShowcase';

const CAMERA_PRESETS = [
  { key: 'general', label: 'General', readout: 'Vista general · 5400 × 1900 mm' },
  { key: 'morro', label: 'Morro', readout: 'Alerón delantero · Cota +2650 mm' },
  { key: 'habitaculo', label: 'Habitáculo', readout: 'Halo & Volante #3 · Cota +660 mm' },
  { key: 'pontones', label: 'Pontones', readout: 'Suelo Venturi · Cota +150 mm' },
  { key: 'potencia', label: 'Motor', readout: 'Red Bull Ford DM01 · Cota -420 mm' },
  { key: 'zaga', label: 'Zaga', readout: 'Alerón trasero activo · Cota -2300 mm' },
];

const RENDER_MODES = [
  { key: 'pbr', label: 'PBR' },
  { key: 'wireframe', label: 'Wireframe' },
  { key: 'clay', label: 'Relieve' },
];

export default function F1CarViewer({ model3d }) {
  const canvasRef = useRef(null);
  const showcaseRef = useRef(null);

  const [cameraPreset, setCameraPreset] = useState('general');
  const [renderMode, setRenderMode] = useState('pbr');
  const [isNight, setIsNight] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [airflowOn, setAirflowOn] = useState(true);
  const [aeroMode, setAeroMode] = useState('Z');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadLabel, setLoadLabel] = useState('0%');
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [telemetry, setTelemetry] = useState({
    vertices: model3d?.initialVertices || 222638,
    triangles: model3d?.initialTriangles || 281075,
    fps: 60,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const showcase = new F1CarShowcase(canvas, {
      modelUrl: model3d?.modelUrl || '/f1/rb22.glb',
      initialVertices: model3d?.initialVertices || 222638,
      initialTriangles: model3d?.initialTriangles || 281075,
      onLoadProgress: (pct, label) => {
        setLoadProgress(pct);
        if (label) setLoadLabel(label);
      },
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

  const handleToggleAirflow = () => {
    if (!showcaseRef.current) return;
    const nextAirflow = showcaseRef.current.toggleAirflow();
    setAirflowOn(nextAirflow);
  };

  const handleToggleAeroMode = () => {
    if (!showcaseRef.current) return;
    const nextMode = aeroMode === 'Z' ? 'X' : 'Z';
    showcaseRef.current.setAeroMode(nextMode);
    setAeroMode(nextMode);
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

  const activePresetMeta =
    CAMERA_PRESETS.find((preset) => preset.key === cameraPreset) || CAMERA_PRESETS[0];

  return (
    <div className="demo-stage demo-stage-f1">
      <div className="demo-stage-hud-top">
        <span className="demo-live-badge">
          <span className="ember-dot" />
          DEMO 3D EN VIVO · ARRASTRA PARA ROTAR
        </span>
        <div className="demo-telemetry">
          <span>
            Vértices:{' '}
            <strong id="f1-vertices">{telemetry.vertices.toLocaleString('es-ES')}</strong>
          </span>
          <span>
            Triángulos:{' '}
            <strong id="f1-triangles">{telemetry.triangles.toLocaleString('es-ES')}</strong>
          </span>
          <span>
            <strong id="f1-fps">{telemetry.fps} FPS</strong>
          </span>
        </div>
      </div>

      <div className="demo-stage-viewport">
        <canvas
          id="f1-project-canvas"
          className="demo-stage-canvas"
          ref={canvasRef}
          aria-label="Visor 3D interactivo del monoplaza Oracle Red Bull Racing RB22"
        />

        <div className="demo-station-hud" aria-live="polite">
          <span>{activePresetMeta.readout}</span>
          <span className="demo-station-sep">·</span>
          <span>{aeroMode === 'X' ? 'Modo X · 346 km/h' : 'Modo Z · 248 km/h'}</span>
        </div>

        <div className={`demo-loader${loaderHidden ? ' hidden' : ''}`} id="f1-loader">
          <span className="demo-loader-label">
            Cargando chasis Red Bull RB22... ({loadLabel})
          </span>
          <div className="demo-loader-track">
            <div
              className="demo-loader-bar"
              id="f1-loader-bar"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="demo-controls-bar">
        <div className="demo-control-group" role="group" aria-label="Estaciones de cámara del RB22">
          <span className="demo-group-label">Cámara</span>
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`demo-btn${cameraPreset === preset.key ? ' active' : ''}`}
              data-f1-camera-preset={preset.key}
              onClick={() => handlePreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="demo-control-group" role="group" aria-label="Modo de renderizado del RB22">
          <span className="demo-group-label">Shader</span>
          {RENDER_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={`demo-btn${renderMode === mode.key ? ' active' : ''}`}
              data-f1-render-mode={mode.key}
              onClick={() => handleRenderMode(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div
          className="demo-control-group"
          role="group"
          aria-label="Aerodinámica, iluminación y zoom del visor RB22"
        >
          <button
            type="button"
            className={`demo-btn${airflowOn ? ' active' : ''}`}
            id="btn-f1-airflow"
            onClick={handleToggleAirflow}
            title="Activar o desactivar líneas de túnel de viento"
          >
            Flujo
          </button>
          <button
            type="button"
            className={`demo-btn${aeroMode === 'X' ? ' active' : ''}`}
            id="btn-f1-aero-mode"
            onClick={handleToggleAeroMode}
            title="Alternar aerodinámica activa FIA 2026 (Modo Z curva / Modo X recta)"
          >
            {aeroMode === 'X' ? 'Modo X' : 'Modo Z'}
          </button>
          <button
            type="button"
            className={`demo-btn${isNight ? ' active' : ''}`}
            id="btn-f1-lighting"
            onClick={handleToggleLighting}
          >
            {isNight ? 'Luz Nocturna' : 'Luz Estudio'}
          </button>
          <button
            type="button"
            className={`demo-btn${autoRotate ? ' active' : ''}`}
            id="btn-f1-autorotate"
            onClick={handleToggleAutoRotate}
            title="Activar o pausar giro automático"
          >
            Giro
          </button>
          <button
            type="button"
            className="demo-btn demo-icon-btn"
            id="btn-f1-zoom-in"
            onClick={() => handleZoom(-1)}
            title="Acercar cámara"
          >
            +
          </button>
          <button
            type="button"
            className="demo-btn demo-icon-btn"
            id="btn-f1-zoom-out"
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

'use client';

import { useEffect, useRef } from 'react';
import { GalaxyBackground3D } from '../three/GalaxyBackground3D';

export default function GalaxyBackgroundCanvas({
  logosManifest,
  orbitMode,
  highlightDomain,
  onLoadProgress,
  onLoadComplete,
  onTelemetryUpdate,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const callbacksRef = useRef({ onLoadProgress, onLoadComplete, onTelemetryUpdate });

  callbacksRef.current = { onLoadProgress, onLoadComplete, onTelemetryUpdate };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const engine = new GalaxyBackground3D(canvas, {
      logosManifest,
      onLoadProgress: (pct, text) => callbacksRef.current.onLoadProgress?.(pct, text),
      onLoadComplete: () => callbacksRef.current.onLoadComplete?.(),
      onTelemetryUpdate: (stats) => callbacksRef.current.onTelemetryUpdate?.(stats),
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // Inicializamos una sola vez con el manifiesto inicial de los 10 logos 3D
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setInteractiveOrbit(orbitMode);
    }
  }, [orbitMode]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setHighlightDomain(highlightDomain);
    }
  }, [highlightDomain]);

  return (
    <canvas
      id="galaxy-canvas"
      ref={canvasRef}
      aria-label="Fondo tridimensional interactivo con la Galaxia Vía Láctea y logos de tecnologías"
    />
  );
}

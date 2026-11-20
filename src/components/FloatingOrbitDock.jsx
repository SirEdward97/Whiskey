export default function FloatingOrbitDock({ onExitOrbit }) {
  return (
    <div
      className="floating-orbit-dock"
      id="floating-orbit-dock"
      aria-label="Modo exploración 3D de la galaxia"
    >
      <span className="dock-hint">Arrastra para orbitar · Rueda / pellizco para zoom</span>
      <button
        type="button"
        className="chip-btn chip-accent"
        id="btn-exit-orbit-dock"
        onClick={onExitOrbit}
      >
        <span className="ember-dot" /> Volver al portafolio
      </button>
    </div>
  );
}

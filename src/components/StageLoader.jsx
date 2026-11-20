export default function StageLoader({ progress, text, hidden }) {
  return (
    <div
      className={`stage-loader${hidden ? ' hidden' : ''}`}
      id="stage-loader"
      role="status"
      aria-live="polite"
    >
      <span className="ember-dot" />
      <div className="loader-progress-track">
        <div
          className="loader-progress-bar"
          id="loader-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="loader-text" id="loader-text">
        {text}
      </span>
    </div>
  );
}

/**
 * ==========================================================================
 * ATMOSPHERIC BACKGROUND ENGINE — Implementación combinada de `sk.md` + `hi.md`
 * - Base Onyx oscura (#161616) estilo "Brutalist type foundry at dusk" (hi.md)
 * - Pliegues verticales de luz con deriva sinusoidal lenta y mezcla aditiva (sk.md)
 * - Nota cromática principal en Ember Orange (#ff6436) y Silver Mist (#c9c7cc)
 * ==========================================================================
 */

export const ATMOSPHERE_THEMES = {
  ember: {
    name: 'Ember Dusk (hi.md)',
    primary: '#ff6436',
    secondary: '#7b7a7c',
    rgb: [255, 100, 54],
    secondaryRgb: [123, 122, 124],
    coreRgb: [255, 185, 160],
    rimHex: 0xff6436
  },
  monochrome: {
    name: 'Silver Mist (hi.md)',
    primary: '#c9c7cc',
    secondary: '#7b7a7c',
    rgb: [201, 199, 204],
    secondaryRgb: [123, 122, 124],
    coreRgb: [248, 248, 248],
    rimHex: 0xdcd6d6
  },
  cyan: {
    name: 'Cian Frío (sk.md)',
    primary: '#22d3ee',
    secondary: '#0ea5e9',
    rgb: [34, 211, 238],
    secondaryRgb: [14, 165, 233],
    coreRgb: [165, 243, 252],
    rimHex: 0x22d3ee
  }
};

export class AtmosphereBackground {
  constructor(canvasId = 'atmosphere-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.config = {
      foldCount: 11,
      drift: 1.0,
      focalZone: 'bottom-right',
      themeKey: 'ember',
      softness: 1.05
    };

    this.folds = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.startTime = performance.now();
    this.onThemeChangeCallbacks = [];

    this._initFolds();
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
    this.applyCSSTheme(this.config.themeKey);
    this._animate();
  }

  _handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const scale = 0.65 * this.dpr;
    this.canvas.width = Math.max(1, Math.floor(this.width * scale));
    this.canvas.height = Math.max(1, Math.floor(this.height * scale));
  }

  _initFolds() {
    const count = this.config.foldCount;
    this.folds = [];

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      const pseudoRand1 = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
      const r1 = pseudoRand1 - Math.floor(pseudoRand1);
      const pseudoRand2 = Math.cos(i * 78.233 + 1.618) * 29381.1357;
      const r2 = pseudoRand2 - Math.floor(pseudoRand2);

      this.folds.push({
        index: i,
        normalizedPos: t,
        randomOffset: (r1 - 0.5) * 0.14,
        widthRatio: 0.13 + r2 * 0.16,
        freqPrimary: 0.18 + r1 * 0.22,
        freqSecondary: 0.09 + r2 * 0.14,
        phasePrimary: i * 1.15 + r1 * Math.PI * 2,
        phaseSecondary: i * 2.05 + r2 * Math.PI * 2,
        swayAmpRatio: 0.035 + r2 * 0.055,
        tiltRatio: (r1 - 0.45) * 0.15,
        baseIntensity: 0.042 + r2 * 0.05,
        useCoreHighlight: i % 3 === 0
      });
    }
  }

  setConfig(partial) {
    const prevCount = this.config.foldCount;
    const prevTheme = this.config.themeKey;
    Object.assign(this.config, partial);

    if (partial.foldCount && partial.foldCount !== prevCount) {
      this._initFolds();
    }
    if (partial.themeKey && partial.themeKey !== prevTheme) {
      this.applyCSSTheme(this.config.themeKey);
    }
  }

  onThemeChange(cb) {
    this.onThemeChangeCallbacks.push(cb);
  }

  applyCSSTheme(themeKey) {
    const theme = ATMOSPHERE_THEMES[themeKey] || ATMOSPHERE_THEMES.ember;
    this.onThemeChangeCallbacks.forEach((cb) => cb(theme));
  }

  _getFocalAnchor() {
    switch (this.config.focalZone) {
      case 'bottom-center':
        return { fx: 0.5, fy: 0.94 };
      case 'bottom-left':
        return { fx: 0.16, fy: 0.92 };
      case 'bottom-right':
      default:
        return { fx: 0.84, fy: 0.92 };
    }
  }

  _drawFrame(now) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const elapsed = (now - this.startTime) * 0.001;
    const theme = ATMOSPHERE_THEMES[this.config.themeKey] || ATMOSPHERE_THEMES.ember;
    const [r, g, b] = theme.rgb;
    const [sr, sg, sb] = theme.secondaryRgb;
    const [cr, cg, cb] = theme.coreRgb;
    const { fx, fy } = this._getFocalAnchor();

    // 1. Base Onyx (#161616) de hi.md y carbón profundo de sk.md
    ctx.globalCompositeOperation = 'source-over';
    const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
    baseGrad.addColorStop(0, '#0e0e0f');
    baseGrad.addColorStop(0.5, '#141416');
    baseGrad.addColorStop(1, '#18171a');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Pliegues verticales superpuestos con mezcla Screen / Aditiva
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.folds.length; i++) {
      const fold = this.folds[i];
      const timeScaled = elapsed * this.config.drift;
      const rawAnchorX = fold.normalizedPos + fold.randomOffset;
      const biasedAnchorX = rawAnchorX * 0.62 + fx * 0.38;

      const driftOffset =
        Math.sin(timeScaled * fold.freqPrimary + fold.phasePrimary) * fold.swayAmpRatio * this.config.drift +
        Math.cos(timeScaled * fold.freqSecondary + fold.phaseSecondary) * (fold.swayAmpRatio * 0.55) * this.config.drift;

      const centerX = (biasedAnchorX + driftOffset) * W;
      const foldWidth = W * fold.widthRatio * this.config.softness;

      const distToFocalX = Math.abs((centerX / W) - fx);
      const focalBoost = Math.max(0.28, Math.pow(1 - Math.min(distToFocalX * 0.95, 0.85), 1.65));
      const breath = 0.82 + 0.18 * Math.sin(timeScaled * 0.25 + fold.phasePrimary);
      const alphaPeak = Math.min(0.38, fold.baseIntensity * focalBoost * breath * (0.75 + 0.25 * this.config.softness));

      ctx.save();
      const tiltAngle = fold.tiltRatio + Math.sin(timeScaled * 0.14 + fold.phaseSecondary) * 0.035;
      ctx.translate(centerX, H * 0.65);
      ctx.rotate(tiltAngle);

      const horizGrad = ctx.createLinearGradient(-foldWidth * 0.5, 0, foldWidth * 0.5, 0);
      horizGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, 0)`);
      horizGrad.addColorStop(0.24, `rgba(${sr}, ${sg}, ${sb}, ${(alphaPeak * 0.35).toFixed(4)})`);
      horizGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alphaPeak.toFixed(4)})`);
      if (fold.useCoreHighlight) {
        horizGrad.addColorStop(0.54, `rgba(${cr}, ${cg}, ${cb}, ${(alphaPeak * 1.12).toFixed(4)})`);
      }
      horizGrad.addColorStop(0.78, `rgba(${sr}, ${sg}, ${sb}, ${(alphaPeak * 0.32).toFixed(4)})`);
      horizGrad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`);

      ctx.fillStyle = horizGrad;
      ctx.fillRect(-foldWidth * 0.5, -H * 0.9, foldWidth, H * 1.55);
      ctx.restore();
    }

    // 3. Máscara de degradado vertical (desvanece arriba, intensifica abajo)
    ctx.globalCompositeOperation = 'destination-in';
    const vertMask = ctx.createLinearGradient(0, 0, 0, H);
    vertMask.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
    vertMask.addColorStop(0.35, 'rgba(0, 0, 0, 0.42)');
    vertMask.addColorStop(0.72, 'rgba(0, 0, 0, 0.85)');
    vertMask.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = vertMask;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    // 4. Superposición de brillo radial focal cerca de la esquina inferior derecha
    ctx.globalCompositeOperation = 'screen';
    const focalPulse = 0.92 + 0.08 * Math.sin(elapsed * 0.35);
    const focalRadius = Math.max(W, H) * 0.52 * this.config.softness;
    const focalGlow = ctx.createRadialGradient(
      W * fx, H * fy, W * 0.01,
      W * fx, H * fy, focalRadius
    );
    focalGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(0.20 * focalPulse).toFixed(4)})`);
    focalGlow.addColorStop(0.35, `rgba(${sr}, ${sg}, ${sb}, ${(0.11 * focalPulse).toFixed(4)})`);
    focalGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = focalGlow;
    ctx.fillRect(0, 0, W, H);
  }

  _animate() {
    const loop = (now) => {
      this._drawFrame(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

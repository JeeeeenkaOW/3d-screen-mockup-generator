(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);

  // DOM refs
  const viewport = $('#viewport');
  const captureArea = $('#captureArea');
  const scene = $('#scene');
  const screenWrapper = $('#screenWrapper');
  const screen_ = $('#screen');
  const screenContent = $('#screenContent');
  const screenImage = $('#screenImage');
  const screenGloss = $('#screenGloss');
  const screenInnerShadow = $('#screenInnerShadow');
  const screenShadow = $('#screenShadow');
  const screenBack = $('#screenBack');
  const backImageEl = $('#backImage');
  const uploadPrompt = $('#uploadPrompt');
  const checkerboard = $('#checkerboard');
  const dragHint = $('#dragHint');
  const dropOverlay = $('#dropOverlay');
  const recordOverlay = $('#recordOverlay');
  const recordProgressFill = $('#recordProgressFill');
  const recordFrameCount = $('#recordFrameCount');

  // Controls
  const cRadius = $('#cornerRadius');
  const cBezel = $('#bezel');
  const cBezelColor = $('#bezelColor');
  const cBezelColorHex = $('#bezelColorHex');
  const cBezelStyle = $('#bezelStyle');
  const screenEdge = $('#screenEdge');

  // Glass edge
  const cGlassEnabled = $('#glassEnabled');
  const glassControls = $('#glassControls');
  const cGlassThickness = $('#glassThickness');
  const cGlassSheen = $('#glassSheen');
  const cGlassRefraction = $('#glassRefraction');
  const cGlassAngle = $('#glassAngle');
  const cGlassFrost = $('#glassFrost');
  const glassFrostRow = $('#glassFrostRow');
  const cGlassFrostAmount = $('#glassFrostAmount');

  // Worn edges
  const cWornEnabled = $('#wornEnabled');
  const wornControls = $('#wornControls');
  const cWornAmount = $('#wornAmount');
  const cWornScale = $('#wornScale');
  const cWornDepth = $('#wornDepth');
  const cRotX = $('#rotateX');
  const cRotY = $('#rotateY');
  const cPerspective = $('#perspective');
  const cScale = $('#scale');
  const cMouseCtrl = $('#mouseControl');
  const cOrtho = $('#orthographic');

  // Gloss
  const cGlossEnabled = $('#glossEnabled');
  const glossControls = $('#glossControls');
  const cGlossInt = $('#glossIntensity');
  const cGlossAngle = $('#glossAngle');
  const cGlossColor = $('#glossColor');
  const cGlossColorHex = $('#glossColorHex');
  const cGlossBlend = $('#glossBlend');

  // Inner shadow
  const cInnerShadowEnabled = $('#innerShadowEnabled');
  const innerShadowControls = $('#innerShadowControls');
  const cInnerShadowInt = $('#innerShadowIntensity');
  const cInnerShadowAngle = $('#innerShadowAngle');
  const cInnerShadowColor = $('#innerShadowColor');
  const cInnerShadowColorHex = $('#innerShadowColorHex');
  const cInnerShadowBlend = $('#innerShadowBlend');

  // Drop shadow
  const cDropShadowEnabled = $('#dropShadowEnabled');
  const dropShadowControls = $('#dropShadowControls');
  const cShadowInt = $('#shadowIntensity');
  const cShadowBlur = $('#shadowBlur');
  const cShadowOffsetX = $('#shadowOffsetX');
  const cShadowOffsetY = $('#shadowOffsetY');
  const cShadowSpread = $('#shadowSpread');
  const cShadowColor = $('#shadowColor');
  const cShadowColorHex = $('#shadowColorHex');

  // Animation
  const cAnimHover = $('#animateHover');
  const cAnimMode = $('#animMode');
  const cAnimSpeed = $('#animSpeed');
  const cAnimAmplitude = $('#animAmplitude');
  const animModeRow = $('#animModeRow');
  const animSpeedRow = $('#animSpeedRow');
  const animAmplitudeRow = $('#animAmplitudeRow');
  const backImageRow = $('#backImageRow');
  const backImageInput = $('#backImageInput');
  const btnRemoveBack = $('#btnRemoveBack');

  const cExportScale = $('#exportScale');
  const fileInput = $('#fileInput');
  const btnExportPng = $('#btnExportPng');
  const btnExportWebm = $('#btnExportWebm');
  const btnReset = $('#btnReset');
  const bgButtons = document.querySelectorAll('.bg-option');
  const bgColorPicker = $('#bgColorPicker');
  const bgColorHex = $('#bgColorHex');
  const bgColorSwatch = $('#bgColorSwatch');
  const bgColorPickerRow = $('#bgColorPickerRow');

  // State
  let state = {
    bgMode: 'transparent',
    bgColor: '#000000',
    imageLoaded: false,
    isDragging: false,
    mouseStartX: 0, mouseStartY: 0,
    dragStartRx: 0, dragStartRy: 0,
    naturalWidth: 400,
    naturalHeight: 540,
    sourceImage: null,
    imageDataURL: null,
    backImage: null,
    backImageDataURL: null,
  };

  const DEFAULTS = {
    cornerRadius: 12, bezel: 0, bezelColor: '#1a1a1a', bezelStyle: 'solid',
    rotateX: 0, rotateY: 0, perspective: 900, scale: 80,
    mouseControl: true, orthographic: false,
    glossEnabled: false, glossIntensity: 30, glossAngle: 135, glossColor: '#ffffff', glossBlend: 'normal',
    innerShadowEnabled: false, innerShadowIntensity: 25, innerShadowAngle: 315, innerShadowColor: '#000000', innerShadowBlend: 'normal',
    glassEnabled: false, glassThickness: 14, glassSheen: 65, glassRefraction: 45, glassAngle: 135, glassFrost: false, glassFrostAmount: 40,
    wornEnabled: false, wornAmount: 40, wornScale: 7, wornDepth: 6,
    dropShadowEnabled: false, shadowIntensity: 40, shadowBlur: 40, shadowOffsetX: 0, shadowOffsetY: 20,
    shadowSpread: 0, shadowColor: '#000000',
    animateHover: false, animMode: 'tilt', animSpeed: 4, animAmplitude: 12,
    exportScale: 2, bgMode: 'transparent', bgColor: '#000000',
  };

  /**
   * Convert CSS gradient angle to canvas angle.
   * CSS: 0° = to top (↑), 90° = to right (→), clockwise.
   * Canvas: 0° = to right (→), increases counter-clockwise in standard math.
   * We need the gradient start→end line direction.
   * CSS angle A means the gradient line points at A degrees from north, clockwise.
   * In canvas coords (y-down): direction angle = (A - 90)° converted to radians,
   * but we measure from the positive x-axis.
   * Actually: CSS angle A → canvas direction = (90 - A) degrees → convert to radians.
   * Wait, let me think more carefully.
   * CSS linear-gradient(135deg, ...) goes from top-left to bottom-right.
   * In canvas, to replicate: start at top-left, end at bottom-right.
   * The formula: canvas_radians = (A - 90) * PI / 180, where A is CSS degrees.
   * Then: start = center - cos/sin * diagonal, end = center + cos/sin * diagonal.
   * But canvas y-axis is inverted (down = positive).
   * So: dx = sin(A_rad), dy = -cos(A_rad) where A_rad = A * PI/180 (CSS convention).
   * This gives us the gradient direction vector in canvas coords.
   */
  function cssAngleToCanvasGradient(cssDeg, cx, cy, halfDiag) {
    const rad = (cssDeg * Math.PI) / 180;
    // CSS gradient direction: (sin(A), -cos(A)) but in canvas y-down: (sin(A), cos(A)) wait...
    // CSS 0° = bottom-to-top, 90° = left-to-right, 180° = top-to-bottom
    // Actually no — CSS spec: 0deg = to top, angles go clockwise.
    // Direction vector in CSS coords: (sin(A), -cos(A)) ... but CSS y-axis goes DOWN on screen.
    // In canvas (y-down): direction = (sin(A), -cos(A)) still holds because CSS y also goes down.
    // Wait, CSS 0° goes upward = (0, -1) in screen coords. sin(0)=0, -cos(0)=-1. Correct.
    // CSS 90° goes right = (1, 0). sin(90)=1, -cos(90)=0. Correct.
    // CSS 135° goes bottom-right = (sin135, -cos135) = (0.707, 0.707). Correct.
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    return {
      x1: cx - dx * halfDiag,
      y1: cy - dy * halfDiag,
      x2: cx + dx * halfDiag,
      y2: cy + dy * halfDiag,
    };
  }

  // ======== Init ========
  function init() {
    bindControls();
    bindDragRotate();
    bindFileDrop();
    bindExport();
    applyAll();
  }

  // ======== Controls ========
  function bindControls() {
    const sliders = [
      [cRadius, 'cornerRadiusVal', 'px'],
      [cBezel, 'bezelVal', 'px'],
      [cRotX, 'rotateXVal', '°'],
      [cRotY, 'rotateYVal', '°'],
      [cPerspective, 'perspectiveVal', ''],
      [cScale, 'scaleVal', '%'],
      [cGlossInt, 'glossIntensityVal', '%'],
      [cGlossAngle, 'glossAngleVal', '°'],
      [cInnerShadowInt, 'innerShadowIntensityVal', '%'],
      [cInnerShadowAngle, 'innerShadowAngleVal', '°'],
      [cGlassThickness, 'glassThicknessVal', 'px'],
      [cGlassSheen, 'glassSheenVal', '%'],
      [cGlassRefraction, 'glassRefractionVal', '%'],
      [cGlassAngle, 'glassAngleVal', '°'],
      [cGlassFrostAmount, 'glassFrostAmountVal', '%'],
      [cWornAmount, 'wornAmountVal', '%'],
      [cWornScale, 'wornScaleVal', 'px'],
      [cWornDepth, 'wornDepthVal', 'px'],
      [cShadowInt, 'shadowIntensityVal', '%'],
      [cShadowBlur, 'shadowBlurVal', 'px'],
      [cShadowOffsetX, 'shadowOffsetXVal', 'px'],
      [cShadowOffsetY, 'shadowOffsetYVal', 'px'],
      [cShadowSpread, 'shadowSpreadVal', 'px'],
      [cAnimSpeed, 'animSpeedVal', 's'],
      [cAnimAmplitude, 'animAmplitudeVal', '°'],
      [cExportScale, 'exportScaleVal', '×'],
    ];
    sliders.forEach(([el, valId, suf]) => {
      el.addEventListener('input', () => {
        document.getElementById(valId).textContent = el.value + suf;
        applyAll();
      });
    });

    bindColorPair(cBezelColor, cBezelColorHex);
    bindColorPair(cGlossColor, cGlossColorHex);
    bindColorPair(cInnerShadowColor, cInnerShadowColorHex);
    bindColorPair(cShadowColor, cShadowColorHex);
    bindColorPair(bgColorPicker, bgColorHex, (v) => {
      state.bgColor = v;
      bgColorSwatch.style.background = v;
    });

    // Blend mode dropdowns
    cGlossBlend.addEventListener('change', applyAll);
    cInnerShadowBlend.addEventListener('change', applyAll);

    // Section toggles
    cGlossEnabled.addEventListener('change', () => {
      glossControls.classList.toggle('hidden', !cGlossEnabled.checked);
      applyAll();
    });
    cInnerShadowEnabled.addEventListener('change', () => {
      innerShadowControls.classList.toggle('hidden', !cInnerShadowEnabled.checked);
      applyAll();
    });
    cDropShadowEnabled.addEventListener('change', () => {
      dropShadowControls.classList.toggle('hidden', !cDropShadowEnabled.checked);
      applyAll();
    });

    cMouseCtrl.addEventListener('change', applyAll);
    cOrtho.addEventListener('change', applyAll);
    cBezelStyle.addEventListener('change', applyAll);
    cAnimMode.addEventListener('change', () => { updateAnimUI(); applyAll(); });

    cGlassEnabled.addEventListener('change', () => {
      glassControls.classList.toggle('hidden', !cGlassEnabled.checked);
      applyAll();
    });
    cGlassFrost.addEventListener('change', () => {
      glassFrostRow.classList.toggle('hidden', !cGlassFrost.checked);
      applyAll();
    });
    cWornEnabled.addEventListener('change', () => {
      wornControls.classList.toggle('hidden', !cWornEnabled.checked);
      applyAll();
    });

    cAnimHover.addEventListener('change', () => {
      const on = cAnimHover.checked;
      animModeRow.classList.toggle('hidden', !on);
      animSpeedRow.classList.toggle('hidden', !on);
      animAmplitudeRow.classList.toggle('hidden', !on);
      btnExportWebm.classList.toggle('hidden', !on);
      updateAnimUI();
      applyAll();
    });

    bgButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        bgButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.bgMode = btn.dataset.bg;
        bgColorPickerRow.classList.toggle('hidden', state.bgMode !== 'color');
        applyAll();
      });
    });

    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });
    uploadPrompt.addEventListener('click', () => fileInput.click());
    btnReset.addEventListener('click', resetAll);

    // Back image for turntable
    backImageInput.addEventListener('change', (e) => { if (e.target.files[0]) loadBackImage(e.target.files[0]); });
    btnRemoveBack.addEventListener('click', () => {
      state.backImage = null;
      state.backImageDataURL = null;
      backImageInput.value = '';
      backImageEl.src = '';
      backImageEl.classList.remove('loaded');
      screenBack.style.display = 'none';
      btnRemoveBack.classList.add('hidden');
      applyAll();
    });
  }

  function updateAnimUI() {
    const mode = cAnimMode.value;
    const animOn = cAnimHover.checked;
    const label = animAmplitudeRow.querySelector('.control-label');
    label.textContent = mode === 'float' ? 'Distance' : 'Amplitude';
    backImageRow.classList.toggle('hidden', !(animOn && mode === 'turntable'));
    animAmplitudeRow.classList.toggle('hidden', !animOn || mode === 'turntable');
  }

  function bindColorPair(picker, hex, extraCb) {
    picker.addEventListener('input', () => {
      hex.value = picker.value;
      if (extraCb) extraCb(picker.value);
      applyAll();
    });
    hex.addEventListener('change', () => {
      let v = hex.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        picker.value = v;
        if (extraCb) extraCb(v);
        applyAll();
      }
    });
  }

  // ======== Apply (CSS live preview) ========
  function applyAll() {
    const rx = +cRotX.value, ry = +cRotY.value;
    const persp = +cPerspective.value, s = +cScale.value / 100;
    const radius = +cRadius.value, bezel = +cBezel.value;
    const ortho = cOrtho.checked;
    const bezelC = cBezelColor.value;
    const bezelStyle = cBezelStyle.value;
    const animOn = cAnimHover.checked;
    const animMode = cAnimMode.value;
    const animDur = +cAnimSpeed.value;
    const animAmp = +cAnimAmplitude.value;

    const w = state.naturalWidth, h = state.naturalHeight;
    screen_.style.width = w + 'px';
    screen_.style.height = h + 'px';
    screen_.style.borderRadius = radius + 'px';
    // screenWrapper needs explicit size for the absolutely-positioned back face
    screenWrapper.style.width = w + 'px';
    screenWrapper.style.height = h + 'px';
    // Sync back face radius
    screenBack.style.borderRadius = radius + 'px';
    scene.style.perspective = ortho ? 'none' : persp + 'px';

    if (bezel > 0) {
      screen_.style.padding = bezel + 'px';
      screen_.style.background = bezelPaintCSS(bezelStyle, bezelC);
      screenContent.style.borderRadius = Math.max(0, radius - bezel) + 'px';
      screenContent.style.overflow = 'hidden';
    } else {
      screen_.style.padding = '0';
      screen_.style.background = 'var(--color-surface-secondary, #202020)';
      screenContent.style.borderRadius = '0';
    }

    // --- Back face ---
    // Decide which face the viewer sees from the rotation, toggling display in JS
    // rather than relying on CSS backface-visibility: applying a worn mask disables
    // backface culling, so the mirrored back face would otherwise ghost through.
    const isTurntable = animOn && animMode === 'turntable';
    let nry = ((ry % 360) + 360) % 360; if (nry > 180) nry -= 360;
    let nrx = ((rx % 360) + 360) % 360; if (nrx > 180) nrx -= 360;
    const backFacing = (Math.abs(nry) > 90) !== (Math.abs(nrx) > 90); // XOR: either axis flips it
    if (isTurntable) {
      screenBack.style.display = 'block';
      screen_.style.visibility = 'visible';
    } else if (state.imageLoaded && backFacing) {
      screenBack.style.display = 'block';
      screen_.style.visibility = 'hidden';
    } else {
      screenBack.style.display = 'none';
      screen_.style.visibility = 'visible';
    }

    // --- Animation ---
    screenWrapper.classList.remove('anim-tilt', 'anim-float', 'anim-breathe', 'anim-turntable');
    if (!animOn) {
      screenWrapper.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
      screenWrapper.style.setProperty('--screen-scale', s);
    } else {
      screenWrapper.style.setProperty('--anim-duration', `${animDur}s`);
      screenWrapper.style.setProperty('--screen-scale', s);
      screenWrapper.style.setProperty('--anim-base-rx', `${rx}deg`);
      screenWrapper.style.setProperty('--anim-base-ry', `${ry}deg`);
      screenWrapper.style.transform = '';
      if (animMode === 'tilt') {
        screenWrapper.style.setProperty('--anim-rx-a', `${rx + animAmp / 2}deg`);
        screenWrapper.style.setProperty('--anim-rx-b', `${rx - animAmp / 2}deg`);
        screenWrapper.style.setProperty('--anim-ry-a', `${ry - animAmp}deg`);
        screenWrapper.style.setProperty('--anim-ry-b', `${ry + animAmp}deg`);
        screenWrapper.classList.add('anim-tilt');
      } else if (animMode === 'float') {
        screenWrapper.style.setProperty('--float-up', `-${animAmp}px`);
        screenWrapper.style.setProperty('--float-down', `${animAmp}px`);
        screenWrapper.classList.add('anim-float');
      } else if (animMode === 'breathe') {
        const scaleAmp = animAmp * 0.005;
        screenWrapper.style.setProperty('--breathe-scale-a', (s - scaleAmp).toFixed(4));
        screenWrapper.style.setProperty('--breathe-scale-b', (s + scaleAmp).toFixed(4));
        screenWrapper.classList.add('anim-breathe');
      } else if (animMode === 'turntable') {
        screenWrapper.classList.add('anim-turntable');
      }
    }

    // --- Gloss ---
    if (cGlossEnabled.checked) {
      const glossI = +cGlossInt.value / 100, glossA = +cGlossAngle.value, glossC = cGlossColor.value;
      const gr = hexToRgb(glossC);
      screenGloss.style.background = `linear-gradient(${glossA}deg, rgba(${gr},${glossI * 0.8}) 0%, rgba(${gr},${glossI * 0.15}) 40%, rgba(0,0,0,0) 60%)`;
      screenGloss.style.mixBlendMode = cGlossBlend.value;
      screenGloss.style.display = '';
    } else {
      screenGloss.style.display = 'none';
    }

    // --- Inner shadow ---
    if (cInnerShadowEnabled.checked) {
      const innerSI = +cInnerShadowInt.value / 100, innerSA = +cInnerShadowAngle.value, innerSC = cInnerShadowColor.value;
      const isr = hexToRgb(innerSC);
      screenInnerShadow.style.background = `linear-gradient(${innerSA}deg, rgba(0,0,0,0) 30%, rgba(${isr},${innerSI * 0.15}) 60%, rgba(${isr},${innerSI * 0.7}) 100%)`;
      screenInnerShadow.style.mixBlendMode = cInnerShadowBlend.value;
      screenInnerShadow.style.display = '';
    } else {
      screenInnerShadow.style.display = 'none';
    }

    // --- Edge material (glass rim + worn edge) — shared canvases with export ---
    const { edgeUrl, maskUrl } = previewEdgeURLs();
    if (edgeUrl) {
      screenEdge.style.backgroundImage = `url(${edgeUrl})`;
      screenEdge.classList.add('active');
    } else {
      screenEdge.style.backgroundImage = '';
      screenEdge.classList.remove('active');
    }
    if (maskUrl) {
      screen_.style.webkitMaskImage = `url(${maskUrl})`;
      screen_.style.maskImage = `url(${maskUrl})`;
      screen_.style.webkitMaskSize = '100% 100%';
      screen_.style.maskSize = '100% 100%';
      screenBack.style.webkitMaskImage = `url(${maskUrl})`;
      screenBack.style.maskImage = `url(${maskUrl})`;
      screenBack.style.webkitMaskSize = '100% 100%';
      screenBack.style.maskSize = '100% 100%';
    } else {
      screen_.style.webkitMaskImage = '';
      screen_.style.maskImage = '';
      screenBack.style.webkitMaskImage = '';
      screenBack.style.maskImage = '';
    }

    // --- Drop shadow ---
    if (cDropShadowEnabled.checked) {
      const shadowI = +cShadowInt.value / 100;
      const shadowBl = +cShadowBlur.value;
      const shadowOX = +cShadowOffsetX.value;
      const shadowOY = +cShadowOffsetY.value;
      const shadowSpr = +cShadowSpread.value;
      const sr = hexToRgb(cShadowColor.value);
      screen_.style.boxShadow = `${shadowOX}px ${shadowOY}px ${shadowBl}px ${shadowSpr}px rgba(${sr},${shadowI})`;
    } else {
      screen_.style.boxShadow = 'none';
    }
    screenShadow.style.display = 'none';

    // --- Background ---
    // NOTE: never paint an opaque background on .capture-area. It has
    // transform-style: preserve-3d, and an opaque paint on a preserve-3d
    // element makes Chromium flatten/recomposite the 3D subtree, which then
    // clips the rotated panel (nested overflow:hidden) — the "non-transparent
    // bg cuts off the mockup" bug. Instead always paint the backdrop on the
    // flat .checkerboard layer that sits behind the capture area, and keep
    // capture-area + viewport transparent so the 3D context stays intact.
    captureArea.style.background = 'transparent';
    viewport.style.background = '';
    checkerboard.style.display = '';
    switch (state.bgMode) {
      case 'transparent':
        // fall back to the CSS checker pattern (#131313 + gradients)
        checkerboard.style.backgroundImage = '';
        checkerboard.style.backgroundColor = '';
        break;
      case 'color':
        checkerboard.style.backgroundImage = 'none';
        checkerboard.style.backgroundColor = state.bgColor;
        break;
      case 'greenscreen':
        checkerboard.style.backgroundImage = 'none';
        checkerboard.style.backgroundColor = '#00FF00';
        break;
    }
  }

  function hexToRgb(hex) {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
  }

  // ======== Shared edge-material canvas builders ========
  // These produce the SAME pixels for the live CSS preview (res = 1) and the
  // Three.js export texture (res = exportScale), so preview always matches export.

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Point on the rounded-rect border at perimeter fraction f (0..1).
  function pointOnRect(w, h, inset, f) {
    const x0 = inset, y0 = inset, ww = w - inset * 2, hh = h - inset * 2;
    const per = 2 * (ww + hh);
    let d = f * per;
    if (d < ww) return { x: x0 + d, y: y0, nx: 0, ny: -1 };
    d -= ww;
    if (d < hh) return { x: x0 + ww, y: y0 + d, nx: 1, ny: 0 };
    d -= hh;
    if (d < ww) return { x: x0 + ww - d, y: y0 + hh, nx: 0, ny: 1 };
    d -= ww;
    return { x: x0, y: y0 + hh - d, nx: -1, ny: 0 };
  }

  // White rounded-rect mask, optionally eroded along the edge for a worn look.
  function buildWornMask(w, h, radius, res, opts) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const ctx = c.getContext('2d');
    roundRect(ctx, 0, 0, c.width, c.height, radius);
    ctx.fillStyle = '#fff';
    ctx.fill();

    if (opts.wornEnabled && opts.wornAmount > 0) {
      const amount = opts.wornAmount / 100;
      const rough = Math.max(1, opts.wornScale * res);  // nibble size
      const depth = Math.max(1, opts.wornDepth * res);   // inward reach
      const per = 2 * (c.width + c.height);
      const count = Math.round((per / (rough * 1.1)) * (0.4 + amount * 1.1));
      const rng = mulberry32(98765);
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < count; i++) {
        const p = pointOnRect(c.width, c.height, 0, rng());
        // hug the edge: most nibbles bite from the rim inward by a small amount
        const inward = (rng() * rng()) * depth;            // biased toward the edge
        const cx = p.x - p.nx * inward + (rng() - 0.5) * rough * 0.4;
        const cy = p.y - p.ny * inward + (rng() - 0.5) * rough * 0.4;
        const r = rough * (0.25 + rng() * 0.55);
        // crisp cut with only a 1–2px anti-aliased rim (no wide translucent halo)
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.82, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    return c;
  }

  // Glass material overlay: treats the WHOLE card face (body sheen + glare + optional
  // frost) with an emphasized bevelled rim. Centre is kept (not punched) so the body
  // reads as glass over the image.
  function buildEdgeOverlay(w, h, radius, res, opts) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const ctx = c.getContext('2d');
    if (!opts.glassEnabled) return c;

    const thick = Math.max(1, opts.glassThickness * res);
    const sheen = opts.glassSheen / 100;
    const refr = opts.glassRefraction / 100;
    const innerRad = Math.max(0, radius - thick);
    const cx = c.width / 2, cy = c.height / 2;
    const halfDiag = Math.hypot(c.width, c.height) / 2;

    ctx.save();
    roundRect(ctx, 0, 0, c.width, c.height, radius);
    ctx.clip();

    // ---- BODY (whole face) ----
    // Faint overall tint so the surface reads as a pane of glass.
    ctx.fillStyle = `rgba(255,255,255,${0.03 + sheen * 0.05})`;
    ctx.fillRect(0, 0, c.width, c.height);

    // Frost: translucent wash + speckle across the entire body.
    if (opts.glassFrost) {
      const fa = opts.glassFrostAmount / 100;
      ctx.fillStyle = `rgba(255,255,255,${0.08 + fa * 0.5})`;
      ctx.fillRect(0, 0, c.width, c.height);
      const rng = mulberry32(24680);
      const dots = Math.round((c.width * c.height) / (700 / res));
      for (let i = 0; i < dots; i++) {
        const x = rng() * c.width, y = rng() * c.height;
        const r = (0.5 + rng() * 1.6) * res;
        ctx.fillStyle = `rgba(255,255,255,${0.03 + rng() * 0.12 * fa})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Diagonal glare bands sweeping across the body (the classic glass reflection).
    const g = cssAngleToCanvasGradient(opts.glassAngle, cx, cy, halfDiag);
    const glare = ctx.createLinearGradient(g.x1, g.y1, g.x2, g.y2);
    glare.addColorStop(0.00, 'rgba(255,255,255,0)');
    glare.addColorStop(0.20, `rgba(255,255,255,${0.30 * sheen})`);
    glare.addColorStop(0.27, `rgba(255,255,255,${0.05 * sheen})`);
    glare.addColorStop(0.33, `rgba(255,255,255,${0.14 * sheen})`);
    glare.addColorStop(0.45, 'rgba(255,255,255,0)');
    glare.addColorStop(0.78, 'rgba(255,255,255,0)');
    glare.addColorStop(0.86, `rgba(255,255,255,${0.16 * sheen})`);
    glare.addColorStop(1.00, `rgba(255,255,255,${0.32 * sheen})`);
    ctx.fillStyle = glare;
    ctx.fillRect(0, 0, c.width, c.height);

    // ---- RIM (edge emphasis) ----
    // Bright bevelled inner highlight (light wraps the top-left).
    ctx.lineJoin = 'round';
    ctx.lineWidth = thick * 0.55;
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (0.4 + sheen)})`;
    ctx.shadowColor = `rgba(255,255,255,${0.6 * sheen})`;
    ctx.shadowBlur = thick * 0.8;
    roundRect(ctx, thick * 0.5, thick * 0.5, c.width - thick, c.height - thick, Math.max(0, innerRad));
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Faux refraction / chromatic dispersion on the inner edge.
    if (refr > 0) {
      const off = Math.max(0.6, thick * 0.10) + refr * thick * 0.18;
      ctx.lineWidth = Math.max(1, thick * 0.18);
      ctx.strokeStyle = `rgba(255,80,80,${0.5 * refr})`;
      roundRect(ctx, thick - off, thick - off, c.width - (thick - off) * 2, c.height - (thick - off) * 2, Math.max(0, innerRad + off));
      ctx.stroke();
      ctx.strokeStyle = `rgba(80,180,255,${0.5 * refr})`;
      roundRect(ctx, thick + off, thick + off, c.width - (thick + off) * 2, c.height - (thick + off) * 2, Math.max(0, innerRad - off));
      ctx.stroke();
    }

    // Subtle dark outer edge for a sense of thickness.
    ctx.lineWidth = Math.max(1, thick * 0.16);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    roundRect(ctx, ctx.lineWidth / 2, ctx.lineWidth / 2, c.width - ctx.lineWidth, c.height - ctx.lineWidth, radius);
    ctx.stroke();

    ctx.restore();
    return c;
  }

  // Iridescent foil stops for the holographic bezel.
  const HOLO_STOPS = ['#ff5e8a', '#ffd86f', '#7bffb0', '#5ec8ff', '#b88cff', '#ff7bd5', '#ff5e8a'];

  // Bezel paint as a CSS background string (preview).
  function bezelPaintCSS(style, color) {
    if (style === 'holo') {
      return `linear-gradient(115deg, ${HOLO_STOPS.join(', ')})`;
    }
    if (style === 'glass') {
      return `linear-gradient(135deg, ${shade(color, 30)} 0%, ${color} 45%, ${shade(color, -24)} 100%)`;
    }
    return color;
  }

  // Bezel paint as a canvas fillStyle (export). ctx + rect needed for gradients.
  function bezelPaintCanvas(ctx, style, color, x, y, w, h) {
    if (style === 'holo') {
      // angle ~115deg across the rect
      const a = 115 * Math.PI / 180;
      const dx = Math.cos(a), dy = Math.sin(a);
      const hx = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
      const grad = ctx.createLinearGradient(x + w / 2 - dx * hx, y + h / 2 - dy * hx, x + w / 2 + dx * hx, y + h / 2 + dy * hx);
      HOLO_STOPS.forEach((cstop, i) => grad.addColorStop(i / (HOLO_STOPS.length - 1), cstop));
      return grad;
    }
    if (style === 'glass') {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, shade(color, 30));
      grad.addColorStop(0.45, color);
      grad.addColorStop(1, shade(color, -24));
      return grad;
    }
    return color;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return `rgb(${r},${g},${b})`;
  }

  // Read all edge/worn params once.
  function edgeOpts() {
    return {
      glassEnabled: cGlassEnabled.checked,
      glassThickness: +cGlassThickness.value,
      glassSheen: +cGlassSheen.value,
      glassRefraction: +cGlassRefraction.value,
      glassAngle: +cGlassAngle.value,
      glassFrost: cGlassFrost.checked,
      glassFrostAmount: +cGlassFrostAmount.value,
      wornEnabled: cWornEnabled.checked,
      wornAmount: +cWornAmount.value,
      wornScale: +cWornScale.value,
      wornDepth: +cWornDepth.value,
    };
  }

  // Memoised preview data-URLs (rotation drag calls applyAll often; these don't depend on angle).
  let _previewMemo = { key: '', edgeUrl: '', maskUrl: '' };
  function previewEdgeURLs() {
    const eo = edgeOpts();
    const w = state.naturalWidth, h = state.naturalHeight;
    const radius = +cRadius.value;
    const key = JSON.stringify([eo, w, h, radius]);
    if (key === _previewMemo.key) return _previewMemo;
    let edgeUrl = '', maskUrl = '';
    if (eo.glassEnabled) edgeUrl = buildEdgeOverlay(w, h, radius, 1, eo).toDataURL('image/png');
    if (eo.wornEnabled && eo.wornAmount > 0) maskUrl = buildWornMask(w, h, radius, 1, eo).toDataURL('image/png');
    _previewMemo = { key, edgeUrl, maskUrl };
    return _previewMemo;
  }


  // ======== Drag rotate ========
  function bindDragRotate() {
    viewport.addEventListener('mousedown', onDragStart);
    viewport.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

    // Mouse-wheel → scale
    viewport.addEventListener('wheel', (e) => {
      if (e.target.closest('.controls-panel')) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -2 : 2;
      const newVal = Math.max(+cScale.min, Math.min(+cScale.max, +cScale.value + delta));
      cScale.value = newVal;
      $('#scaleVal').textContent = newVal + '%';
      applyAll();
    }, { passive: false });
  }
  function onDragStart(e) {
    if (!cMouseCtrl.checked || cAnimHover.checked) return;
    if (e.target.closest('.controls-panel')) return;
    state.isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    state.mouseStartX = pt.clientX; state.mouseStartY = pt.clientY;
    state.dragStartRx = +cRotX.value; state.dragStartRy = +cRotY.value;
    dragHint.classList.add('hidden');
    e.preventDefault();
  }
  function onDragMove(e) {
    if (!state.isDragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - state.mouseStartX, dy = pt.clientY - state.mouseStartY;
    cRotX.value = Math.round(Math.max(-90, Math.min(90, state.dragStartRx - dy * 0.4)));
    cRotY.value = Math.round(Math.max(-180, Math.min(180, state.dragStartRy + dx * 0.4)));
    $('#rotateXVal').textContent = cRotX.value + '°';
    $('#rotateYVal').textContent = cRotY.value + '°';
    applyAll();
    e.preventDefault();
  }
  function onDragEnd() { state.isDragging = false; }

  // ======== File drop ========
  function bindFileDrop() {
    let dc = 0;
    document.addEventListener('dragenter', (e) => { e.preventDefault(); dc++; if (dc === 1) dropOverlay.classList.add('visible'); });
    document.addEventListener('dragleave', (e) => { e.preventDefault(); dc--; if (dc <= 0) { dc = 0; dropOverlay.classList.remove('visible'); } });
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault(); dc = 0; dropOverlay.classList.remove('visible');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) loadImage(f);
    });
  }

  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.sourceImage = img;
        state.imageDataURL = ev.target.result;
        let w = img.naturalWidth, h = img.naturalHeight;
        const maxDim = 800;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio); h = Math.round(h * ratio);
        }
        w = Math.max(200, w); h = Math.max(200, h);
        state.naturalWidth = w; state.naturalHeight = h;
        screenImage.src = ev.target.result;
        screenImage.classList.add('loaded');
        uploadPrompt.style.display = 'none';
        state.imageLoaded = true;
        applyAll();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadBackImage(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.backImage = img;
        state.backImageDataURL = ev.target.result;
        // Update viewport preview
        backImageEl.src = ev.target.result;
        backImageEl.classList.add('loaded');
        screenBack.style.display = 'block';        btnRemoveBack.classList.remove('hidden');
        applyAll();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ================================================================
  //  THREE.JS WEBGL EXPORT
  // ================================================================

  /**
   * Build a screen-face texture canvas (front or back).
   */
  function buildFaceTexture(opts, sourceImg) {
    const {
      cornerRadius, bezel, bezelColor, bezelStyle,
      glossEnabled, glossIntensity, glossAngle, glossColor, glossBlend,
      innerShadowEnabled, innerShadowIntensity, innerShadowAngle, innerShadowColor, innerShadowBlend,
      exportScale, screenW, screenH,
    } = opts;

    const totalW = screenW + bezel * 2;
    const totalH = screenH + bezel * 2;
    const texW = totalW * exportScale;
    const texH = totalH * exportScale;
    const texCanvas = document.createElement('canvas');
    texCanvas.width = texW;
    texCanvas.height = texH;
    const tctx = texCanvas.getContext('2d');

    // Bezel
    if (bezel > 0) {
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.fillStyle = bezelPaintCanvas(tctx, bezelStyle, bezelColor, 0, 0, texW, texH);
      tctx.fill();
    }

    // Image
    const imgX = bezel * exportScale, imgY = bezel * exportScale;
    const imgW = screenW * exportScale, imgH = screenH * exportScale;
    const innerR = bezel > 0 ? Math.max(0, cornerRadius - bezel) * exportScale : cornerRadius * exportScale;

    if (sourceImg) {
      tctx.save();
      roundRect(tctx, imgX, imgY, imgW, imgH, innerR);
      tctx.clip();
      tctx.drawImage(sourceImg, imgX, imgY, imgW, imgH);
      tctx.restore();
    } else {
      roundRect(tctx, imgX, imgY, imgW, imgH, innerR);
      tctx.fillStyle = '#202020';
      tctx.fill();
    }

    const blendMap = { normal: 'source-over', multiply: 'multiply', screen: 'screen' };
    const cx = texW / 2, cy = texH / 2;
    const halfDiag = Math.hypot(texW, texH) / 2;

    // Gloss
    if (glossEnabled && glossIntensity > 0) {
      tctx.save();
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.clip();
      tctx.globalCompositeOperation = blendMap[glossBlend] || 'source-over';
      const g = cssAngleToCanvasGradient(glossAngle, cx, cy, halfDiag);
      const gc = hexToRgb(glossColor);
      const grad = tctx.createLinearGradient(g.x1, g.y1, g.x2, g.y2);
      grad.addColorStop(0, `rgba(${gc},${glossIntensity * 0.8})`);
      grad.addColorStop(0.4, `rgba(${gc},${glossIntensity * 0.15})`);
      grad.addColorStop(0.6, `rgba(0,0,0,0)`);
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, texW, texH);
      tctx.restore();
    }

    // Inner shadow
    if (innerShadowEnabled && innerShadowIntensity > 0) {
      tctx.save();
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.clip();
      tctx.globalCompositeOperation = blendMap[innerShadowBlend] || 'source-over';
      const g = cssAngleToCanvasGradient(innerShadowAngle, cx, cy, halfDiag);
      const isc = hexToRgb(innerShadowColor);
      const grad = tctx.createLinearGradient(g.x1, g.y1, g.x2, g.y2);
      grad.addColorStop(0, `rgba(0,0,0,0)`);
      grad.addColorStop(0.4, `rgba(${isc},${innerShadowIntensity * 0.15})`);
      grad.addColorStop(1, `rgba(${isc},${innerShadowIntensity * 0.7})`);
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, texW, texH);
      tctx.restore();
    }

    // Glass edge overlay — identical builder to the live preview
    if (opts.glassEnabled) {
      const edge = buildEdgeOverlay(texW, texH, cornerRadius * exportScale, exportScale, opts);
      tctx.drawImage(edge, 0, 0);
    }

    // Alpha mask (worn-eroded if enabled, otherwise a clean rounded rect)
    tctx.globalCompositeOperation = 'destination-in';
    const maskCanvas = buildWornMask(texW, texH, cornerRadius * exportScale, exportScale, opts);
    tctx.drawImage(maskCanvas, 0, 0);
    tctx.globalCompositeOperation = 'source-over';

    return texCanvas;
  }

  function renderWithThreeJS(opts) {
    const {
      rotX, rotY, perspDist, scale, ortho,
      cornerRadius, bezel,
      dropShadowEnabled, shadowIntensity, shadowBlur, shadowOffsetX, shadowOffsetY, shadowSpread, shadowColor,
      bgMode, bgColor, exportScale,
      screenW, screenH, hasBackImage,
    } = opts;

    const totalW = screenW + bezel * 2;
    const totalH = screenH + bezel * 2;
    const texW = totalW * exportScale;
    const texH = totalH * exportScale;

    // Build front texture
    const frontCanvas = buildFaceTexture(opts, state.sourceImage);

    // Build back texture: use back image if provided, otherwise a blank panel
    // (still gets the same bezel / glass rim / worn edge as the front).
    let backCanvas = null;
    if (hasBackImage && state.backImage) {
      backCanvas = buildFaceTexture(opts, state.backImage);
    } else {
      backCanvas = buildFaceTexture(opts, null);
    }

    // Scene sizing
    const pad = dropShadowEnabled
      ? (Math.abs(shadowOffsetX) + shadowBlur + Math.abs(shadowSpread)) * exportScale + 60 * exportScale
      : 60 * exportScale;
    const viewW = Math.ceil(totalW * scale * exportScale + pad * 2);
    const viewH = Math.ceil(totalH * scale * exportScale + pad * 2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(viewW, viewH);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    if (bgMode === 'color') renderer.setClearColor(new THREE.Color(bgColor), 1);
    else if (bgMode === 'greenscreen') renderer.setClearColor(0x00FF00, 1);

    const threeScene = new THREE.Scene();

    let camera;
    if (ortho) {
      const aspect = viewW / viewH, halfH = viewH / 2;
      camera = new THREE.OrthographicCamera(-halfH * aspect, halfH * aspect, halfH, -halfH, 0.1, 10000);
      camera.position.set(0, 0, 1000);
    } else {
      const fovRad = 2 * Math.atan((viewH / 2) / (perspDist * exportScale));
      camera = new THREE.PerspectiveCamera((fovRad * 180) / Math.PI, viewW / viewH, 0.1, 10000);
      camera.position.set(0, 0, perspDist * exportScale);
    }
    camera.lookAt(0, 0, 0);

    // Drop shadow
    if (dropShadowEnabled && shadowIntensity > 0) {
      const sSW = texW + shadowSpread * 2 * exportScale;
      const sSH = texH + shadowSpread * 2 * exportScale;
      const sBlur = shadowBlur * exportScale;
      const sCanvW = Math.ceil(sSW + sBlur * 4), sCanvH = Math.ceil(sSH + sBlur * 4);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = sCanvW; shadowCanvas.height = sCanvH;
      const sctx = shadowCanvas.getContext('2d');
      sctx.filter = `blur(${sBlur}px)`;
      sctx.fillStyle = `rgba(${hexToRgb(shadowColor)},${shadowIntensity})`;
      roundRect(sctx, (sCanvW - sSW) / 2, (sCanvH - sSH) / 2, sSW, sSH, cornerRadius * exportScale);
      sctx.fill();
      sctx.filter = 'none';
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      shadowTex.minFilter = THREE.LinearFilter;
      const shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(sCanvW, sCanvH),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      );
      shadowMesh.position.set(shadowOffsetX * exportScale * scale, -shadowOffsetY * exportScale * scale, -1);
      shadowMesh.scale.set(scale, scale, 1);
      shadowMesh.renderOrder = -1;
      threeScene.add(shadowMesh);
    }

    // Front face
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.minFilter = THREE.LinearFilter; frontTex.magFilter = THREE.LinearFilter;
    const geo = new THREE.PlaneGeometry(texW, texH);
    const frontMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: frontTex, transparent: true, side: THREE.FrontSide }));
    frontMesh.rotation.x = -(rotX * Math.PI) / 180;
    frontMesh.rotation.y = (rotY * Math.PI) / 180;
    frontMesh.scale.set(scale, scale, scale);
    threeScene.add(frontMesh);

    // Back face
    if (backCanvas) {
      const backTex = new THREE.CanvasTexture(backCanvas);
      backTex.minFilter = THREE.LinearFilter; backTex.magFilter = THREE.LinearFilter;
      const backMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(texW, texH),
        new THREE.MeshBasicMaterial({ map: backTex, transparent: true, side: THREE.FrontSide })
      );
      backMesh.rotation.x = -(rotX * Math.PI) / 180;
      backMesh.rotation.y = (rotY * Math.PI) / 180 + Math.PI;
      backMesh.scale.set(scale, scale, scale);
      threeScene.add(backMesh);
    }

    renderer.render(threeScene, camera);
    const outCanvas = renderer.domElement;
    renderer.dispose();
    return outCanvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function gatherOpts(rxOverride, ryOverride, scaleOverride) {
    const isTurntable = cAnimHover.checked && cAnimMode.value === 'turntable';
    return {
      rotX: rxOverride != null ? rxOverride : +cRotX.value,
      rotY: ryOverride != null ? ryOverride : +cRotY.value,
      perspDist: +cPerspective.value,
      scale: scaleOverride != null ? scaleOverride : +cScale.value / 100,
      ortho: cOrtho.checked,
      cornerRadius: +cRadius.value,
      bezel: +cBezel.value,
      bezelColor: cBezelColor.value,
      bezelStyle: cBezelStyle.value,
      glossEnabled: cGlossEnabled.checked,
      glossIntensity: +cGlossInt.value / 100,
      glossAngle: +cGlossAngle.value,
      glossColor: cGlossColor.value,
      glossBlend: cGlossBlend.value,
      innerShadowEnabled: cInnerShadowEnabled.checked,
      innerShadowIntensity: +cInnerShadowInt.value / 100,
      innerShadowAngle: +cInnerShadowAngle.value,
      innerShadowColor: cInnerShadowColor.value,
      innerShadowBlend: cInnerShadowBlend.value,
      dropShadowEnabled: cDropShadowEnabled.checked,
      shadowIntensity: +cShadowInt.value / 100,
      shadowBlur: +cShadowBlur.value,
      shadowOffsetX: +cShadowOffsetX.value,
      shadowOffsetY: +cShadowOffsetY.value,
      shadowSpread: +cShadowSpread.value,
      shadowColor: cShadowColor.value,
      bgMode: state.bgMode,
      bgColor: state.bgColor,
      exportScale: +cExportScale.value,
      screenW: state.naturalWidth,
      screenH: state.naturalHeight,
      hasBackImage: !!state.backImage,
      glassEnabled: cGlassEnabled.checked,
      glassThickness: +cGlassThickness.value,
      glassSheen: +cGlassSheen.value,
      glassRefraction: +cGlassRefraction.value,
      glassAngle: +cGlassAngle.value,
      glassFrost: cGlassFrost.checked,
      glassFrostAmount: +cGlassFrostAmount.value,
      wornEnabled: cWornEnabled.checked,
      wornAmount: +cWornAmount.value,
      wornScale: +cWornScale.value,
      wornDepth: +cWornDepth.value,
    };
  }

  // ======== Export ========
  function bindExport() {
    btnExportPng.addEventListener('click', exportPng);
    btnExportWebm.addEventListener('click', exportWebm);
  }

  async function exportPng() {
    btnExportPng.disabled = true;
    btnExportPng.textContent = 'RENDERING...';
    try {
      await wait(50);
      const canvas = renderWithThreeJS(gatherOpts());
      const link = document.createElement('a');
      link.download = '3d-screen-mockup.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    }
    btnExportPng.disabled = false;
    btnExportPng.textContent = 'DOWNLOAD PNG';
  }

  function getAnimFrame(t, mode, rx, ry, s, amp) {
    const angle = t * Math.PI * 2;
    switch (mode) {
      case 'tilt': return { rx: rx + Math.sin(angle) * (amp / 2), ry: ry + Math.cos(angle) * amp, s };
      case 'float': return { rx, ry, s, translateY: Math.sin(angle) * amp };
      case 'breathe': return { rx, ry, s: s + Math.sin(angle) * (amp * 0.005) };
      case 'turntable': return { rx, ry: t * 360, s };
      default: return { rx, ry, s };
    }
  }

  async function exportWebm() {
    btnExportWebm.disabled = true;
    btnExportWebm.textContent = 'RECORDING...';
    recordOverlay.classList.add('visible');
    recordProgressFill.style.width = '0%';
    recordFrameCount.textContent = 'Preparing...';

    try {
      await wait(100);
      const mode = cAnimMode.value;
      const duration = +cAnimSpeed.value * 1000;
      const fps = 30;
      const totalFrames = Math.round((duration / 1000) * fps);
      const rx = +cRotX.value, ry = +cRotY.value;
      const s = +cScale.value / 100;
      const amp = +cAnimAmplitude.value;

      const frame0 = getAnimFrame(0, mode, rx, ry, s, amp);
      const firstCanvas = renderWithThreeJS(gatherOpts(frame0.rx, frame0.ry, frame0.s));
      const recCanvas = document.createElement('canvas');
      recCanvas.width = firstCanvas.width; recCanvas.height = firstCanvas.height;
      const ctx = recCanvas.getContext('2d');

      const stream = recCanvas.captureStream(0);
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
        .find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const done = new Promise((r) => { recorder.onstop = r; });
      recorder.start();

      for (let i = 0; i < totalFrames; i++) {
        const t = i / totalFrames;
        const fr = getAnimFrame(t, mode, rx, ry, s, amp);
        const frame = renderWithThreeJS(gatherOpts(fr.rx, fr.ry, fr.s));
        ctx.clearRect(0, 0, recCanvas.width, recCanvas.height);
        ctx.drawImage(frame, 0, 0);
        if (stream.getVideoTracks()[0].requestFrame) stream.getVideoTracks()[0].requestFrame();
        recordProgressFill.style.width = (((i + 1) / totalFrames) * 100) + '%';
        recordFrameCount.textContent = `${i + 1} / ${totalFrames} frames`;
        await wait(5);
      }

      recorder.stop();
      await done;

      const ext = recorder.mimeType.includes('webm') ? 'webm' : 'mp4';
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const link = document.createElement('a');
      link.download = `3d-screen-animation.${ext}`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('WebM export failed:', err);
      alert('Video export failed: ' + err.message);
    }

    recordOverlay.classList.remove('visible');
    btnExportWebm.disabled = false;
    btnExportWebm.textContent = 'DOWNLOAD WEBM';
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ======== Reset ========
  function resetAll() {
    const D = DEFAULTS;
    cRadius.value = D.cornerRadius;
    cBezel.value = D.bezel;
    cBezelColor.value = D.bezelColor; cBezelColorHex.value = D.bezelColor;
    cBezelStyle.value = D.bezelStyle;
    cRotX.value = D.rotateX; cRotY.value = D.rotateY;
    cPerspective.value = D.perspective; cScale.value = D.scale;
    cMouseCtrl.checked = D.mouseControl; cOrtho.checked = D.orthographic;

    cGlossEnabled.checked = D.glossEnabled;
    glossControls.classList.add('hidden');
    cGlossInt.value = D.glossIntensity; cGlossAngle.value = D.glossAngle;
    cGlossColor.value = D.glossColor; cGlossColorHex.value = D.glossColor;
    cGlossBlend.value = D.glossBlend;

    cInnerShadowEnabled.checked = D.innerShadowEnabled;
    innerShadowControls.classList.add('hidden');
    cInnerShadowInt.value = D.innerShadowIntensity;
    cInnerShadowAngle.value = D.innerShadowAngle;
    cInnerShadowColor.value = D.innerShadowColor; cInnerShadowColorHex.value = D.innerShadowColor;
    cInnerShadowBlend.value = D.innerShadowBlend;

    cGlassEnabled.checked = D.glassEnabled;
    glassControls.classList.add('hidden');
    cGlassThickness.value = D.glassThickness;
    cGlassSheen.value = D.glassSheen;
    cGlassRefraction.value = D.glassRefraction;
    cGlassAngle.value = D.glassAngle;
    cGlassFrost.checked = D.glassFrost;
    glassFrostRow.classList.add('hidden');
    cGlassFrostAmount.value = D.glassFrostAmount;

    cWornEnabled.checked = D.wornEnabled;
    wornControls.classList.add('hidden');
    cWornAmount.value = D.wornAmount;
    cWornScale.value = D.wornScale;
    cWornDepth.value = D.wornDepth;

    screenEdge.style.backgroundImage = '';
    screenEdge.classList.remove('active');
    screen_.style.visibility = 'visible';
    screen_.style.webkitMaskImage = ''; screen_.style.maskImage = '';
    screenBack.style.webkitMaskImage = ''; screenBack.style.maskImage = '';
    _previewMemo = { key: '', edgeUrl: '', maskUrl: '' };

    cDropShadowEnabled.checked = D.dropShadowEnabled;
    dropShadowControls.classList.add('hidden');
    cShadowInt.value = D.shadowIntensity;
    cShadowBlur.value = D.shadowBlur;
    cShadowOffsetX.value = D.shadowOffsetX;
    cShadowOffsetY.value = D.shadowOffsetY;
    cShadowSpread.value = D.shadowSpread;
    cShadowColor.value = D.shadowColor; cShadowColorHex.value = D.shadowColor;

    cAnimHover.checked = D.animateHover;
    cAnimMode.value = D.animMode;
    cAnimSpeed.value = D.animSpeed;
    cAnimAmplitude.value = D.animAmplitude;
    cExportScale.value = D.exportScale;
    state.bgMode = D.bgMode; state.bgColor = D.bgColor;
    state.backImage = null; state.backImageDataURL = null;
    backImageInput.value = '';
    backImageEl.src = '';
    backImageEl.classList.remove('loaded');
    screenBack.style.display = 'none';
    btnRemoveBack.classList.add('hidden');

    $('#cornerRadiusVal').textContent = D.cornerRadius + 'px';
    $('#bezelVal').textContent = D.bezel + 'px';
    $('#rotateXVal').textContent = D.rotateX + '°';
    $('#rotateYVal').textContent = D.rotateY + '°';
    $('#perspectiveVal').textContent = D.perspective;
    $('#scaleVal').textContent = D.scale + '%';
    $('#glossIntensityVal').textContent = D.glossIntensity + '%';
    $('#glossAngleVal').textContent = D.glossAngle + '°';
    $('#innerShadowIntensityVal').textContent = D.innerShadowIntensity + '%';
    $('#innerShadowAngleVal').textContent = D.innerShadowAngle + '°';
    $('#glassThicknessVal').textContent = D.glassThickness + 'px';
    $('#glassSheenVal').textContent = D.glassSheen + '%';
    $('#glassRefractionVal').textContent = D.glassRefraction + '%';
    $('#glassAngleVal').textContent = D.glassAngle + '°';
    $('#glassFrostAmountVal').textContent = D.glassFrostAmount + '%';
    $('#wornAmountVal').textContent = D.wornAmount + '%';
    $('#wornScaleVal').textContent = D.wornScale + 'px';
    $('#wornDepthVal').textContent = D.wornDepth + 'px';
    $('#shadowIntensityVal').textContent = D.shadowIntensity + '%';
    $('#shadowBlurVal').textContent = D.shadowBlur + 'px';
    $('#shadowOffsetXVal').textContent = D.shadowOffsetX + 'px';
    $('#shadowOffsetYVal').textContent = D.shadowOffsetY + 'px';
    $('#shadowSpreadVal').textContent = D.shadowSpread + 'px';
    $('#animSpeedVal').textContent = D.animSpeed + 's';
    $('#animAmplitudeVal').textContent = D.animAmplitude + '°';
    $('#exportScaleVal').textContent = D.exportScale + '×';

    bgButtons.forEach((b) => b.classList.remove('active'));
    document.querySelector('[data-bg="transparent"]').classList.add('active');
    bgColorPickerRow.classList.add('hidden');
    bgColorPicker.value = '#000000'; bgColorHex.value = '#000000';
    bgColorSwatch.style.background = '#000';

    animModeRow.classList.add('hidden');
    animSpeedRow.classList.add('hidden');
    animAmplitudeRow.classList.add('hidden');
    backImageRow.classList.add('hidden');
    btnExportWebm.classList.add('hidden');

    applyAll();
  }

  init();
})();

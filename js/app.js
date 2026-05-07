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
  const screenChamfer = $('#screenChamfer');
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
  const cEdgeDepth = $('#edgeDepth');
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

  // ============================================================
  //  DEFAULTS — organized by section for per-section reset
  // ============================================================
  const SECTION_DEFAULTS = {
    shape: {
      cornerRadius: 12,
      bezel: 0,
      bezelColor: '#1a1a1a',
      edgeDepth: 0,
    },
    angle: {
      rotateX: 0,
      rotateY: 0,
      perspective: 900,
      scale: 80,
      mouseControl: true,
      orthographic: false,
    },
    gloss: {
      glossEnabled: false,
      glossIntensity: 30,
      glossAngle: 135,
      glossColor: '#ffffff',
      glossBlend: 'normal',
    },
    innerShadow: {
      innerShadowEnabled: false,
      innerShadowIntensity: 25,
      innerShadowAngle: 315,
      innerShadowColor: '#000000',
      innerShadowBlend: 'normal',
    },
    dropShadow: {
      dropShadowEnabled: false,
      shadowIntensity: 40,
      shadowBlur: 40,
      shadowOffsetX: 0,
      shadowOffsetY: 20,
      shadowSpread: 0,
      shadowColor: '#000000',
    },
    background: {
      bgMode: 'transparent',
      bgColor: '#000000',
    },
    animation: {
      animateHover: false,
      animMode: 'tilt',
      animSpeed: 4,
      animAmplitude: 12,
    },
  };

  // Flat defaults map — combined from all sections
  const DEFAULTS = Object.assign({ exportScale: 2 },
    ...Object.values(SECTION_DEFAULTS));

  /**
   * Convert CSS gradient angle to canvas gradient endpoints.
   * CSS 0deg = to top, 90deg = to right, clockwise.
   * Canvas y-axis is down, so: dx = sin(A), dy = -cos(A) matches CSS behavior.
   */
  function cssAngleToCanvasGradient(cssDeg, cx, cy, halfDiag) {
    const rad = (cssDeg * Math.PI) / 180;
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
    bindSectionResets();
    applyAll();
  }

  // ======== Controls ========
  function bindControls() {
    const sliders = [
      [cRadius, 'cornerRadiusVal', 'px'],
      [cBezel, 'bezelVal', 'px'],
      [cEdgeDepth, 'edgeDepthVal', 'px'],
      [cRotX, 'rotateXVal', '°'],
      [cRotY, 'rotateYVal', '°'],
      [cPerspective, 'perspectiveVal', ''],
      [cScale, 'scaleVal', '%'],
      [cGlossInt, 'glossIntensityVal', '%'],
      [cGlossAngle, 'glossAngleVal', '°'],
      [cInnerShadowInt, 'innerShadowIntensityVal', '%'],
      [cInnerShadowAngle, 'innerShadowAngleVal', '°'],
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

    cGlossBlend.addEventListener('change', applyAll);
    cInnerShadowBlend.addEventListener('change', applyAll);

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
    cAnimMode.addEventListener('change', () => { updateAnimUI(); applyAll(); });

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

  // ======== Per-section resets ========
  function bindSectionResets() {
    document.querySelectorAll('.panel-reset[data-reset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionKey = btn.dataset.reset;
        resetSection(sectionKey);
      });
    });
  }

  function resetSection(key) {
    const defaults = SECTION_DEFAULTS[key];
    if (!defaults) return;

    // Map of default-key -> {setter, valueId?, suffix?}
    // This keeps reset logic symmetric with the UI wiring.
    const appliers = {
      // Shape
      cornerRadius: (v) => { cRadius.value = v; $('#cornerRadiusVal').textContent = v + 'px'; },
      bezel:        (v) => { cBezel.value = v; $('#bezelVal').textContent = v + 'px'; },
      bezelColor:   (v) => { cBezelColor.value = v; cBezelColorHex.value = v; },
      edgeDepth:    (v) => { cEdgeDepth.value = v; $('#edgeDepthVal').textContent = v + 'px'; },
      // Angle
      rotateX:      (v) => { cRotX.value = v; $('#rotateXVal').textContent = v + '°'; },
      rotateY:      (v) => { cRotY.value = v; $('#rotateYVal').textContent = v + '°'; },
      perspective:  (v) => { cPerspective.value = v; $('#perspectiveVal').textContent = v; },
      scale:        (v) => { cScale.value = v; $('#scaleVal').textContent = v + '%'; },
      mouseControl: (v) => { cMouseCtrl.checked = v; },
      orthographic: (v) => { cOrtho.checked = v; },
      // Gloss
      glossEnabled:   (v) => { cGlossEnabled.checked = v; glossControls.classList.toggle('hidden', !v); },
      glossIntensity: (v) => { cGlossInt.value = v; $('#glossIntensityVal').textContent = v + '%'; },
      glossAngle:     (v) => { cGlossAngle.value = v; $('#glossAngleVal').textContent = v + '°'; },
      glossColor:     (v) => { cGlossColor.value = v; cGlossColorHex.value = v; },
      glossBlend:     (v) => { cGlossBlend.value = v; },
      // Inner shadow
      innerShadowEnabled:   (v) => { cInnerShadowEnabled.checked = v; innerShadowControls.classList.toggle('hidden', !v); },
      innerShadowIntensity: (v) => { cInnerShadowInt.value = v; $('#innerShadowIntensityVal').textContent = v + '%'; },
      innerShadowAngle:     (v) => { cInnerShadowAngle.value = v; $('#innerShadowAngleVal').textContent = v + '°'; },
      innerShadowColor:     (v) => { cInnerShadowColor.value = v; cInnerShadowColorHex.value = v; },
      innerShadowBlend:     (v) => { cInnerShadowBlend.value = v; },
      // Drop shadow
      dropShadowEnabled: (v) => { cDropShadowEnabled.checked = v; dropShadowControls.classList.toggle('hidden', !v); },
      shadowIntensity:   (v) => { cShadowInt.value = v; $('#shadowIntensityVal').textContent = v + '%'; },
      shadowBlur:        (v) => { cShadowBlur.value = v; $('#shadowBlurVal').textContent = v + 'px'; },
      shadowOffsetX:     (v) => { cShadowOffsetX.value = v; $('#shadowOffsetXVal').textContent = v + 'px'; },
      shadowOffsetY:     (v) => { cShadowOffsetY.value = v; $('#shadowOffsetYVal').textContent = v + 'px'; },
      shadowSpread:      (v) => { cShadowSpread.value = v; $('#shadowSpreadVal').textContent = v + 'px'; },
      shadowColor:       (v) => { cShadowColor.value = v; cShadowColorHex.value = v; },
      // Background
      bgMode:  (v) => {
        state.bgMode = v;
        bgButtons.forEach((b) => b.classList.toggle('active', b.dataset.bg === v));
        bgColorPickerRow.classList.toggle('hidden', v !== 'color');
      },
      bgColor: (v) => {
        state.bgColor = v;
        bgColorPicker.value = v; bgColorHex.value = v; bgColorSwatch.style.background = v;
      },
      // Animation
      animateHover: (v) => {
        cAnimHover.checked = v;
        animModeRow.classList.toggle('hidden', !v);
        animSpeedRow.classList.toggle('hidden', !v);
        animAmplitudeRow.classList.toggle('hidden', !v);
        btnExportWebm.classList.toggle('hidden', !v);
      },
      animMode:      (v) => { cAnimMode.value = v; },
      animSpeed:     (v) => { cAnimSpeed.value = v; $('#animSpeedVal').textContent = v + 's'; },
      animAmplitude: (v) => { cAnimAmplitude.value = v; $('#animAmplitudeVal').textContent = v + '°'; },
    };

    Object.entries(defaults).forEach(([k, v]) => {
      if (appliers[k]) appliers[k](v);
    });

    // Animation reset needs a second pass to update the amplitude label (float vs tilt etc.)
    if (key === 'animation') updateAnimUI();

    applyAll();
  }

  // ======== Apply (CSS live preview) ========
  function applyAll() {
    const rx = +cRotX.value, ry = +cRotY.value;
    const persp = +cPerspective.value, s = +cScale.value / 100;
    const radius = +cRadius.value, bezel = +cBezel.value;
    const edgeDepth = +cEdgeDepth.value;
    const ortho = cOrtho.checked;
    const bezelC = cBezelColor.value;
    const animOn = cAnimHover.checked;
    const animMode = cAnimMode.value;
    const animDur = +cAnimSpeed.value;
    const animAmp = +cAnimAmplitude.value;

    const w = state.naturalWidth, h = state.naturalHeight;
    screen_.style.width = w + 'px';
    screen_.style.height = h + 'px';
    screen_.style.borderRadius = radius + 'px';
    screenWrapper.style.width = w + 'px';
    screenWrapper.style.height = h + 'px';
    screenBack.style.borderRadius = radius + 'px';
    scene.style.perspective = ortho ? 'none' : persp + 'px';

    if (bezel > 0) {
      screen_.style.padding = bezel + 'px';
      screen_.style.background = bezelC;
      screenContent.style.borderRadius = Math.max(0, radius - bezel) + 'px';
      screenContent.style.overflow = 'hidden';
    } else {
      screen_.style.padding = '0';
      screen_.style.background = 'var(--color-surface-secondary, #202020)';
      screenContent.style.borderRadius = '0';
    }

    // --- Chamfer preview (layered inset shadows to fake a bevel) ---
    // Top/left inset highlight + bottom/right inset shadow = cheap faux bevel.
    // Export path renders real ExtrudeGeometry with bevel + lighting.
    if (edgeDepth > 0) {
      const highlightSize = Math.max(1, Math.round(edgeDepth * 0.6));
      const shadowSize = Math.max(1, Math.round(edgeDepth * 0.6));
      screenChamfer.style.display = 'block';
      screenChamfer.style.boxShadow = [
        `inset ${highlightSize}px ${highlightSize}px ${highlightSize * 1.5}px rgba(255,255,255,0.35)`,
        `inset -${shadowSize}px -${shadowSize}px ${shadowSize * 1.5}px rgba(0,0,0,0.45)`,
      ].join(', ');
    } else {
      screenChamfer.style.display = 'none';
      screenChamfer.style.boxShadow = 'none';
    }

    const isTurntable = animOn && animMode === 'turntable';
    screenBack.style.display = isTurntable ? 'block' : 'none';

    // --- Animation (CSS) ---
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
    // CRITICAL FIX: do NOT set background on .capture-area. It lives inside
    // a preserve-3d container and becomes a competing plane in 3D space,
    // causing the back half of the rotated screen to get clipped/hidden.
    switch (state.bgMode) {
      case 'transparent':
        checkerboard.style.display = '';
        viewport.style.background = '';
        break;
      case 'color':
        checkerboard.style.display = 'none';
        viewport.style.background = state.bgColor;
        break;
      case 'greenscreen':
        checkerboard.style.display = 'none';
        viewport.style.background = '#00FF00';
        break;
    }
  }

  function hexToRgb(hex) {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
  }

  // ======== Drag rotate ========
  function bindDragRotate() {
    viewport.addEventListener('mousedown', onDragStart);
    viewport.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

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
    cRotX.value = Math.round(Math.max(-45, Math.min(45, state.dragStartRx - dy * 0.3)));
    cRotY.value = Math.round(Math.max(-45, Math.min(45, state.dragStartRy + dx * 0.3)));
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
        backImageEl.src = ev.target.result;
        backImageEl.classList.add('loaded');
        screenBack.style.display = 'block';
        btnRemoveBack.classList.remove('hidden');
        applyAll();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ================================================================
  //  THREE.JS WEBGL EXPORT
  // ================================================================

  function buildFaceTexture(opts, sourceImg) {
    const {
      cornerRadius, bezel, bezelColor,
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

    if (bezel > 0) {
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.fillStyle = bezelColor;
      tctx.fill();
    }

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

    tctx.globalCompositeOperation = 'destination-in';
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = texW; maskCanvas.height = texH;
    const mctx = maskCanvas.getContext('2d');
    roundRect(mctx, 0, 0, texW, texH, cornerRadius * exportScale);
    mctx.fillStyle = '#fff';
    mctx.fill();
    tctx.drawImage(maskCanvas, 0, 0);
    tctx.globalCompositeOperation = 'source-over';

    return texCanvas;
  }

  /**
   * Build a rounded-rect Three.Shape for ExtrudeGeometry.
   * Centers the shape at origin.
   */
  function buildRoundedRectShape(w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  function renderWithThreeJS(opts) {
    const {
      rotX, rotY, perspDist, scale, ortho,
      cornerRadius, bezel, bezelColor, edgeDepth,
      dropShadowEnabled, shadowIntensity, shadowBlur, shadowOffsetX, shadowOffsetY, shadowSpread, shadowColor,
      bgMode, bgColor, exportScale,
      screenW, screenH, hasBackImage,
    } = opts;

    const totalW = screenW + bezel * 2;
    const totalH = screenH + bezel * 2;
    const texW = totalW * exportScale;
    const texH = totalH * exportScale;

    const frontCanvas = buildFaceTexture(opts, state.sourceImage);

    let backCanvas;
    if (hasBackImage && state.backImage) {
      backCanvas = buildFaceTexture(opts, state.backImage);
    } else {
      backCanvas = document.createElement('canvas');
      backCanvas.width = texW; backCanvas.height = texH;
      const bctx = backCanvas.getContext('2d');
      roundRect(bctx, 0, 0, texW, texH, cornerRadius * exportScale);
      bctx.fillStyle = '#1a1a1a';
      bctx.fill();
    }

    const depthPx = edgeDepth * exportScale;
    const extraPadForDepth = depthPx * Math.max(1, Math.abs(Math.sin(rotY * Math.PI / 180))) + 20;
    const pad = dropShadowEnabled
      ? (Math.abs(shadowOffsetX) + shadowBlur + Math.abs(shadowSpread)) * exportScale + 60 * exportScale + extraPadForDepth
      : 60 * exportScale + extraPadForDepth;
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

    // Lights — needed for chamfered edge to catch highlights
    if (edgeDepth > 0) {
      const ambient = new THREE.AmbientLight(0xffffff, 0.85);
      threeScene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
      keyLight.position.set(-200, 300, 500);
      threeScene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
      fillLight.position.set(300, -200, 400);
      threeScene.add(fillLight);
    }

    // Drop shadow (unchanged)
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
      shadowMesh.position.set(shadowOffsetX * exportScale * scale, -shadowOffsetY * exportScale * scale, -1 - depthPx);
      shadowMesh.scale.set(scale, scale, 1);
      shadowMesh.renderOrder = -1;
      threeScene.add(shadowMesh);
    }

    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.minFilter = THREE.LinearFilter;
    frontTex.magFilter = THREE.LinearFilter;
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.minFilter = THREE.LinearFilter;
    backTex.magFilter = THREE.LinearFilter;

    // ============================================================
    //  EDGE DEPTH BRANCH
    //  If depth > 0, build ExtrudeGeometry with bevel + multi-material.
    //  Otherwise fall back to flat PlaneGeometry (original behavior).
    // ============================================================
    if (depthPx > 0) {
      // ExtrudeGeometry uses the shape's native units. Our shape is texW × texH,
      // so depth is in the same units (pixel-space). Bevel is a small fraction.
      const bevelPx = Math.min(depthPx * 0.5, 6 * exportScale);
      const shape = buildRoundedRectShape(texW, texH, cornerRadius * exportScale);
      const extrudeSettings = {
        depth: depthPx,
        bevelEnabled: true,
        bevelThickness: bevelPx,
        bevelSize: bevelPx,
        bevelOffset: -bevelPx, // keeps overall footprint close to the flat plane
        bevelSegments: 4,
        curveSegments: 24,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Center Z so the mesh's origin is at the middle of its depth
      geo.translate(0, 0, -depthPx / 2);
      // Compute UVs per face group — ExtrudeGeometry gives group 0 = front+back caps, group 1 = sides.
      // We override UVs on the front cap to map our texture correctly.
      remapExtrudeUVs(geo, texW, texH);

      const edgeColor = new THREE.Color(bezel > 0 ? bezelColor : '#2a2a2a');
      const materials = [
        // Group 0 = front + back caps (we override with custom materials via groups below)
        new THREE.MeshPhongMaterial({
          map: frontTex, transparent: true,
          specular: 0x222222, shininess: 30, side: THREE.DoubleSide,
        }),
        // Group 1 = sides (bevel + extruded walls)
        new THREE.MeshPhongMaterial({
          color: edgeColor,
          specular: 0x888888, shininess: 80, side: THREE.DoubleSide,
        }),
      ];

      // Split group 0 into front/back so we can apply the back texture separately.
      splitExtrudeFrontBack(geo, texW, texH, depthPx);
      materials.splice(1, 0, new THREE.MeshPhongMaterial({
        map: backTex, transparent: true,
        specular: 0x111111, shininess: 20, side: THREE.DoubleSide,
      }));
      // Now: group 0 = front cap, group 1 = back cap, group 2 = sides

      const mesh = new THREE.Mesh(geo, materials);
      mesh.rotation.x = -(rotX * Math.PI) / 180;
      mesh.rotation.y = (rotY * Math.PI) / 180;
      mesh.scale.set(scale, scale, scale);
      threeScene.add(mesh);
    } else {
      // Flat path — identical to original implementation
      const geo = new THREE.PlaneGeometry(texW, texH);
      const frontMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: frontTex, transparent: true, side: THREE.FrontSide }));
      frontMesh.rotation.x = -(rotX * Math.PI) / 180;
      frontMesh.rotation.y = (rotY * Math.PI) / 180;
      frontMesh.scale.set(scale, scale, scale);
      threeScene.add(frontMesh);

      if (backCanvas) {
        const backMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(texW, texH),
          new THREE.MeshBasicMaterial({ map: backTex, transparent: true, side: THREE.FrontSide })
        );
        backMesh.rotation.x = -(rotX * Math.PI) / 180;
        backMesh.rotation.y = (rotY * Math.PI) / 180 + Math.PI;
        backMesh.scale.set(scale, scale, scale);
        threeScene.add(backMesh);
      }
    }

    renderer.render(threeScene, camera);
    const outCanvas = renderer.domElement;
    renderer.dispose();
    return outCanvas;
  }

  /**
   * Remap UVs on the front cap of an ExtrudeGeometry so our texture maps 1:1.
   * ExtrudeGeometry's default UVs for caps are based on geometry position and
   * generally work, but we force a clean [0,1] mapping based on shape bounds.
   */
  function remapExtrudeUVs(geo, w, h) {
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const halfW = w / 2, halfH = h / 2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Only override UVs for front/back cap vertices (identified by being within the shape bounds).
      // Side/bevel vertices get their native UVs, which are fine for a solid color material.
      const u = (x + halfW) / w;
      const v = (y + halfH) / h;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }

  /**
   * ExtrudeGeometry produces two material groups: group 0 = front+back caps, group 1 = sides.
   * We want three groups: front cap, back cap, sides — so front/back can use different textures.
   * The caps share group 0; we split them by inspecting each face's normal Z-direction.
   */
  function splitExtrudeFrontBack(geo, w, h, depth) {
    geo.computeVertexNormals();
    const groups = geo.groups.slice();
    const newGroups = [];
    const pos = geo.attributes.position;
    const normal = geo.attributes.normal;
    const index = geo.index;

    groups.forEach((g) => {
      if (g.materialIndex !== 0) {
        // Sides group — becomes materialIndex 2
        newGroups.push({ start: g.start, count: g.count, materialIndex: 2 });
        return;
      }
      // Cap group — split by face normal z
      let frontStart = -1, frontCount = 0;
      let backStart = -1, backCount = 0;
      const end = g.start + g.count;
      for (let i = g.start; i < end; i += 3) {
        const a = index ? index.getX(i) : i;
        const nz = normal.getZ(a);
        if (nz >= 0) {
          if (frontStart === -1) {
            // Flush any pending back range before starting a new front range
            if (backCount > 0) {
              newGroups.push({ start: backStart, count: backCount, materialIndex: 1 });
              backStart = -1; backCount = 0;
            }
            frontStart = i;
          }
          frontCount += 3;
        } else {
          if (backStart === -1) {
            if (frontCount > 0) {
              newGroups.push({ start: frontStart, count: frontCount, materialIndex: 0 });
              frontStart = -1; frontCount = 0;
            }
            backStart = i;
          }
          backCount += 3;
        }
      }
      if (frontCount > 0) newGroups.push({ start: frontStart, count: frontCount, materialIndex: 0 });
      if (backCount > 0) newGroups.push({ start: backStart, count: backCount, materialIndex: 1 });
    });

    geo.clearGroups();
    newGroups.forEach((g) => geo.addGroup(g.start, g.count, g.materialIndex));
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
      edgeDepth: +cEdgeDepth.value,
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
      hasBackImage: isTurntable && !!state.backImage,
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

  // ======== Global reset (all sections) ========
  function resetAll() {
    Object.keys(SECTION_DEFAULTS).forEach((key) => resetSection(key));

    // Also reset export scale and back image state (not part of any section)
    cExportScale.value = DEFAULTS.exportScale;
    $('#exportScaleVal').textContent = DEFAULTS.exportScale + '×';

    state.backImage = null;
    state.backImageDataURL = null;
    backImageInput.value = '';
    backImageEl.src = '';
    backImageEl.classList.remove('loaded');
    screenBack.style.display = 'none';
    btnRemoveBack.classList.add('hidden');

    applyAll();
  }

  init();
})();

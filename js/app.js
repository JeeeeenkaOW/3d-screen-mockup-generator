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
  const cRotX = $('#rotateX');
  const cRotY = $('#rotateY');
  const cPerspective = $('#perspective');
  const cScale = $('#scale');
  const cMouseCtrl = $('#mouseControl');
  const cOrtho = $('#orthographic');
  const cGlossInt = $('#glossIntensity');
  const cGlossAngle = $('#glossAngle');
  const cGlossColor = $('#glossColor');
  const cGlossColorHex = $('#glossColorHex');

  // Inner shadow controls
  const cInnerShadowInt = $('#innerShadowIntensity');
  const cInnerShadowAngle = $('#innerShadowAngle');
  const cInnerShadowColor = $('#innerShadowColor');
  const cInnerShadowColorHex = $('#innerShadowColorHex');

  // Drop shadow controls
  const cShadowInt = $('#shadowIntensity');
  const cShadowBlur = $('#shadowBlur');
  const cShadowOffsetX = $('#shadowOffsetX');
  const cShadowOffsetY = $('#shadowOffsetY');
  const cShadowSpread = $('#shadowSpread');
  const cShadowColor = $('#shadowColor');
  const cShadowColorHex = $('#shadowColorHex');

  // Animation controls
  const cAnimHover = $('#animateHover');
  const cAnimMode = $('#animMode');
  const cAnimSpeed = $('#animSpeed');
  const cAnimAmplitude = $('#animAmplitude');
  const animModeRow = $('#animModeRow');
  const animSpeedRow = $('#animSpeedRow');
  const animAmplitudeRow = $('#animAmplitudeRow');

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
  };

  const DEFAULTS = {
    cornerRadius: 12, bezel: 0, bezelColor: '#1a1a1a',
    rotateX: 0, rotateY: 0, perspective: 900, scale: 80,
    mouseControl: true, orthographic: false,
    glossIntensity: 30, glossAngle: 135, glossColor: '#ffffff',
    innerShadowIntensity: 25, innerShadowAngle: 315, innerShadowColor: '#000000',
    shadowIntensity: 40, shadowBlur: 40, shadowOffsetX: 0, shadowOffsetY: 20,
    shadowSpread: 0, shadowColor: '#000000',
    animateHover: false, animMode: 'tilt', animSpeed: 4, animAmplitude: 12,
    exportScale: 2, bgMode: 'transparent', bgColor: '#000000',
  };

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

    cMouseCtrl.addEventListener('change', applyAll);
    cOrtho.addEventListener('change', applyAll);
    cAnimMode.addEventListener('change', () => {
      updateAnimAmplitudeLabel();
      applyAll();
    });

    cAnimHover.addEventListener('change', () => {
      const on = cAnimHover.checked;
      animModeRow.classList.toggle('hidden', !on);
      animSpeedRow.classList.toggle('hidden', !on);
      animAmplitudeRow.classList.toggle('hidden', !on);
      btnExportWebm.classList.toggle('hidden', !on);
      updateAnimAmplitudeLabel();
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

    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) loadImage(e.target.files[0]);
    });
    uploadPrompt.addEventListener('click', () => fileInput.click());
    btnReset.addEventListener('click', resetAll);
  }

  function updateAnimAmplitudeLabel() {
    const mode = cAnimMode.value;
    const label = animAmplitudeRow.querySelector('.control-label');
    if (mode === 'breathe') {
      label.textContent = 'Amplitude';
      // For breathe, amplitude means % scale variance — use the same slider but interpret differently
    } else if (mode === 'float') {
      label.textContent = 'Distance';
    } else if (mode === 'turntable') {
      label.textContent = 'Amplitude';
    } else {
      label.textContent = 'Amplitude';
    }
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
    const glossI = +cGlossInt.value / 100, glossA = +cGlossAngle.value, glossC = cGlossColor.value;
    const innerSI = +cInnerShadowInt.value / 100, innerSA = +cInnerShadowAngle.value, innerSC = cInnerShadowColor.value;
    const shadowI = +cShadowInt.value / 100;
    const shadowBlur = +cShadowBlur.value;
    const shadowOX = +cShadowOffsetX.value;
    const shadowOY = +cShadowOffsetY.value;
    const shadowSpr = +cShadowSpread.value;
    const shadowC = cShadowColor.value;
    const bezelC = cBezelColor.value;
    const animOn = cAnimHover.checked;
    const animMode = cAnimMode.value;
    const animDur = +cAnimSpeed.value;
    const animAmp = +cAnimAmplitude.value;

    const w = state.naturalWidth, h = state.naturalHeight;
    screen_.style.width = w + 'px';
    screen_.style.height = h + 'px';
    screen_.style.borderRadius = radius + 'px';

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

    // --- Animation ---
    // Remove all animation classes
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
        const scaleAmp = animAmp * 0.005; // e.g. 12 → ±0.06
        screenWrapper.style.setProperty('--breathe-scale-a', (s - scaleAmp).toFixed(4));
        screenWrapper.style.setProperty('--breathe-scale-b', (s + scaleAmp).toFixed(4));
        screenWrapper.classList.add('anim-breathe');
      } else if (animMode === 'turntable') {
        screenWrapper.classList.add('anim-turntable');
      }
    }

    // --- Gloss (highlights) ---
    const gr = hexToRgb(glossC);
    screenGloss.style.background = `linear-gradient(${glossA}deg, rgba(${gr},${glossI * 0.8}) 0%, rgba(${gr},${glossI * 0.15}) 40%, rgba(0,0,0,0) 60%)`;

    // --- Inner shadow (shading — opposite direction from gloss) ---
    const isr = hexToRgb(innerSC);
    // The inner shadow gradient goes from transparent to dark — opposite feel of gloss
    screenInnerShadow.style.background = `linear-gradient(${innerSA}deg, rgba(0,0,0,0) 30%, rgba(${isr},${innerSI * 0.15}) 60%, rgba(${isr},${innerSI * 0.7}) 100%)`;

    // --- Drop shadow (behind the screen element via box-shadow) ---
    const sr = hexToRgb(shadowC);
    if (shadowI > 0) {
      screen_.style.boxShadow = `${shadowOX}px ${shadowOY}px ${shadowBlur}px ${shadowSpr}px rgba(${sr},${shadowI})`;
    } else {
      screen_.style.boxShadow = 'none';
    }
    // Hide the old elliptical shadow div — we use box-shadow now
    screenShadow.style.display = 'none';

    // --- Background ---
    switch (state.bgMode) {
      case 'transparent':
        checkerboard.style.display = '';
        viewport.style.background = '';
        captureArea.style.background = 'transparent';
        break;
      case 'color':
        checkerboard.style.display = 'none';
        viewport.style.background = state.bgColor;
        captureArea.style.background = state.bgColor;
        break;
      case 'greenscreen':
        checkerboard.style.display = 'none';
        viewport.style.background = '#00FF00';
        captureArea.style.background = '#00FF00';
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

  // ======== Load image ========
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

  // ================================================================
  //  THREE.JS WEBGL EXPORT
  // ================================================================

  function renderWithThreeJS(opts) {
    const {
      rotX, rotY, perspDist, scale, ortho,
      cornerRadius, bezel, bezelColor,
      glossIntensity, glossAngle, glossColor,
      innerShadowIntensity, innerShadowAngle, innerShadowColor,
      shadowIntensity, shadowBlur, shadowOffsetX, shadowOffsetY, shadowSpread,
      shadowColor,
      bgMode, bgColor, exportScale,
      screenW, screenH,
    } = opts;

    const totalW = screenW + bezel * 2;
    const totalH = screenH + bezel * 2;

    // --- Create a rounded-rect texture for the screen ---
    const texCanvas = document.createElement('canvas');
    const texW = totalW * exportScale;
    const texH = totalH * exportScale;
    texCanvas.width = texW;
    texCanvas.height = texH;
    const tctx = texCanvas.getContext('2d');

    // Bezel background
    if (bezel > 0) {
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.fillStyle = bezelColor;
      tctx.fill();
    }

    // Image area
    const imgX = bezel * exportScale;
    const imgY = bezel * exportScale;
    const imgW = screenW * exportScale;
    const imgH = screenH * exportScale;
    const innerR = bezel > 0 ? Math.max(0, cornerRadius - bezel) * exportScale : cornerRadius * exportScale;

    if (state.sourceImage) {
      tctx.save();
      roundRect(tctx, imgX, imgY, imgW, imgH, innerR);
      tctx.clip();
      tctx.drawImage(state.sourceImage, imgX, imgY, imgW, imgH);
      tctx.restore();
    } else {
      roundRect(tctx, imgX, imgY, imgW, imgH, innerR);
      tctx.fillStyle = '#202020';
      tctx.fill();
    }

    // Gloss overlay (highlights)
    if (glossIntensity > 0) {
      tctx.save();
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.clip();
      const rad = (glossAngle * Math.PI) / 180;
      const cx = texW / 2, cy = texH / 2;
      const diag = Math.hypot(texW, texH) / 2;
      const gc = hexToRgb(glossColor);
      const grad = tctx.createLinearGradient(
        cx - Math.cos(rad) * diag, cy - Math.sin(rad) * diag,
        cx + Math.cos(rad) * diag, cy + Math.sin(rad) * diag
      );
      grad.addColorStop(0, `rgba(${gc},${glossIntensity * 0.8})`);
      grad.addColorStop(0.4, `rgba(${gc},${glossIntensity * 0.15})`);
      grad.addColorStop(0.6, `rgba(0,0,0,0)`);
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, texW, texH);
      tctx.restore();
    }

    // Inner shadow overlay (shading — opposite of gloss)
    if (innerShadowIntensity > 0) {
      tctx.save();
      roundRect(tctx, 0, 0, texW, texH, cornerRadius * exportScale);
      tctx.clip();
      const rad = (innerShadowAngle * Math.PI) / 180;
      const cx = texW / 2, cy = texH / 2;
      const diag = Math.hypot(texW, texH) / 2;
      const isc = hexToRgb(innerShadowColor);
      const grad = tctx.createLinearGradient(
        cx - Math.cos(rad) * diag, cy - Math.sin(rad) * diag,
        cx + Math.cos(rad) * diag, cy + Math.sin(rad) * diag
      );
      grad.addColorStop(0, `rgba(0,0,0,0)`);
      grad.addColorStop(0.4, `rgba(${isc},${innerShadowIntensity * 0.15})`);
      grad.addColorStop(1, `rgba(${isc},${innerShadowIntensity * 0.7})`);
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, texW, texH);
      tctx.restore();
    }

    // Alpha mask the rounded rect
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = texW;
    maskCanvas.height = texH;
    const mctx = maskCanvas.getContext('2d');
    roundRect(mctx, 0, 0, texW, texH, cornerRadius * exportScale);
    mctx.fillStyle = '#fff';
    mctx.fill();
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(maskCanvas, 0, 0);
    tctx.globalCompositeOperation = 'source-over';

    // --- Three.js scene ---
    // Add enough padding for drop shadow
    const padX = (Math.abs(shadowOffsetX) + shadowBlur + Math.abs(shadowSpread)) * exportScale + 60 * exportScale;
    const padY = (Math.abs(shadowOffsetY) + shadowBlur + Math.abs(shadowSpread)) * exportScale + 60 * exportScale;
    const viewW = Math.ceil(totalW * scale * exportScale + padX * 2);
    const viewH = Math.ceil(totalH * scale * exportScale + padY * 2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(viewW, viewH);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    if (bgMode === 'color') {
      renderer.setClearColor(new THREE.Color(bgColor), 1);
    } else if (bgMode === 'greenscreen') {
      renderer.setClearColor(0x00FF00, 1);
    }

    const threeScene = new THREE.Scene();

    let camera;
    if (ortho) {
      const aspect = viewW / viewH;
      const halfH = viewH / 2;
      camera = new THREE.OrthographicCamera(-halfH * aspect, halfH * aspect, halfH, -halfH, 0.1, 10000);
      camera.position.set(0, 0, 1000);
    } else {
      const fovRad = 2 * Math.atan((viewH / 2) / (perspDist * exportScale));
      const fovDeg = (fovRad * 180) / Math.PI;
      camera = new THREE.PerspectiveCamera(fovDeg, viewW / viewH, 0.1, 10000);
      camera.position.set(0, 0, perspDist * exportScale);
    }
    camera.lookAt(0, 0, 0);

    // --- Drop shadow: render as a blurred rectangle behind the screen ---
    if (shadowIntensity > 0) {
      const sSW = texW + shadowSpread * 2 * exportScale;
      const sSH = texH + shadowSpread * 2 * exportScale;
      const shadowCanvas = document.createElement('canvas');
      const sBlur = shadowBlur * exportScale;
      // Canvas needs extra room for blur
      const sCanvW = Math.ceil(sSW + sBlur * 4);
      const sCanvH = Math.ceil(sSH + sBlur * 4);
      shadowCanvas.width = sCanvW;
      shadowCanvas.height = sCanvH;
      const sctx = shadowCanvas.getContext('2d');

      // Draw a rounded rect for the shadow shape, blurred
      sctx.filter = `blur(${sBlur}px)`;
      const scRgb = hexToRgb(shadowColor);
      sctx.fillStyle = `rgba(${scRgb},${shadowIntensity})`;
      const sRx = (sCanvW - sSW) / 2;
      const sRy = (sCanvH - sSH) / 2;
      roundRect(sctx, sRx, sRy, sSW, sSH, cornerRadius * exportScale);
      sctx.fill();
      sctx.filter = 'none';

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      shadowTex.minFilter = THREE.LinearFilter;
      const shadowGeo = new THREE.PlaneGeometry(sCanvW, sCanvH);
      const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);

      // Position: offset relative to screen center, slightly behind
      shadowMesh.position.set(
        shadowOffsetX * exportScale * scale,
        -shadowOffsetY * exportScale * scale,
        -1
      );
      shadowMesh.scale.set(scale, scale, 1);
      shadowMesh.renderOrder = -1;
      threeScene.add(shadowMesh);
    }

    // --- Screen plane ---
    const tex = new THREE.CanvasTexture(texCanvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(texW, texH);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.rotation.x = -(rotX * Math.PI) / 180;
    mesh.rotation.y = (rotY * Math.PI) / 180;
    mesh.scale.set(scale, scale, scale);

    threeScene.add(mesh);

    renderer.render(threeScene, camera);
    const outCanvas = renderer.domElement;

    renderer.dispose();
    tex.dispose();
    mat.dispose();
    geo.dispose();

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
    return {
      rotX: rxOverride != null ? rxOverride : +cRotX.value,
      rotY: ryOverride != null ? ryOverride : +cRotY.value,
      perspDist: +cPerspective.value,
      scale: scaleOverride != null ? scaleOverride : +cScale.value / 100,
      ortho: cOrtho.checked,
      cornerRadius: +cRadius.value,
      bezel: +cBezel.value,
      bezelColor: cBezelColor.value,
      glossIntensity: +cGlossInt.value / 100,
      glossAngle: +cGlossAngle.value,
      glossColor: cGlossColor.value,
      innerShadowIntensity: +cInnerShadowInt.value / 100,
      innerShadowAngle: +cInnerShadowAngle.value,
      innerShadowColor: cInnerShadowColor.value,
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
      imageDataURL: state.imageDataURL,
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

  /** Compute the animated rotation/scale for a given frame. */
  function getAnimFrame(t, mode, rx, ry, s, amp) {
    const angle = t * Math.PI * 2;
    switch (mode) {
      case 'tilt':
        return {
          rx: rx + Math.sin(angle) * (amp / 2),
          ry: ry + Math.cos(angle) * amp,
          s: s,
        };
      case 'float':
        // Float: translateY is baked into rotX offset for 3D export (small approximation)
        // Actually we shift the mesh position in Y
        return {
          rx: rx,
          ry: ry,
          s: s,
          translateY: Math.sin(angle) * amp,
        };
      case 'breathe':
        return {
          rx: rx,
          ry: ry,
          s: s + Math.sin(angle) * (amp * 0.005),
        };
      case 'turntable':
        return {
          rx: rx,
          ry: t * 360,
          s: s,
        };
      default:
        return { rx, ry, s };
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

      // Render first frame to get dimensions
      const frame0 = getAnimFrame(0, mode, rx, ry, s, amp);
      const firstCanvas = renderWithThreeJS(gatherOpts(frame0.rx, frame0.ry, frame0.s));
      const recCanvas = document.createElement('canvas');
      recCanvas.width = firstCanvas.width;
      recCanvas.height = firstCanvas.height;
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

        if (stream.getVideoTracks()[0].requestFrame) {
          stream.getVideoTracks()[0].requestFrame();
        }

        const pct = ((i + 1) / totalFrames) * 100;
        recordProgressFill.style.width = pct + '%';
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
    cRotX.value = D.rotateX; cRotY.value = D.rotateY;
    cPerspective.value = D.perspective; cScale.value = D.scale;
    cMouseCtrl.checked = D.mouseControl; cOrtho.checked = D.orthographic;
    cGlossInt.value = D.glossIntensity; cGlossAngle.value = D.glossAngle;
    cGlossColor.value = D.glossColor; cGlossColorHex.value = D.glossColor;
    cInnerShadowInt.value = D.innerShadowIntensity;
    cInnerShadowAngle.value = D.innerShadowAngle;
    cInnerShadowColor.value = D.innerShadowColor; cInnerShadowColorHex.value = D.innerShadowColor;
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
    btnExportWebm.classList.add('hidden');

    applyAll();
  }

  init();
})();

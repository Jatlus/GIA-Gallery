import { COLOR_PICKER_Z_INDEX } from './constants.js';

const FIELD_SIZE = 240;
const HUE_BAR_WIDTH = 20;
const PANEL_GAP = 8;
const PANEL_PADDING = 14;
const PANEL_WIDTH = 334;
const VIEWPORT_PADDING = 12;

const state = {
  anchorElement: null,
  currentColor: { r: 1, g: 1, b: 1 },
  dragTarget: '',
  fieldCanvas: null,
  hexInput: null,
  hueCanvas: null,
  hsv: { h: 0, s: 0, v: 1 },
  inputsContainer: null,
  isOpen: false,
  mode: 'RGB',
  newPreview: null,
  onChange: null,
  onClose: null,
  panel: null,
  positionAnchorElement: null,
  rgbToggle: null,
  cmykToggle: null,
  currentPreview: null,
};

let documentPointerDownListenerAttached = false;
let windowResizeListenerAttached = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundToInt(value) {
  return Math.round(clamp(value, 0, 1) * 255);
}

function getChannelInputId(channel) {
  return `gia-cp-${channel}`;
}

function normalizeColor(color) {
  return {
    b: clamp(color.b ?? 0, 0, 1),
    g: clamp(color.g ?? 0, 0, 1),
    r: clamp(color.r ?? 0, 0, 1),
  };
}

function rgbToHsv(color) {
  const r = color.r;
  const g = color.g;
  const b = color.b;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;

  if (delta > 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = ((b - r) / delta) + 2;
    } else {
      hue = ((r - g) / delta) + 4;
    }
  }

  hue /= 6;

  if (hue < 0) {
    hue += 1;
  }

  return {
    h: hue,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function hsvToRgb(hsv) {
  const hue = ((hsv.h % 1) + 1) % 1;
  const saturation = clamp(hsv.s, 0, 1);
  const value = clamp(hsv.v, 0, 1);
  const sector = Math.floor(hue * 6);
  const fraction = hue * 6 - sector;
  const p = value * (1 - saturation);
  const q = value * (1 - fraction * saturation);
  const t = value * (1 - (1 - fraction) * saturation);

  switch (sector % 6) {
    case 0:
      return { r: value, g: t, b: p };
    case 1:
      return { r: q, g: value, b: p };
    case 2:
      return { r: p, g: value, b: t };
    case 3:
      return { r: p, g: q, b: value };
    case 4:
      return { r: t, g: p, b: value };
    default:
      return { r: value, g: p, b: q };
  }
}

function rgbToHex(color) {
  return [color.r, color.g, color.b]
    .map(channel => roundToInt(channel).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

function hexToRgb(hexValue) {
  const hex = hexValue.replace(/[^0-9A-F]/gi, '').slice(0, 6);

  if (hex.length !== 6) {
    return null;
  }

  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

function rgbToCmyk(color) {
  const r = clamp(color.r, 0, 1);
  const g = clamp(color.g, 0, 1);
  const b = clamp(color.b, 0, 1);
  const k = 1 - Math.max(r, g, b);

  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }

  const denominator = 1 - k;
  const c = (1 - r - k) / denominator;
  const m = (1 - g - k) / denominator;
  const y = (1 - b - k) / denominator;

  return {
    c: clamp(c, 0, 1),
    k: clamp(k, 0, 1),
    m: clamp(m, 0, 1),
    y: clamp(y, 0, 1),
  };
}

function cmykToRgb(cmyk) {
  const c = clamp(cmyk.c, 0, 1);
  const m = clamp(cmyk.m, 0, 1);
  const y = clamp(cmyk.y, 0, 1);
  const k = clamp(cmyk.k, 0, 1);

  return {
    r: (1 - c) * (1 - k),
    g: (1 - m) * (1 - k),
    b: (1 - y) * (1 - k),
  };
}

function getModeFields() {
  if (state.mode === 'CMYK') {
    return [
      { key: 'c', label: 'C', max: 100 },
      { key: 'm', label: 'M', max: 100 },
      { key: 'y', label: 'Y', max: 100 },
      { key: 'k', label: 'K', max: 100 },
    ];
  }

  return [
    { key: 'r', label: 'R', max: 255 },
    { key: 'g', label: 'G', max: 255 },
    { key: 'b', label: 'B', max: 255 },
  ];
}

function createLabeledInput(labelText, max, channel) {
  const row = document.createElement('label');
  const label = document.createElement('span');
  const input = document.createElement('input');
  const inputId = getChannelInputId(channel);

  row.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'gap:10px',
    'font-size:12px',
    'color:#d7dde8',
  ].join(';');
  label.textContent = `${labelText}:`;
  label.style.minWidth = '18px';
  row.htmlFor = inputId;
  input.id = inputId;
  input.name = inputId;
  input.type = 'number';
  input.min = '0';
  input.max = String(max);
  input.step = '1';
  input.autocomplete = 'off';
  input.style.cssText = [
    'width:74px',
    'padding:5px 6px',
    'border:1px solid #334155',
    'border-radius:8px',
    'background:#0f172a',
    'color:#f8fafc',
  ].join(';');

  row.append(label, input);

  return { input, row };
}

function handleInputKeyDown(event) {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  closeColorPicker();
}

function updateToggleStyles() {
  const toggles = [
    { button: state.rgbToggle, active: state.mode === 'RGB' },
    { button: state.cmykToggle, active: state.mode === 'CMYK' },
  ];

  toggles.forEach(({ button, active }) => {
    button.style.background = active ? '#1d4ed8' : '#111827';
    button.style.borderColor = active ? '#60a5fa' : '#334155';
    button.style.color = active ? '#eff6ff' : '#cbd5e1';
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function rebuildInputs() {
  state.inputsContainer.innerHTML = '';

  getModeFields().forEach(field => {
    const { input, row } = createLabeledInput(field.label, field.max, field.key);

    input.dataset.channel = field.key;
    input.addEventListener('input', handleNumericInput);
    input.addEventListener('keydown', handleInputKeyDown);
    state.inputsContainer.appendChild(row);
  });

  updateToggleStyles();
  syncInputs();
}

function syncInputs() {
  const color = state.currentColor;
  const cmyk = rgbToCmyk(color);

  Array.from(state.inputsContainer.querySelectorAll('input[data-channel]')).forEach(input => {
    const channel = input.dataset.channel;

    if (state.mode === 'RGB') {
      input.value = String(roundToInt(color[channel]));
      return;
    }

    input.value = String(Math.round(clamp(cmyk[channel], 0, 1) * 100));
  });

  state.hexInput.value = rgbToHex(color);
}

function setPreviewColor(preview, color) {
  preview.style.background = `rgb(${roundToInt(color.r)}, ${roundToInt(color.g)}, ${roundToInt(color.b)})`;
}

function drawFieldCanvas() {
  const context = state.fieldCanvas.getContext('2d');
  const hueColor = hsvToRgb({ h: state.hsv.h, s: 1, v: 1 });
  const x = state.hsv.s * FIELD_SIZE;
  const y = (1 - state.hsv.v) * FIELD_SIZE;

  context.clearRect(0, 0, FIELD_SIZE, FIELD_SIZE);
  context.fillStyle = `rgb(${roundToInt(hueColor.r)}, ${roundToInt(hueColor.g)}, ${roundToInt(hueColor.b)})`;
  context.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE);

  const whiteGradient = context.createLinearGradient(0, 0, FIELD_SIZE, 0);

  whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  whiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = whiteGradient;
  context.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE);

  const blackGradient = context.createLinearGradient(0, 0, 0, FIELD_SIZE);

  blackGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  blackGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
  context.fillStyle = blackGradient;
  context.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE);

  context.beginPath();
  context.arc(x, y, 6, 0, Math.PI * 2);
  context.lineWidth = 2;
  context.strokeStyle = '#ffffff';
  context.stroke();
  context.beginPath();
  context.arc(x, y, 7.5, 0, Math.PI * 2);
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(15, 23, 42, 0.9)';
  context.stroke();
}

function drawHueCanvas() {
  const context = state.hueCanvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, FIELD_SIZE);
  const y = state.hsv.h * FIELD_SIZE;

  gradient.addColorStop(0.0, '#ff0000');
  gradient.addColorStop(1 / 6, '#ffff00');
  gradient.addColorStop(2 / 6, '#00ff00');
  gradient.addColorStop(3 / 6, '#00ffff');
  gradient.addColorStop(4 / 6, '#0000ff');
  gradient.addColorStop(5 / 6, '#ff00ff');
  gradient.addColorStop(1.0, '#ff0000');

  context.clearRect(0, 0, HUE_BAR_WIDTH, FIELD_SIZE);
  context.fillStyle = gradient;
  context.fillRect(0, 0, HUE_BAR_WIDTH, FIELD_SIZE);

  context.beginPath();
  context.moveTo(0, y);
  context.lineTo(8, y - 6);
  context.lineTo(8, y + 6);
  context.closePath();
  context.fillStyle = '#f8fafc';
  context.fill();

  context.beginPath();
  context.moveTo(HUE_BAR_WIDTH, y);
  context.lineTo(HUE_BAR_WIDTH - 8, y - 6);
  context.lineTo(HUE_BAR_WIDTH - 8, y + 6);
  context.closePath();
  context.fillStyle = '#0f172a';
  context.fill();
}

function refreshPickerUi() {
  drawFieldCanvas();
  drawHueCanvas();
  setPreviewColor(state.newPreview, state.currentColor);
  syncInputs();
}

function applyColor(color) {
  state.currentColor = normalizeColor(color);
  state.hsv = rgbToHsv(state.currentColor);
  refreshPickerUi();
  state.onChange?.({ ...state.currentColor });
}

function handleNumericInput() {
  const inputValues = Object.fromEntries(
    Array.from(state.inputsContainer.querySelectorAll('input[data-channel]')).map(input => [
      input.dataset.channel,
      Number.parseFloat(input.value),
    ]),
  );

  if (state.mode === 'RGB') {
    applyColor({
      r: clamp(Number.isFinite(inputValues.r) ? inputValues.r : 0, 0, 255) / 255,
      g: clamp(Number.isFinite(inputValues.g) ? inputValues.g : 0, 0, 255) / 255,
      b: clamp(Number.isFinite(inputValues.b) ? inputValues.b : 0, 0, 255) / 255,
    });
    return;
  }

  applyColor(cmykToRgb({
    c: clamp(Number.isFinite(inputValues.c) ? inputValues.c : 0, 0, 100) / 100,
    m: clamp(Number.isFinite(inputValues.m) ? inputValues.m : 0, 0, 100) / 100,
    y: clamp(Number.isFinite(inputValues.y) ? inputValues.y : 0, 0, 100) / 100,
    k: clamp(Number.isFinite(inputValues.k) ? inputValues.k : 0, 0, 100) / 100,
  }));
}

function handleHexInput() {
  const sanitized = state.hexInput.value.replace(/[^0-9A-F]/gi, '').slice(0, 6).toUpperCase();

  state.hexInput.value = sanitized;

  const nextColor = hexToRgb(sanitized);

  if (nextColor) {
    applyColor(nextColor);
  }
}

function updateFieldFromPointer(clientX, clientY) {
  const rect = state.fieldCanvas.getBoundingClientRect();
  const saturation = clamp((clientX - rect.left) / rect.width, 0, 1);
  const value = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);

  applyColor(hsvToRgb({ h: state.hsv.h, s: saturation, v: value }));
}

function updateHueFromPointer(clientY) {
  const rect = state.hueCanvas.getBoundingClientRect();
  const hue = clamp((clientY - rect.top) / rect.height, 0, 1);

  applyColor(hsvToRgb({ h: hue, s: state.hsv.s, v: state.hsv.v }));
}

function handlePointerMove(event) {
  if (state.dragTarget === 'field') {
    updateFieldFromPointer(event.clientX, event.clientY);
    return;
  }

  if (state.dragTarget === 'hue') {
    updateHueFromPointer(event.clientY);
  }
}

function stopDragging() {
  state.dragTarget = '';
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', stopDragging);
}

function startDragging(target, event) {
  event.preventDefault();
  state.dragTarget = target;
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopDragging);

  if (target === 'field') {
    updateFieldFromPointer(event.clientX, event.clientY);
    return;
  }

  updateHueFromPointer(event.clientY);
}

function positionPanel() {
  if (!state.anchorElement || !state.panel) {
    return;
  }

  const positionAnchor = state.positionAnchorElement ?? state.anchorElement;
  const guiRoot = positionAnchor.closest('.lil-gui');
  const guiBounds = guiRoot?.getBoundingClientRect() ?? positionAnchor.getBoundingClientRect();
  const panelRect = state.panel.getBoundingClientRect();
  const maxRight = Math.max(
    VIEWPORT_PADDING,
    window.innerWidth - VIEWPORT_PADDING - panelRect.width,
  );
  const right = clamp(window.innerWidth - guiBounds.left + PANEL_GAP, VIEWPORT_PADDING, maxRight);
  const maxTop = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - VIEWPORT_PADDING - panelRect.height,
  );
  const top = clamp(guiBounds.top, VIEWPORT_PADDING, maxTop);

  state.panel.style.left = 'auto';
  state.panel.style.right = `${right}px`;
  state.panel.style.top = `${top}px`;
}

function handleDocumentPointerDown(event) {
  const target = event.target;

  if (!(target instanceof Node)) {
    return;
  }

  if (state.panel?.contains(target) || state.anchorElement?.contains(target)) {
    return;
  }

  closeColorPicker();
}

function ensureGlobalListeners() {
  if (!documentPointerDownListenerAttached) {
    document.addEventListener('mousedown', handleDocumentPointerDown);
    documentPointerDownListenerAttached = true;
  }

  if (!windowResizeListenerAttached) {
    window.addEventListener('resize', positionPanel);
    windowResizeListenerAttached = true;
  }
}

function ensurePanel() {
  if (state.panel) {
    return;
  }

  const panel = document.createElement('div');
  const canvases = document.createElement('div');
  const fieldCanvas = document.createElement('canvas');
  const hueCanvas = document.createElement('canvas');
  const previewRow = document.createElement('div');
  const currentPreviewWrap = document.createElement('div');
  const currentPreview = document.createElement('div');
  const newPreviewWrap = document.createElement('div');
  const newPreview = document.createElement('div');
  const modeGroup = document.createElement('div');
  const rgbToggle = document.createElement('button');
  const cmykToggle = document.createElement('button');
  const inputsContainer = document.createElement('div');
  const hexRow = document.createElement('label');
  const hexLabel = document.createElement('span');
  const hexInput = document.createElement('input');

  panel.id = 'gia-color-picker';
  panel.hidden = true;
  panel.style.cssText = [
    'position:fixed',
    `width:${PANEL_WIDTH}px`,
    `padding:${PANEL_PADDING}px`,
    'border:1px solid rgba(148, 163, 184, 0.35)',
    'border-radius:16px',
    'background:linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(9, 14, 26, 0.98))',
    'box-shadow:0 24px 50px rgba(2, 6, 23, 0.5)',
    'backdrop-filter:blur(12px)',
    `z-index:${COLOR_PICKER_Z_INDEX}`,
    'max-height:80vh',
    'overflow-y:auto',
    'font-family:"Trebuchet MS", "Segoe UI", sans-serif',
  ].join(';');

  canvases.style.cssText = [
    'display:flex',
    'gap:12px',
    'align-items:flex-start',
    'margin-bottom:14px',
  ].join(';');

  fieldCanvas.width = FIELD_SIZE;
  fieldCanvas.height = FIELD_SIZE;
  fieldCanvas.style.cssText = [
    'width:240px',
    'height:240px',
    'border-radius:14px',
    'border:1px solid rgba(148, 163, 184, 0.2)',
    'cursor:crosshair',
  ].join(';');
  hueCanvas.width = HUE_BAR_WIDTH;
  hueCanvas.height = FIELD_SIZE;
  hueCanvas.style.cssText = [
    'width:20px',
    'height:240px',
    'border-radius:14px',
    'border:1px solid rgba(148, 163, 184, 0.2)',
    'cursor:ns-resize',
  ].join(';');
  fieldCanvas.addEventListener('pointerdown', event => startDragging('field', event));
  hueCanvas.addEventListener('pointerdown', event => startDragging('hue', event));

  const previewTextStyle = [
    'font-size:10px',
    'letter-spacing:0.06em',
    'text-transform:uppercase',
    'color:#94a3b8',
    'margin-bottom:6px',
  ].join(';');
  const previewBoxStyle = [
    'width:40px',
    'height:40px',
    'border-radius:10px',
    'border:1px solid rgba(148, 163, 184, 0.35)',
    'box-shadow:inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
  ].join(';');

  currentPreviewWrap.innerHTML = `<div style="${previewTextStyle}">Current</div>`;
  currentPreview.style.cssText = previewBoxStyle;
  currentPreviewWrap.appendChild(currentPreview);
  newPreviewWrap.innerHTML = `<div style="${previewTextStyle}">New</div>`;
  newPreview.style.cssText = previewBoxStyle;
  newPreviewWrap.appendChild(newPreview);

  previewRow.style.cssText = [
    'display:flex',
    'align-items:flex-end',
    'justify-content:space-between',
    'gap:12px',
    'margin-bottom:14px',
  ].join(';');

  modeGroup.style.cssText = [
    'display:flex',
    'gap:8px',
    'margin-left:auto',
  ].join(';');

  [rgbToggle, cmykToggle].forEach(button => {
    button.type = 'button';
    button.style.cssText = [
      'padding:6px 10px',
      'border:1px solid #334155',
      'border-radius:999px',
      'background:#111827',
      'cursor:pointer',
      'font-size:11px',
      'letter-spacing:0.04em',
      'text-transform:uppercase',
    ].join(';');
  });
  rgbToggle.textContent = 'RGB';
  cmykToggle.textContent = 'CMYK';
  rgbToggle.addEventListener('click', () => {
    state.mode = 'RGB';
    rebuildInputs();
  });
  cmykToggle.addEventListener('click', () => {
    state.mode = 'CMYK';
    rebuildInputs();
  });
  modeGroup.append(rgbToggle, cmykToggle);

  inputsContainer.style.cssText = [
    'display:grid',
    'grid-template-columns:repeat(2, minmax(0, 1fr))',
    'gap:10px 12px',
    'margin-bottom:14px',
  ].join(';');

  hexRow.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:10px',
    'font-size:12px',
    'color:#d7dde8',
  ].join(';');
  hexLabel.textContent = '#';
  hexLabel.style.fontSize = '15px';
  hexRow.htmlFor = 'gia-cp-hex';
  hexInput.id = 'gia-cp-hex';
  hexInput.name = 'gia-cp-hex';
  hexInput.type = 'text';
  hexInput.maxLength = 6;
  hexInput.autocomplete = 'off';
  hexInput.spellcheck = false;
  hexInput.style.cssText = [
    'flex:1',
    'padding:6px 8px',
    'border:1px solid #334155',
    'border-radius:8px',
    'background:#0f172a',
    'color:#f8fafc',
    'letter-spacing:0.08em',
    'text-transform:uppercase',
  ].join(';');
  hexInput.addEventListener('input', handleHexInput);
  hexInput.addEventListener('keydown', handleInputKeyDown);
  hexRow.append(hexLabel, hexInput);

  canvases.append(fieldCanvas, hueCanvas);
  previewRow.append(currentPreviewWrap, newPreviewWrap, modeGroup);
  panel.append(canvases, previewRow, inputsContainer, hexRow);
  document.body.appendChild(panel);

  state.panel = panel;
  state.fieldCanvas = fieldCanvas;
  state.hueCanvas = hueCanvas;
  state.inputsContainer = inputsContainer;
  state.hexInput = hexInput;
  state.currentPreview = currentPreview;
  state.newPreview = newPreview;
  state.rgbToggle = rgbToggle;
  state.cmykToggle = cmykToggle;

  ensureGlobalListeners();
}

export function openColorPicker(anchorElement, currentColor, onChange, options = {}) {
  ensurePanel();

  state.anchorElement = anchorElement;
  state.positionAnchorElement = options.positionAnchorElement ?? null;
  state.onChange = onChange;
  state.onClose = options.onClose ?? null;
  state.currentColor = normalizeColor(currentColor);
  state.hsv = rgbToHsv(state.currentColor);
  state.mode = 'RGB';
  state.isOpen = true;
  setPreviewColor(state.currentPreview, state.currentColor);
  rebuildInputs();
  refreshPickerUi();
  state.panel.hidden = false;
  state.panel.style.visibility = 'hidden';
  positionPanel();
  state.panel.style.visibility = '';
}

export function closeColorPicker() {
  if (!state.isOpen) {
    return;
  }

  const onClose = state.onClose;

  if (!state.panel) {
    state.isOpen = false;
    state.onClose = null;
    onClose?.();
    return;
  }

  stopDragging();
  state.isOpen = false;
  state.anchorElement = null;
  state.onChange = null;
  state.onClose = null;
  state.positionAnchorElement = null;
  state.panel.hidden = true;
  state.panel.style.visibility = '';
  onClose?.();
}

export function isColorPickerOpen() {
  return state.isOpen;
}

export function getColorPickerElement() {
  return state.panel;
}

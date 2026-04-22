import {
  COLOR_DEFAULT_B,
  COLOR_DEFAULT_G,
  COLOR_DEFAULT_R,
  GRADIENT_EDITOR_Z_INDEX,
} from './constants.js';
import { closeColorPicker, getColorPickerElement, openColorPicker } from './colorpicker.js';

const BAR_WIDTH = 300;
const BAR_HEIGHT = 28;
const DELETE_THRESHOLD_PX = 20;
const HANDLE_SIZE = 12;
const MIDPOINT_SIZE = 8;
const MIDPOINT_ROW_TOP = 2;
const MIN_STOP_COUNT = 2;
const MOVE_THRESHOLD_PX = 3;
const MIDPOINT_MIN_RATIO = 0.15;
const MIDPOINT_MAX_RATIO = 0.85;
const PANEL_GAP = 8;
const PANEL_MAX_WIDTH = 420;
const PANEL_PADDING_X = 20;
const STOP_HANDLE_GAP = 16;
const TRACK_BAR_TOP = MIDPOINT_SIZE + 4;
const TRACK_HEIGHT = TRACK_BAR_TOP + BAR_HEIGHT + STOP_HANDLE_GAP + HANDLE_SIZE;
const VIEWPORT_PADDING = 10;
const DEFAULT_SINGLE_COLOR = {
  b: COLOR_DEFAULT_B,
  g: COLOR_DEFAULT_G,
  r: COLOR_DEFAULT_R,
};
const DEFAULT_STOPS = [
  { position: 0.00, color: { r: 1.00, g: 0.00, b: 0.00 } },
  { position: 0.17, color: { r: 1.00, g: 0.50, b: 0.00 } },
  { position: 0.33, color: { r: 1.00, g: 1.00, b: 0.00 } },
  { position: 0.50, color: { r: 0.00, g: 1.00, b: 0.00 } },
  { position: 0.67, color: { r: 0.00, g: 1.00, b: 1.00 } },
  { position: 0.83, color: { r: 0.00, g: 0.00, b: 1.00 } },
  { position: 1.00, color: { r: 0.60, g: 0.00, b: 1.00 } },
];

const state = {
  anchorElement: null,
  barCanvas: null,
  callbacks: {
    onEditorClose: null,
    onEditorOpen: null,
    onStopColorPickerClose: null,
    onStopColorPickerOpen: null,
  },
  handlesLayer: null,
  onChange: null,
  panel: null,
  track: null,
  singleColor: { ...DEFAULT_SINGLE_COLOR },
  stops: [],
  midpoints: [],
};

let activeDrag = null;
let documentPointerDownListenerAttached = false;
let nextStopId = 0;
let nextMidpointId = 0;
let windowResizeListenerAttached = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cloneColor(color) {
  return {
    b: clamp(color.b ?? 0, 0, 1),
    g: clamp(color.g ?? 0, 0, 1),
    r: clamp(color.r ?? 0, 0, 1),
  };
}

function lerp(start, end, t) {
  return start + ((end - start) * t);
}

function colorToCss(color) {
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

function getBarWidth() {
  return state.barCanvas?.width ?? BAR_WIDTH;
}

function createStop(stop) {
  return {
    color: cloneColor(stop.color),
    id: `gia-gradient-stop-${nextStopId += 1}`,
    position: clamp(stop.position ?? 0, 0, 1),
  };
}

function createDefaultStops() {
  return DEFAULT_STOPS.map(createStop);
}

function sortStops() {
  state.stops.sort((left, right) => left.position - right.position);
}

function findStop(stopId) {
  return state.stops.find(stop => stop.id === stopId) ?? null;
}

function findMidpoint(midpointId) {
  return state.midpoints.find(midpoint => midpoint.id === midpointId) ?? null;
}

function getStopPairForMidpoint(midpoint) {
  if (!midpoint) {
    return null;
  }

  const left = findStop(midpoint.leftStopId);
  const right = findStop(midpoint.rightStopId);

  if (!left || !right) {
    return null;
  }

  return { left, right };
}

function getMidpointRatio(midpoint) {
  return clamp(midpoint?.ratio ?? 0.5, MIDPOINT_MIN_RATIO, MIDPOINT_MAX_RATIO);
}

function getMidpointPosition(midpoint) {
  const pair = getStopPairForMidpoint(midpoint);

  if (!pair) {
    return 0.5;
  }

  return lerp(pair.left.position, pair.right.position, getMidpointRatio(midpoint));
}

function rebuildMidpoints() {
  sortStops();
  const existingMidpoints = new Map(
    state.midpoints.map(midpoint => [
      `${midpoint.leftStopId}|${midpoint.rightStopId}`,
      midpoint,
    ]),
  );

  state.midpoints = [];

  for (let index = 0; index < state.stops.length - 1; index += 1) {
    const left = state.stops[index];
    const right = state.stops[index + 1];
    const key = `${left.id}|${right.id}`;
    const existing = existingMidpoints.get(key);

    state.midpoints.push(existing ?? {
      id: `gia-gradient-midpoint-${nextMidpointId += 1}`,
      leftStopId: left.id,
      rightStopId: right.id,
      ratio: 0.5,
    });
  }
}

function getBiasExponent(midpointRatio) {
  const safeRatio = clamp(midpointRatio, MIDPOINT_MIN_RATIO, MIDPOINT_MAX_RATIO);

  return Math.log(0.5) / Math.log(safeRatio);
}

function getSegmentAtPosition(position) {
  sortStops();

  if (state.stops.length === 0) {
    return null;
  }

  if (position <= state.stops[0].position) {
    return { left: state.stops[0], right: state.stops[0], midpoint: null };
  }

  const lastStop = state.stops[state.stops.length - 1];

  if (position >= lastStop.position) {
    return { left: lastStop, right: lastStop, midpoint: null };
  }

  for (let index = 0; index < state.stops.length - 1; index += 1) {
    const left = state.stops[index];
    const right = state.stops[index + 1];

    if (position >= left.position && position <= right.position) {
      return {
        left,
        right,
        midpoint: state.midpoints.find(candidate => (
          candidate.leftStopId === left.id && candidate.rightStopId === right.id
        )) ?? null,
      };
    }
  }

  return { left: lastStop, right: lastStop, midpoint: null };
}

function notifyChange() {
  state.onChange?.(getColorAtPosition);
}

function drawGradientBar() {
  if (!state.barCanvas) {
    return;
  }

  const barWidth = getBarWidth();
  const context = state.barCanvas.getContext('2d');

  context.clearRect(0, 0, barWidth, BAR_HEIGHT);

  for (let column = 0; column < barWidth; column += 1) {
    const position = barWidth > 1 ? column / (barWidth - 1) : 0;
    const color = getColorAtPosition(position);

    context.fillStyle = colorToCss(color);
    context.fillRect(column, 0, 1, BAR_HEIGHT);
  }

  context.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, barWidth - 1, BAR_HEIGHT - 1);
}

function getStopHandleElement(stopId) {
  return state.handlesLayer?.querySelector(`[data-stop-id="${stopId}"]`) ?? null;
}

function renderHandles() {
  if (!state.handlesLayer) {
    return;
  }

  const barWidth = getBarWidth();
  state.handlesLayer.replaceChildren();

  state.midpoints.forEach(midpoint => {
    const midpointHandle = document.createElement('div');
    const midpointPosition = getMidpointPosition(midpoint);

    midpointHandle.dataset.midpointId = midpoint.id;
    midpointHandle.style.cssText = [
      'position:absolute',
      `left:${midpointPosition * barWidth - (MIDPOINT_SIZE * 0.5)}px`,
      `top:${MIDPOINT_ROW_TOP}px`,
      `width:${MIDPOINT_SIZE}px`,
      `height:${MIDPOINT_SIZE}px`,
      'border:1px solid rgba(241, 245, 249, 0.8)',
      'background:#0f172a',
      'transform:rotate(45deg)',
      'cursor:ew-resize',
      'box-sizing:border-box',
      'border-radius:1px',
      'pointer-events:auto',
    ].join(';');
    midpointHandle.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      activeDrag = {
        handleId: midpoint.id,
        kind: 'midpoint',
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    });
    state.handlesLayer.appendChild(midpointHandle);
  });

  state.stops.forEach(stop => {
    const stopHandle = document.createElement('button');

    stopHandle.type = 'button';
    stopHandle.dataset.stopId = stop.id;
    stopHandle.style.cssText = [
      'position:absolute',
      `left:${stop.position * barWidth - (HANDLE_SIZE * 0.5)}px`,
      `top:${TRACK_BAR_TOP + BAR_HEIGHT + STOP_HANDLE_GAP}px`,
      `width:${HANDLE_SIZE}px`,
      `height:${HANDLE_SIZE}px`,
      'padding:0',
      'border:1px solid rgba(255, 255, 255, 0.5)',
      'border-radius:2px',
      `background:${colorToCss(stop.color)}`,
      'cursor:pointer',
      'box-shadow:0 4px 10px rgba(15, 23, 42, 0.35)',
      'appearance:none',
      'pointer-events:auto',
    ].join(';');
    stopHandle.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      activeDrag = {
        handleId: stop.id,
        kind: 'stop',
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    });
    state.handlesLayer.appendChild(stopHandle);
  });
}

function renderEditor() {
  drawGradientBar();
  renderHandles();
}

function updateStopColor(stopId, color) {
  const stop = findStop(stopId);

  if (!stop) {
    return;
  }

  stop.color = cloneColor(color);
  renderEditor();
  notifyChange();
}

function openStopColorPicker(stopId) {
  const stop = findStop(stopId);
  const anchor = getStopHandleElement(stopId);

  if (!stop || !(anchor instanceof HTMLElement)) {
    return;
  }

  closeColorPicker();
  state.callbacks.onStopColorPickerOpen?.();
  openColorPicker(anchor, stop.color, color => {
    updateStopColor(stopId, color);
  }, {
    onClose: () => {
      state.callbacks.onStopColorPickerClose?.();
    },
    positionAnchorElement: state.panel,
  });
}

function removeStop(stopId) {
  if (state.stops.length <= MIN_STOP_COUNT) {
    return false;
  }

  const stopIndex = state.stops.findIndex(stop => stop.id === stopId);

  if (stopIndex === -1) {
    return false;
  }

  closeColorPicker();
  state.stops.splice(stopIndex, 1);
  rebuildMidpoints();
  renderEditor();
  notifyChange();

  return true;
}

function addStop(position) {
  const nextPosition = clamp(position, 0, 1);
  const nextStop = createStop({
    color: getColorAtPosition(nextPosition),
    position: nextPosition,
  });

  state.stops.push(nextStop);
  rebuildMidpoints();
  renderEditor();
  notifyChange();
}

function updateStopPosition(stopId, clientX) {
  const stop = findStop(stopId);

  if (!stop || !state.barCanvas) {
    return;
  }

  const rect = state.barCanvas.getBoundingClientRect();

  stop.position = clamp((clientX - rect.left) / rect.width, 0, 1);
  rebuildMidpoints();
  renderEditor();
  notifyChange();
}

function updateMidpointPosition(midpointId, clientX) {
  const midpoint = findMidpoint(midpointId);
  const pair = getStopPairForMidpoint(midpoint);

  if (!midpoint || !pair || !state.barCanvas) {
    return;
  }

  const rect = state.barCanvas.getBoundingClientRect();
  const position = clamp((clientX - rect.left) / rect.width, 0, 1);
  const segmentLength = Math.max(pair.right.position - pair.left.position, Number.EPSILON);

  midpoint.ratio = clamp(
    (position - pair.left.position) / segmentLength,
    MIDPOINT_MIN_RATIO,
    MIDPOINT_MAX_RATIO,
  );
  renderEditor();
  notifyChange();
}

function stopDragging() {
  activeDrag = null;
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(event) {
  if (!activeDrag) {
    return;
  }

  if (activeDrag.kind === 'stop') {
    activeDrag.moved = activeDrag.moved || (
      Math.abs(event.clientX - activeDrag.startX) > MOVE_THRESHOLD_PX ||
      Math.abs(event.clientY - activeDrag.startY) > MOVE_THRESHOLD_PX
    );
    updateStopPosition(activeDrag.handleId, event.clientX);
    return;
  }

  updateMidpointPosition(activeDrag.handleId, event.clientX);
}

function handlePointerUp(event) {
  if (!activeDrag) {
    return;
  }

  if (activeDrag.kind === 'stop') {
    if (!activeDrag.moved) {
      openStopColorPicker(activeDrag.handleId);
    } else if (state.barCanvas) {
      const rect = state.barCanvas.getBoundingClientRect();

      if (event.clientY > rect.bottom + DELETE_THRESHOLD_PX) {
        removeStop(activeDrag.handleId);
      }
    }
  }

  stopDragging();
}

function resetGradientState() {
  state.stops = createDefaultStops();
  state.midpoints = [];
  rebuildMidpoints();
}

function updatePanelLayout() {
  if (!state.panel || !state.anchorElement || state.panel.hidden) {
    return;
  }

  const guiBounds = state.anchorElement.getBoundingClientRect();
  const right = window.innerWidth - guiBounds.left + PANEL_GAP;
  const panelWidth = clamp(
    guiBounds.left - PANEL_GAP - (VIEWPORT_PADDING * 2),
    180,
    PANEL_MAX_WIDTH,
  );
  const barWidth = Math.max(120, panelWidth - PANEL_PADDING_X);

  state.panel.style.left = 'auto';
  state.panel.style.right = `${Math.max(VIEWPORT_PADDING, right)}px`;
  state.panel.style.width = `${panelWidth}px`;
  state.panel.style.maxWidth = `${panelWidth}px`;

  if (state.track) {
    state.track.style.width = `${barWidth}px`;
  }

  if (state.barCanvas) {
    state.barCanvas.width = barWidth;
    state.barCanvas.style.width = `${barWidth}px`;
  }

  renderEditor();

  const panelRect = state.panel.getBoundingClientRect();
  const maxTop = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - panelRect.height - VIEWPORT_PADDING,
  );

  state.panel.style.top = `${clamp(guiBounds.top, VIEWPORT_PADDING, maxTop)}px`;
}

function handleDocumentPointerDown(event) {
  const target = event.target;

  if (!(target instanceof Node) || !state.panel || state.panel.hidden) {
    return;
  }

  if (state.panel.contains(target)) {
    return;
  }

  const colorPickerElement = getColorPickerElement();

  if (colorPickerElement?.contains(target)) {
    return;
  }

  closeGradientEditor();
}

function ensureGlobalListeners() {
  if (!documentPointerDownListenerAttached) {
    document.addEventListener('mousedown', handleDocumentPointerDown);
    documentPointerDownListenerAttached = true;
  }

  if (!windowResizeListenerAttached) {
    window.addEventListener('resize', updatePanelLayout);
    windowResizeListenerAttached = true;
  }
}

function ensureEditor(container) {
  state.anchorElement = container;

  if (!state.panel) {
    resetGradientState();
    const panel = document.createElement('div');
    const title = document.createElement('div');
    const track = document.createElement('div');
    const barCanvas = document.createElement('canvas');
    const handlesLayer = document.createElement('div');

    panel.id = 'gia-gradient-editor';
    panel.hidden = true;
    panel.style.cssText = [
      'position:fixed',
      'margin:0',
      'padding:16px 10px 14px',
      'border:1px solid rgba(148, 163, 184, 0.25)',
      'border-radius:12px',
      'background:linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(10, 15, 28, 0.94))',
      `z-index:${GRADIENT_EDITOR_Z_INDEX}`,
      'box-shadow:0 18px 30px rgba(2, 6, 23, 0.3)',
      'max-height:calc(100vh - 20px)',
      'overflow:auto',
    ].join(';');

    title.textContent = 'Gradient';
    title.style.cssText = [
      'font-size:11px',
      'letter-spacing:0.08em',
      'text-transform:uppercase',
      'color:#cbd5e1',
      'margin-bottom:4px',
    ].join(';');

    track.style.cssText = [
      'position:relative',
      `width:${BAR_WIDTH}px`,
      `height:${TRACK_HEIGHT}px`,
      'margin:0 auto',
    ].join(';');

    barCanvas.width = BAR_WIDTH;
    barCanvas.height = BAR_HEIGHT;
    barCanvas.style.cssText = [
      'position:absolute',
      'left:0',
      `top:${TRACK_BAR_TOP}px`,
      `width:${BAR_WIDTH}px`,
      `height:${BAR_HEIGHT}px`,
      'border-radius:6px',
      'cursor:copy',
    ].join(';');
    barCanvas.addEventListener('click', event => {
      const rect = barCanvas.getBoundingClientRect();
      const position = clamp((event.clientX - rect.left) / rect.width, 0, 1);

      addStop(position);
    });

    handlesLayer.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
    ].join(';');

    track.append(barCanvas, handlesLayer);
    panel.append(title, track);
    document.body.appendChild(panel);

    state.panel = panel;
    state.barCanvas = barCanvas;
    state.handlesLayer = handlesLayer;
    state.track = track;
    ensureGlobalListeners();
    renderEditor();
  } else if (state.panel.parentElement !== document.body) {
    document.body.appendChild(state.panel);
  }
}

export function createGradientEditor(container, onChange, options = {}) {
  ensureEditor(container);
  state.onChange = onChange;
  state.callbacks = {
    ...state.callbacks,
    ...options,
  };
  renderEditor();

  return state.panel;
}

export function getColorAtPosition(t) {
  const position = clamp(t, 0, 1);
  const segment = getSegmentAtPosition(position);

  if (!segment) {
    return { ...DEFAULT_SINGLE_COLOR };
  }

  if (segment.left.id === segment.right.id) {
    return cloneColor(segment.left.color);
  }

  const span = Math.max(segment.right.position - segment.left.position, Number.EPSILON);
  const localT = clamp((position - segment.left.position) / span, 0, 1);
  const adjustedT = Math.pow(localT, getBiasExponent(getMidpointRatio(segment.midpoint)));

  return {
    b: lerp(segment.left.color.b, segment.right.color.b, adjustedT),
    g: lerp(segment.left.color.g, segment.right.color.g, adjustedT),
    r: lerp(segment.left.color.r, segment.right.color.r, adjustedT),
  };
}

export function setGradientVisible(visible) {
  if (!state.panel) {
    return;
  }

  if (!visible) {
    closeGradientEditor();
    return;
  }

  const wasHidden = state.panel.hidden;
  state.panel.hidden = false;
  updatePanelLayout();

  if (wasHidden) {
    state.callbacks.onEditorOpen?.();
  }
}

export function closeGradientEditor() {
  if (!state.panel) {
    return;
  }

  const wasOpen = !state.panel.hidden;

  closeColorPicker();
  stopDragging();

  if (!wasOpen) {
    return;
  }

  state.panel.hidden = true;
  state.callbacks.onEditorClose?.();
}

export function isGradientEditorOpen() {
  return Boolean(state.panel && !state.panel.hidden);
}

export function getGradientEditorElement() {
  return state.panel;
}

export function getCurrentSingleColor() {
  return cloneColor(state.singleColor);
}

export function setCurrentSingleColor(color) {
  state.singleColor = cloneColor(color);
}

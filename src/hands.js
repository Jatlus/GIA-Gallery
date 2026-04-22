import * as THREE from 'three';

import {
  DEBUG_CANVAS_Z_INDEX,
  GESTURE_CAMERA_MODE_EXIT_LABEL,
  DEBUG_LANDMARK_RADIUS,
  GESTURE_CAMERA_MODE_LABEL,
  GESTURE_INDICATOR_FILL_COLOR,
  GESTURE_INDICATOR_LINE_WIDTH,
  GESTURE_INDICATOR_RADIUS,
  GESTURE_INDICATOR_RING_COLOR,
  GESTURE_OPEN_PALM_THRESHOLD,
  GESTURE_ORBIT_DASH_GAP,
  GESTURE_ORBIT_DASH_LENGTH,
  PINCH_DETECTION_THRESHOLD,
  PINCH_EXTENDED_FINGER_THRESHOLD,
  GESTURE_SYMBOL_COLOR,
  GESTURE_SYMBOL_FONT_SIZE,
  GESTURE_SYMBOL_MARGIN,
  GESTURE_ZOOM_OUT_SYMBOL,
  HAND_MODEL_COMPLEXITY,
  MAX_NUM_HANDS,
  MIN_DETECTION_CONFIDENCE,
  MIN_TRACKING_CONFIDENCE,
  PINCH_CLOSED,
  PINCH_ACTIVE_THRESHOLD,
  PINCH_OPEN,
  SCALE_GESTURE_ARROW_LENGTH,
  SCALE_GESTURE_ARROW_WIDTH,
} from './constants.js';

// Lazily created — only added to the DOM when webcam mode is first activated.
// Previously these were created at module load time, causing an unstyled
// 300×150 black canvas to appear in the corner when in Mouse mode.
let debugCanvas = null;
let debugCtx = null;
const HANDS_OPTIONS = Object.freeze({
  maxNumHands: MAX_NUM_HANDS,
  modelComplexity: HAND_MODEL_COMPLEXITY,
  minDetectionConfidence: MIN_DETECTION_CONFIDENCE,
  minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
});
let hands = null;
let handsGeneration = 0;
let debugCanvasReady = false;
let lastHandResultsAt = 0;

export const handState = [0, 1].map(() => ({
  active: false,
  rawNDC: new THREE.Vector2(),
  smoothedNDC: new THREE.Vector2(),
  pinchStrength: 0,
  surfaceHit: false,
  uv: new THREE.Vector2(),
  hitPoint: new THREE.Vector3(),
  assignmentKey: '',
}));

export const gestureState = [0, 1].map(() => ({
  active: false,
  fist: false,
  openPalm: false,
  palmNDC: new THREE.Vector2(),
  prevPalmNDC: new THREE.Vector2(),
  openPalmFrames: 0,
}));

const scaleGestureIndicator = {
  active: false,
  start: new THREE.Vector2(),
  end: new THREE.Vector2(),
};
const gestureCameraFeedback = {
  cameraModeActive: false,
  zoomInActive: false,
  zoomOutActive: false,
  exitIndicatorFrames: 0,
  orbitActive: false,
  orbitStartNDC: new THREE.Vector2(),
  orbitEndNDC: new THREE.Vector2(),
};
const tempGestureScreenPoint = new THREE.Vector2();
const tempOrbitStartScreen = new THREE.Vector2();
const tempOrbitEndScreen = new THREE.Vector2();
const RESTORED_ITERATION4_FIST_DISTANCE_THRESHOLD = 0.2;
const RESTORED_ITERATION4_FIST_TIP_INDICES = [4, 8, 12, 16, 20];

function syncDebugCanvasSize() {
  debugCanvas.width = window.innerWidth;
  debugCanvas.height = window.innerHeight;
}

function ensureDebugCanvas() {
  if (debugCanvasReady) {
    return;
  }

  debugCanvas = document.createElement('canvas');
  debugCtx = debugCanvas.getContext('2d');

  Object.assign(debugCanvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: String(DEBUG_CANVAS_Z_INDEX),
    transform: 'scaleX(-1)',
  });

  syncDebugCanvasSize();
  document.body.appendChild(debugCanvas);
  window.addEventListener('resize', syncDebugCanvasSize);
  debugCanvasReady = true;
}

function clearDebugCanvas() {
  debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
}

function screenXToCanvasX(screenX) {
  return debugCanvas.width - screenX;
}

function ndcToScreen(ndc, target) {
  target.set(
    (ndc.x * 0.5 + 0.5) * debugCanvas.width,
    (1.0 - (ndc.y * 0.5 + 0.5)) * debugCanvas.height,
  );
}

function resetHandSlot(hand) {
  hand.active = false;
  hand.pinchStrength = 0;
  hand.surfaceHit = false;
  hand.assignmentKey = '';
}

function resetGestureSlot(gesture) {
  gesture.active = false;
  gesture.fist = false;
  gesture.openPalm = false;
  gesture.palmNDC.set(0, 0);
  gesture.prevPalmNDC.set(0, 0);
  gesture.openPalmFrames = 0;
}

function resetGestureCameraFeedback() {
  gestureCameraFeedback.cameraModeActive = false;
  gestureCameraFeedback.zoomInActive = false;
  gestureCameraFeedback.zoomOutActive = false;
  gestureCameraFeedback.exitIndicatorFrames = 0;
  gestureCameraFeedback.orbitActive = false;
  gestureCameraFeedback.orbitStartNDC.set(0, 0);
  gestureCameraFeedback.orbitEndNDC.set(0, 0);
}

function getDistanceToWrist(landmarks, index) {
  const wrist = landmarks[0];
  const tip = landmarks[index];

  return Math.hypot(
    tip.x - wrist.x,
    tip.y - wrist.y,
    (tip.z ?? 0) - (wrist.z ?? 0),
  );
}

function getDistanceBetweenLandmarks(landmarks, fromIndex, toIndex) {
  const from = landmarks[fromIndex];
  const to = landmarks[toIndex];

  return Math.hypot(
    from.x - to.x,
    from.y - to.y,
    (from.z ?? 0) - (to.z ?? 0),
  );
}

function hasExtendedNonPinchFingers(landmarks) {
  return [12, 16, 20].every(index => getDistanceToWrist(landmarks, index) > PINCH_EXTENDED_FINGER_THRESHOLD);
}

function detectPinchPose(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const pinchDistance = Math.hypot(
    thumbTip.x - indexTip.x,
    thumbTip.y - indexTip.y,
    (thumbTip.z ?? 0) - (indexTip.z ?? 0),
  );

  return pinchDistance < PINCH_DETECTION_THRESHOLD && hasExtendedNonPinchFingers(landmarks);
}

export function detectFist(landmarks) {
  return RESTORED_ITERATION4_FIST_TIP_INDICES.every(
    index => getDistanceToWrist(landmarks, index) < RESTORED_ITERATION4_FIST_DISTANCE_THRESHOLD,
  );
}

export function detectOpenPalm(landmarks) {
  return [8, 12, 16, 20].every(index => getDistanceToWrist(landmarks, index) > GESTURE_OPEN_PALM_THRESHOLD);
}

function drawScaleGestureIndicator() {
  if (!scaleGestureIndicator.active) {
    return;
  }

  const startX = debugCanvas.width - scaleGestureIndicator.start.x;
  const startY = scaleGestureIndicator.start.y;
  const endX = debugCanvas.width - scaleGestureIndicator.end.x;
  const endY = scaleGestureIndicator.end.y;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy);

  if (length <= Number.EPSILON) {
    return;
  }

  const ux = dx / length;
  const uy = dy / length;

  debugCtx.save();
  debugCtx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  debugCtx.lineWidth = GESTURE_INDICATOR_LINE_WIDTH;
  debugCtx.beginPath();
  debugCtx.moveTo(startX, startY);
  debugCtx.lineTo(endX, endY);
  debugCtx.stroke();

  [[startX, startY, -1], [endX, endY, 1]].forEach(([x, y, direction]) => {
    const arrowDx = ux * direction;
    const arrowDy = uy * direction;

    debugCtx.beginPath();
    debugCtx.moveTo(x, y);
    debugCtx.lineTo(
      x - arrowDx * SCALE_GESTURE_ARROW_LENGTH + uy * SCALE_GESTURE_ARROW_WIDTH,
      y - arrowDy * SCALE_GESTURE_ARROW_LENGTH - ux * SCALE_GESTURE_ARROW_WIDTH,
    );
    debugCtx.moveTo(x, y);
    debugCtx.lineTo(
      x - arrowDx * SCALE_GESTURE_ARROW_LENGTH - uy * SCALE_GESTURE_ARROW_WIDTH,
      y - arrowDy * SCALE_GESTURE_ARROW_LENGTH + ux * SCALE_GESTURE_ARROW_WIDTH,
    );
    debugCtx.stroke();
  });
  debugCtx.restore();
}

function drawGestureMarker(screenPoint, filled, color) {
  debugCtx.save();
  debugCtx.beginPath();
  debugCtx.arc(
    screenXToCanvasX(screenPoint.x),
    screenPoint.y,
    GESTURE_INDICATOR_RADIUS,
    0,
    Math.PI * 2,
  );

  if (filled) {
    debugCtx.fillStyle = color;
    debugCtx.fill();
  } else {
    debugCtx.strokeStyle = color;
    debugCtx.lineWidth = GESTURE_INDICATOR_LINE_WIDTH;
    debugCtx.stroke();
  }

  debugCtx.restore();
}

function drawGestureMarkers() {
  gestureState.forEach((gesture, index) => {
    if (!gesture.active || handState[index].pinchStrength > PINCH_ACTIVE_THRESHOLD) {
      return;
    }

    ndcToScreen(gesture.palmNDC, tempGestureScreenPoint);

    if (gesture.fist) {
      drawGestureMarker(tempGestureScreenPoint, true, GESTURE_INDICATOR_FILL_COLOR);
      return;
    }

    if (gesture.openPalm) {
      drawGestureMarker(tempGestureScreenPoint, false, GESTURE_INDICATOR_RING_COLOR);
    }
  });
}

function drawUnmirroredText(text, x, y, textAlign = 'center') {
  debugCtx.save();
  debugCtx.scale(-1, 1);
  debugCtx.translate(-debugCanvas.width, 0);
  debugCtx.fillStyle = GESTURE_SYMBOL_COLOR;
  debugCtx.font = `${GESTURE_SYMBOL_FONT_SIZE}px sans-serif`;
  debugCtx.textAlign = textAlign;
  debugCtx.textBaseline = 'middle';
  debugCtx.fillText(text, x, y);
  debugCtx.restore();
}

function drawGestureSymbol(symbol, screenY, textAlign = 'left') {
  const x = textAlign === 'left'
    ? GESTURE_SYMBOL_MARGIN
    : debugCanvas.width - GESTURE_SYMBOL_MARGIN;

  drawUnmirroredText(symbol, x, screenY, textAlign);
}

function drawCameraModeIndicator() {
  if (gestureCameraFeedback.exitIndicatorFrames > 0) {
    drawUnmirroredText(
      GESTURE_CAMERA_MODE_EXIT_LABEL,
      GESTURE_SYMBOL_MARGIN,
      GESTURE_SYMBOL_MARGIN,
      'left',
    );
    return;
  }

  if (!gestureCameraFeedback.cameraModeActive) {
    return;
  }

  drawUnmirroredText(
    GESTURE_CAMERA_MODE_LABEL,
    GESTURE_SYMBOL_MARGIN,
    GESTURE_SYMBOL_MARGIN,
    'left',
  );
}

function drawOrbitIndicator() {
  if (!gestureCameraFeedback.orbitActive) {
    return;
  }

  ndcToScreen(gestureCameraFeedback.orbitStartNDC, tempOrbitStartScreen);
  ndcToScreen(gestureCameraFeedback.orbitEndNDC, tempOrbitEndScreen);

  if (tempOrbitStartScreen.distanceToSquared(tempOrbitEndScreen) <= Number.EPSILON) {
    return;
  }

  debugCtx.save();
  debugCtx.strokeStyle = GESTURE_SYMBOL_COLOR;
  debugCtx.lineWidth = GESTURE_INDICATOR_LINE_WIDTH;
  debugCtx.setLineDash([GESTURE_ORBIT_DASH_LENGTH, GESTURE_ORBIT_DASH_GAP]);
  debugCtx.beginPath();
  debugCtx.moveTo(screenXToCanvasX(tempOrbitStartScreen.x), tempOrbitStartScreen.y);
  debugCtx.lineTo(screenXToCanvasX(tempOrbitEndScreen.x), tempOrbitEndScreen.y);
  debugCtx.stroke();
  debugCtx.restore();
}

function drawGestureCameraFeedback() {
  drawCameraModeIndicator();
  drawOrbitIndicator();
  const gestureSymbolY = GESTURE_SYMBOL_MARGIN * 2;

  if (gestureCameraFeedback.zoomInActive) {
    drawGestureSymbol('+', gestureSymbolY, 'right');
  }

  if (gestureCameraFeedback.zoomOutActive) {
    drawGestureSymbol(GESTURE_ZOOM_OUT_SYMBOL, gestureSymbolY, 'right');
  }
}

export function setScaleGestureIndicator(startScreen, endScreen, active) {
  scaleGestureIndicator.active = active;

  if (!active || !startScreen || !endScreen) {
    return;
  }

  scaleGestureIndicator.start.copy(startScreen);
  scaleGestureIndicator.end.copy(endScreen);
}

export function setGestureCameraFeedback(feedback = {}) {
  gestureCameraFeedback.cameraModeActive = feedback.cameraModeActive === true;
  gestureCameraFeedback.zoomInActive = feedback.zoomInActive === true;
  gestureCameraFeedback.zoomOutActive = feedback.zoomOutActive === true;
  gestureCameraFeedback.exitIndicatorFrames = feedback.exitIndicatorFrames ?? 0;
  gestureCameraFeedback.orbitActive = feedback.orbitActive === true;

  if (feedback.orbitStartNDC) {
    gestureCameraFeedback.orbitStartNDC.copy(feedback.orbitStartNDC);
  }

  if (feedback.orbitEndNDC) {
    gestureCameraFeedback.orbitEndNDC.copy(feedback.orbitEndNDC);
  }
}

export function resetAllHandState() {
  handState.forEach(hand => {
    resetHandSlot(hand);
    hand.rawNDC.set(0, 0);
    hand.smoothedNDC.set(0, 0);
    hand.uv.set(0, 0);
    hand.hitPoint.set(0, 0, 0);
  });
  gestureState.forEach(resetGestureSlot);
  scaleGestureIndicator.active = false;
  resetGestureCameraFeedback();

  if (debugCanvasReady) {
    clearDebugCanvas();
  }
}

function drawLandmarks(landmarks) {
  debugCtx.fillStyle = 'rgba(0, 255, 160, 0.9)';

  landmarks.forEach(landmark => {
    debugCtx.beginPath();
    debugCtx.arc(
      landmark.x * debugCanvas.width,
      landmark.y * debugCanvas.height,
      DEBUG_LANDMARK_RADIUS,
      0,
      Math.PI * 2,
    );
    debugCtx.fill();
  });
}

function getHandednessLabel(results, index) {
  const handedness = results.multiHandedness?.[index];

  if (!handedness) {
    return null;
  }

  if (typeof handedness.label === 'string') {
    return handedness.label.toLowerCase();
  }

  if (Array.isArray(handedness) && typeof handedness[0]?.label === 'string') {
    return handedness[0].label.toLowerCase();
  }

  if (Array.isArray(handedness.classification) && typeof handedness.classification[0]?.label === 'string') {
    return handedness.classification[0].label.toLowerCase();
  }

  return null;
}

function resolveHandSlot(handednessLabel, index, usedSlots) {
  const preferredSlot = handednessLabel === 'left' ? 0 : handednessLabel === 'right' ? 1 : index;

  if (preferredSlot < 2 && !usedSlots.has(preferredSlot)) {
    return preferredSlot;
  }

  if (index < 2 && !usedSlots.has(index)) {
    return index;
  }

  return [0, 1].find(slot => !usedSlots.has(slot)) ?? -1;
}

export function onHandResults(results) {
  lastHandResultsAt = performance.now();
  clearDebugCanvas();

  const previousState = handState.map(hand => ({
    active: hand.active,
    assignmentKey: hand.assignmentKey,
  }));

  resetHandSlot(handState[0]);
  resetHandSlot(handState[1]);

  if (!results.multiHandLandmarks) {
    gestureState.forEach(resetGestureSlot);
    return;
  }

  const usedSlots = new Set();

  results.multiHandLandmarks.forEach((landmarks, index) => {
    const handednessLabel = getHandednessLabel(results, index);
    const slot = resolveHandSlot(handednessLabel, index, usedSlots);

    if (slot === -1) {
      return;
    }

    usedSlots.add(slot);

    const lm4 = landmarks[4];
    const lm8 = landmarks[8];
    const distance = Math.hypot(lm4.x - lm8.x, lm4.y - lm8.y);
    const fistDetected = detectFist(landmarks);
    const pinchPose = !fistDetected && detectPinchPose(landmarks);
    const strength = pinchPose
      ? 1.0 - THREE.MathUtils.smoothstep(distance, PINCH_CLOSED, PINCH_OPEN)
      : 0;
    const pinchActive = strength > PINCH_ACTIVE_THRESHOLD;
    const rawNdcX = 1.0 - (lm8.x * 2.0);
    const rawNdcY = -(lm8.y * 2.0 - 1.0);
    const assignmentKey = handednessLabel ?? `index-${index}`;

    if (!previousState[slot].active || previousState[slot].assignmentKey !== assignmentKey) {
      resetGestureSlot(gestureState[slot]);
    }

    handState[slot].rawNDC.set(rawNdcX, rawNdcY);
    if (!previousState[slot].active || previousState[slot].assignmentKey !== assignmentKey) {
      handState[slot].smoothedNDC.set(rawNdcX, rawNdcY);
    }
    handState[slot].pinchStrength = strength;
    handState[slot].active = true;
    handState[slot].assignmentKey = assignmentKey;

    gestureState[slot].fist = fistDetected;
    gestureState[slot].openPalm = !fistDetected && !pinchPose && !pinchActive && detectOpenPalm(landmarks);
    gestureState[slot].prevPalmNDC.copy(gestureState[slot].palmNDC);
    gestureState[slot].palmNDC.set(
      1.0 - (landmarks[9].x * 2.0),
      -(landmarks[9].y * 2.0 - 1.0),
    );
    gestureState[slot].active = true;
    gestureState[slot].openPalmFrames = gestureState[slot].openPalm
      ? gestureState[slot].openPalmFrames + 1
      : 0;

    drawLandmarks(landmarks);
  });

  gestureState.forEach((gesture, slot) => {
    if (!usedSlots.has(slot)) {
      resetGestureSlot(gesture);
    }
  });

  drawGestureMarkers();
  drawScaleGestureIndicator();
  drawGestureCameraFeedback();
}

function createHandsInstance() {
  const generation = ++handsGeneration;
  const instance = new window.Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  instance.setOptions(HANDS_OPTIONS);
  instance.onResults(results => {
    if (generation !== handsGeneration) {
      return;
    }

    onHandResults(results);
  });
  lastHandResultsAt = performance.now();

  return instance;
}

export function getLastHandResultsTimestamp() {
  return lastHandResultsAt;
}

export function initMediaPipe() {
  ensureDebugCanvas();

  if (hands) {
    return hands;
  }

  if (typeof window.Hands !== 'function') {
    throw new Error('MediaPipe Hands failed to load from the CDN script.');
  }

  hands = createHandsInstance();

  return hands;
}

export async function reinitializeMediaPipe() {
  ensureDebugCanvas();

  const previousHands = hands;

  hands = null;

  if (previousHands && typeof previousHands.close === 'function') {
    try {
      await Promise.resolve(previousHands.close());
    } catch {
      // Recovery should stay silent during normal use; a failed close just means we rebuild anyway.
    }
  }

  resetAllHandState();
  hands = createHandsInstance();

  return hands;
}
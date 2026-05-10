import * as THREE from 'three';

import {
  createAxisGizmo,
  getAxisMeshes,
  setAxisDragHighlight,
  updateAxisLengths,
  setAxisVisible,
} from './axisgizmo.js';
import {
  attachCameraControlListeners,
  configureCameraControls,
  resetCameraControlState,
} from './cameracontrols.js';
import {
  AUDIO_DISP_SCALE,
  AUDIO_ZERO_SIGNAL_WARNING_DELAY_MS,
  AXIS_DRAG_SCALE_PER_PIXEL,
  AXIS_SCALE_MAX,
  AXIS_SCALE_MIN,
  HAND_RESULTS_STALL_TIMEOUT_MS,
  HAND_INDICATOR_RADIUS,
  HAND_INDICATOR_SEGMENTS,
  LERP_FACTOR,
  MAX_FALLOFF_RADIUS,
  MEDIAPIPE_SEND_TIMEOUT_MS,
  MIN_FALLOFF_RADIUS,
  OBJECT_FADE_DURATION_MS,
  OBJECT_SCALE_DEFAULT,
  OBJECT_SCALE_MAX,
  OBJECT_SCALE_MIN,
  PARTICLE_AUDIO_BOOST,
  PARTICLE_RAYCAST_THRESHOLD,
  PINCH_ACTIVE_THRESHOLD,
  STRETCH_ACTIVATION_THRESHOLD,
  STRETCH_MOVEMENT_THRESHOLD,
  STRETCH_MULTIPLIER,
  WEBCAM_RESTART_COOLDOWN_MS,
} from './constants.js';
import { getAudioAnalyser, getAudioFrequencyData, isAudioActive } from './audioreactivity.js';
import {
  isCameraGestureModeActive,
  resetGestureCameraState,
  updateGestureCamera,
} from './gesturecamera.js';
import {
  gestureState,
  handState,
  initMediaPipe,
  reinitializeMediaPipe,
  resetAllHandState,
  setGestureCameraFeedback,
  setScaleGestureIndicator,
} from './hands.js';
import {
  attachMouseListeners,
  configureMouseInteraction,
  detachMouseListeners,
  resetMouseInteractionState,
  updateMouseInput,
} from './interaction.js';
import { MODE, initModeToggle } from './modeToggle.js';
import {
  captureWebcamFrame,
  hasLiveWebcamFrameSource,
  initWebcam,
  restartWebcam,
  stopWebcamStream,
} from './overlay.js';
import { OBJECT_OPTIONS, OBJECTS, spawnObject } from './objectspawner.js';
import { camPhi, camRadius, camTheta, initScene } from './scene.js';
import { createHelpButton, showSplash } from './splash.js';
import {
  applyDecay,
  applyAudioFrequencyDisplacement,
  applyStretchFromSnapshot,
  applyImpulse,
  composeDisplacement,
  createDisplacementSystem,
  createSurface,
  createSurfaceParams,
  decaySnapshot,
  resolveHitUV,
  sampleDisplacementAtPoint,
} from './surface.js';
import { getColorAtPosition, getCurrentSingleColor } from './gradienteditor.js';
import { initUI } from './ui.js';

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#02040a';

const { mainScene, mainCamera, renderer } = initScene();
const canvas = renderer.domElement;
const params = createSurfaceParams();
params.object = OBJECTS.PLANE;
const { mesh: initialMesh, material: surfaceMaterial, uniforms: surfaceUniforms } = createSurface();
const clock = new THREE.Clock();
const deformUniforms = {
  u_decay: { value: params.decay },
  u_deformStrength: { value: params.deformStrength },
  u_falloffRadius: { value: params.falloffRadius },
};
let currentMesh = initialMesh;
let currentObjectType = params.object;
let dispSystem = createDisplacementSystem(currentMesh.geometry);
const raycaster = new THREE.Raycaster();
const currentObjectRoot = new THREE.Group();
const axisGizmo = createAxisGizmo(mainScene);
const axisMeshes = getAxisMeshes(axisGizmo);
const sphereGeometry = new THREE.SphereGeometry(
  HAND_INDICATOR_RADIUS,
  HAND_INDICATOR_SEGMENTS,
  HAND_INDICATOR_SEGMENTS,
);
const spheres = handState.map(() => {
  const sphere = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial());

  sphere.visible = false;
  mainScene.add(sphere);

  return sphere;
});
let elapsedTime = 0;
let hands = null;
let webcamActive = false;
let mediaPipeSendInFlight = false;
let mediaPipeSendStartedAt = 0;
let mediaPipeSendGeneration = 0;
let mediaPipeRecoveryInProgress = false;
let videoRecoveryInProgress = false;
let lastWebcamRecoveryAt = 0;
let stretchModeActive = false;
let stretchGestureLocked = false;
let stretchActivationDistance = 0;
const stretchSnapshotState = {
  active: false,
  data: null,
  sourceHeights: [0, 0],
};
let modeController = null;
let axisVisible = params.showAxis;
let objectFadeStartedAt = 0;
let uniformObjectScale = OBJECT_SCALE_DEFAULT;
const webcamScaleGestureState = {
  active: false,
  initialDistance: 0,
  initialScale: OBJECT_SCALE_DEFAULT,
};
let webcamDeformGestureLocked = false;
const webcamDeformHandLocks = handState.map(() => false);
const axisStretchScale = new THREE.Vector3(
  OBJECT_SCALE_DEFAULT,
  OBJECT_SCALE_DEFAULT,
  OBJECT_SCALE_DEFAULT,
);
const currentObjectScale = new THREE.Vector3(
  OBJECT_SCALE_DEFAULT,
  OBJECT_SCALE_DEFAULT,
  OBJECT_SCALE_DEFAULT,
);
const axisDragSources = new Map();
const webcamAxisDragState = handState.map(() => ({
  active: false,
  axis: '',
  previousScreen: new THREE.Vector2(),
}));
const tempAxisDirection = new THREE.Vector2();
const tempHandScreen = new THREE.Vector2();
const tempAxisScreenEnd = new THREE.Vector2();
const tempAxisScreenStart = new THREE.Vector2();
const tempObjectBounds = new THREE.Box3();
const tempObjectHalfExtents = new THREE.Vector3();
const tempObjectSize = new THREE.Vector3();
const tempProjectedPoint = new THREE.Vector3();
const tempScaleGestureScreenStart = new THREE.Vector2();
const tempScaleGestureScreenEnd = new THREE.Vector2();
let audioZeroSignalStartedAt = 0;
let audioDisplacementWasActive = false;
const colorReactiveEnergyHistory = new Float32Array(300);
let colorReactiveEnergyHistoryCount = 0;
let colorReactiveEnergyHistoryIndex = 0;
let previousColorReactiveEnergy = 0;
let smoothedColorReactivePosition = 0;

const AXIS_DRAG_SOURCE_IDS = ['mouse', 'webcam-0', 'webcam-1'];
const AXIS_ORIGIN = new THREE.Vector3(0, 0, 0);
const AXIS_WORLD_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const COLOR_REACTIVE_BASS_END = 20;
const COLOR_REACTIVE_MID_START = 21;
const COLOR_REACTIVE_MID_END = 80;
const COLOR_REACTIVE_HIGH_START = 81;
const COLOR_REACTIVE_SMOOTHING = 0.15;

function resetColorReactiveState() {
  colorReactiveEnergyHistoryCount = 0;
  colorReactiveEnergyHistoryIndex = 0;
  previousColorReactiveEnergy = 0;
  smoothedColorReactivePosition = 0;
}

setAxisVisible(axisGizmo, axisVisible);
raycaster.params.Points.threshold = PARTICLE_RAYCAST_THRESHOLD;
mainScene.add(currentObjectRoot);

function projectWorldPointToScreen(worldPoint, camera, target) {
  tempProjectedPoint.copy(worldPoint).project(camera);
  target.set(
    (tempProjectedPoint.x * 0.5 + 0.5) * window.innerWidth,
    (1.0 - (tempProjectedPoint.y * 0.5 + 0.5)) * window.innerHeight,
  );
}

function getAxisScreenDirection(axis, camera, target) {
  const axisVector = AXIS_WORLD_VECTORS[axis];

  if (!axisVector) {
    return false;
  }

  projectWorldPointToScreen(AXIS_ORIGIN, camera, tempAxisScreenStart);
  projectWorldPointToScreen(axisVector, camera, tempAxisScreenEnd);
  target.subVectors(tempAxisScreenEnd, tempAxisScreenStart);

  if (target.lengthSq() <= Number.EPSILON) {
    return false;
  }

  target.normalize();
  return true;
}

function clampUniformScale(value) {
  return THREE.MathUtils.clamp(value, OBJECT_SCALE_MIN, OBJECT_SCALE_MAX);
}

function clampAxisScale(value) {
  return THREE.MathUtils.clamp(value, AXIS_SCALE_MIN, AXIS_SCALE_MAX);
}

function applyCurrentObjectScale() {
  currentObjectScale.copy(axisStretchScale).multiplyScalar(uniformObjectScale);
  currentObjectRoot.scale.copy(currentObjectScale);
  currentObjectRoot.updateMatrixWorld(true);
}

function setUniformObjectScale(scale, updateDisplay = true) {
  const nextScale = clampUniformScale(scale);

  uniformObjectScale = nextScale;
  params.objectScale = nextScale;
  surfaceUniforms.u_objectUniformScale.value = nextScale;
  applyCurrentObjectScale();

  if (updateDisplay) {
    scaleControl?.updateDisplay();
  }
}

function resetWebcamScaleGesture() {
  webcamScaleGestureState.active = false;
  webcamScaleGestureState.initialDistance = 0;
  webcamScaleGestureState.initialScale = uniformObjectScale;
  setScaleGestureIndicator(null, null, false);
}

function resetAudioDisplacementState() {
  let changed = false;

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    if (dispSystem.audioData[index] !== 0) {
      dispSystem.audioData[index] = 0;
      changed = true;
    }

    if (dispSystem.previousAudioData[index] !== 0) {
      dispSystem.previousAudioData[index] = 0;
    }

    if (dispSystem.previousPianoData[index] !== 0) {
      dispSystem.previousPianoData[index] = 0;
    }
  }

  return changed;
}

function resetStretchSnapshotState() {
  stretchSnapshotState.active = false;
  stretchSnapshotState.data = null;
  stretchSnapshotState.sourceHeights[0] = 0;
  stretchSnapshotState.sourceHeights[1] = 0;
}

function captureStretchSnapshot() {
  const sampleRadius = Math.max(params.falloffRadius, MIN_FALLOFF_RADIUS);
  const snapshotData = new Float32Array(dispSystem.sculptData);

  stretchSnapshotState.active = true;
  stretchSnapshotState.data = snapshotData;
  stretchSnapshotState.sourceHeights[0] = sampleDisplacementAtPoint(
    snapshotData,
    handState[0].hitPoint,
    sampleRadius,
    currentMesh,
    dispSystem,
  );
  stretchSnapshotState.sourceHeights[1] = sampleDisplacementAtPoint(
    snapshotData,
    handState[1].hitPoint,
    sampleRadius,
    currentMesh,
    dispSystem,
  );
}

function clearWebcamDeformLock(index) {
  webcamDeformHandLocks[index] = false;
}

function resetWebcamDeformLocks() {
  webcamDeformGestureLocked = false;
  webcamDeformHandLocks.forEach((_, index) => {
    clearWebcamDeformLock(index);
  });
}

function handHasWebcamDeformLock(index) {
  return webcamDeformGestureLocked || webcamDeformHandLocks[index];
}

function resetObjectScale(updateDisplay = true) {
  axisStretchScale.setScalar(OBJECT_SCALE_DEFAULT);
  setUniformObjectScale(OBJECT_SCALE_DEFAULT, updateDisplay);
}

function applyAxisScaleDelta(axis, deltaScale) {
  if (!(axis in axisStretchScale)) {
    return;
  }

  axisStretchScale[axis] = clampAxisScale(axisStretchScale[axis] + deltaScale);
  applyCurrentObjectScale();
}

function updateAxisGizmoLayout() {
  tempObjectBounds.setFromObject(currentObjectRoot);

  if (tempObjectBounds.isEmpty()) {
    tempObjectHalfExtents.set(0, 0, 0);
  } else {
    tempObjectBounds.getSize(tempObjectSize);
    tempObjectHalfExtents.copy(tempObjectSize).multiplyScalar(0.5);
  }

  updateAxisLengths(axisGizmo, tempObjectHalfExtents);
}

function refreshAxisHighlight(axis) {
  const active = Array.from(axisDragSources.values()).some(value => value === axis);

  setAxisDragHighlight(axisGizmo, axis, active);
}

function setAxisDragSource(source, axis) {
  const previousAxis = axisDragSources.get(source);

  if (previousAxis === axis) {
    return;
  }

  if (previousAxis) {
    axisDragSources.delete(source);
    refreshAxisHighlight(previousAxis);
  }

  if (axis) {
    axisDragSources.set(source, axis);
    refreshAxisHighlight(axis);
  }
}

function clearWebcamAxisDrag(index) {
  const dragState = webcamAxisDragState[index];

  if (!dragState.active) {
    return;
  }

  dragState.active = false;
  dragState.axis = '';
  dragState.previousScreen.set(0, 0);
  setAxisDragSource(`webcam-${index}`, null);
}

function resetAxisDragState() {
  resetMouseInteractionState();
  AXIS_DRAG_SOURCE_IDS.forEach(source => {
    setAxisDragSource(source, null);
  });
  webcamAxisDragState.forEach(dragState => {
    dragState.active = false;
    dragState.axis = '';
    dragState.previousScreen.set(0, 0);
  });
}

function handIsAxisDragging(index) {
  return webcamAxisDragState[index].active;
}

function ndcToScreen(ndc, target) {
  target.set(
    (ndc.x * 0.5 + 0.5) * window.innerWidth,
    (1.0 - (ndc.y * 0.5 + 0.5)) * window.innerHeight,
  );
}

function updateAxisScaleFromScreenDelta(axis, currentScreen, previousScreen) {
  if (!getAxisScreenDirection(axis, mainCamera, tempAxisDirection)) {
    return;
  }

  const deltaX = currentScreen.x - previousScreen.x;
  const deltaY = currentScreen.y - previousScreen.y;
  const projectedDelta = (deltaX * tempAxisDirection.x) + (deltaY * tempAxisDirection.y);

  if (projectedDelta !== 0) {
    applyAxisScaleDelta(axis, projectedDelta * AXIS_DRAG_SCALE_PER_PIXEL);
  }
}

function averageFrequencyRange(frequencyData, startIndex, endIndex) {
  const maxIndex = frequencyData.length - 1;

  if (maxIndex < 0) {
    return 0;
  }

  const start = THREE.MathUtils.clamp(startIndex, 0, maxIndex);
  const end = THREE.MathUtils.clamp(endIndex, start, maxIndex);
  let sum = 0;

  for (let index = start; index <= end; index += 1) {
    sum += frequencyData[index];
  }

  return (sum / (end - start + 1)) / 255;
}

function getColorReactiveEnergy(frequencyData, sensitivity) {
  const bass = averageFrequencyRange(frequencyData, 0, COLOR_REACTIVE_BASS_END);
  const mids = averageFrequencyRange(frequencyData, COLOR_REACTIVE_MID_START, COLOR_REACTIVE_MID_END);
  const highs = averageFrequencyRange(frequencyData, COLOR_REACTIVE_HIGH_START, frequencyData.length - 1);
  const weightedEnergy = (bass * 0.6) + (mids * 0.3) + (highs * 0.1);
  const scaledEnergy = weightedEnergy * Math.max(sensitivity, 0);

  return THREE.MathUtils.clamp(1.0 - Math.exp(-scaledEnergy * 4.0), 0, 1);
}

function getColorReactivePosition(energy) {
  const deltaEnergy = colorReactiveEnergyHistoryCount === 0 ? 0 : energy - previousColorReactiveEnergy;

  previousColorReactiveEnergy = energy;
  colorReactiveEnergyHistory[colorReactiveEnergyHistoryIndex] = energy;
  colorReactiveEnergyHistoryIndex = (colorReactiveEnergyHistoryIndex + 1) % colorReactiveEnergyHistory.length;
  colorReactiveEnergyHistoryCount = Math.min(
    colorReactiveEnergyHistoryCount + 1,
    colorReactiveEnergyHistory.length,
  );

  let rollingMin = Number.POSITIVE_INFINITY;
  let rollingMax = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < colorReactiveEnergyHistoryCount; index += 1) {
    const sample = colorReactiveEnergyHistory[index];

    if (sample < rollingMin) {
      rollingMin = sample;
    }

    if (sample > rollingMax) {
      rollingMax = sample;
    }
  }

  const normalizedPosition = (energy - rollingMin) / ((rollingMax - rollingMin) + 0.001);
  const deltaPosition = THREE.MathUtils.clamp((deltaEnergy * 5.0) + 0.5, 0, 1);

  return THREE.MathUtils.clamp((normalizedPosition * 0.7) + (deltaPosition * 0.3), 0, 1);
}

function applySingleSurfaceColor() {
  const color = getCurrentSingleColor();

  surfaceUniforms.u_color.value.setRGB(color.r, color.g, color.b);
}

function isRecoverableMediaPipeError(error) {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

  return [
    'abort',
    'waituntilidle',
    'teximage2d',
    'texture',
    'webgl',
  ].some(fragment => message.includes(fragment));
}

function isTimedOutMediaPipeError(error) {
  return (error instanceof Error ? error.message : String(error)) === 'MediaPipe send timed out.';
}

function isRecoverableWebcamSourceError(error) {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

  return [
    'frame source',
    'grabframe',
    'imagecapture',
    'track',
  ].some(fragment => message.includes(fragment));
}

function isWebcamFrameSourceReady() {
  return hasLiveWebcamFrameSource();
}

function resetInputState() {
  resetCameraControlState();
  resetAxisDragState();
  resetGestureCameraState();
  resetWebcamScaleGesture();
  resetWebcamDeformLocks();
  resetAllHandState();
  resetStretchSnapshotState();
  stretchGestureLocked = false;
  stretchModeActive = false;
  stretchActivationDistance = 0;
  deformUniforms.u_falloffRadius.value = params.falloffRadius;
}

function prepareForModeChange() {
  resetInputState();
  mediaPipeSendGeneration += 1;
  mediaPipeSendInFlight = false;
  mediaPipeSendStartedAt = 0;
}

async function recoverMediaPipe() {
  if (mediaPipeRecoveryInProgress || videoRecoveryInProgress) {
    return;
  }

  mediaPipeRecoveryInProgress = true;
  mediaPipeSendGeneration += 1;
  mediaPipeSendInFlight = false;
  mediaPipeSendStartedAt = 0;
  resetInputState();

  try {
    hands = await reinitializeMediaPipe();
  } catch (error) {
    hands = null;
    console.error('MediaPipe recovery failed:', error);
  } finally {
    mediaPipeRecoveryInProgress = false;
  }
}

async function recoverWebcam() {
  if (videoRecoveryInProgress) {
    return;
  }

  videoRecoveryInProgress = true;
  mediaPipeSendGeneration += 1;
  mediaPipeSendInFlight = false;
  mediaPipeSendStartedAt = 0;
  resetInputState();

  try {
    webcamActive = await restartWebcam({ showPermissionError: false });
    if (webcamActive) {
      hands = await reinitializeMediaPipe();
    } else {
      hands = null;
      modeController?.forceMouseMode('Camera access denied. Using mouse mode.');
    }
  } catch (error) {
    hands = null;
    webcamActive = false;
    console.error('Webcam restart failed:', error);
  } finally {
    lastWebcamRecoveryAt = performance.now();
    videoRecoveryInProgress = false;
  }
}

function sendFrameToMediaPipe(currentHands) {
  const sendGeneration = ++mediaPipeSendGeneration;
  let timeoutId = 0;

  mediaPipeSendInFlight = true;
  mediaPipeSendStartedAt = performance.now();
  Promise.race([
    (async () => {
      const frame = await captureWebcamFrame();

      try {
        await currentHands.send({ image: frame });
      } finally {
        if (typeof frame.close === 'function') {
          frame.close();
        }
      }
    })(),
    new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('MediaPipe send timed out.'));
      }, MEDIAPIPE_SEND_TIMEOUT_MS);
    }),
  ])
    .catch(async error => {
      if (sendGeneration !== mediaPipeSendGeneration) {
        return;
      }

      // Cover/uncover transitions can yield transient bad frames; skip them and keep the loop alive.
      if (isTimedOutMediaPipeError(error)) {
        await recoverMediaPipe();
        return;
      }

      if (isRecoverableWebcamSourceError(error)) {
        await recoverWebcam();
        return;
      }

      if (!isRecoverableMediaPipeError(error)) {
        console.error('MediaPipe error:', error);
      }
    })
    .finally(() => {
      window.clearTimeout(timeoutId);

      if (sendGeneration === mediaPipeSendGeneration) {
        mediaPipeSendInFlight = false;
        mediaPipeSendStartedAt = 0;
      }
    });
}

function setSphereVisual(index, pinchStrength) {
  spheres[index].material.color.setHSL(
    pinchStrength > PINCH_ACTIVE_THRESHOLD ? 0.5 : 0,
    pinchStrength > PINCH_ACTIVE_THRESHOLD ? 1 : 0,
    pinchStrength > PINCH_ACTIVE_THRESHOLD ? 1 : 0.5,
  );
}

function clearHandOutput(index) {
  spheres[index].visible = false;
}

function applyHandOutput(hand, index) {
  spheres[index].position.copy(hand.hitPoint);
  spheres[index].visible = true;
  setSphereVisual(index, hand.pinchStrength);
}

function updateWebcamHandOutputs() {
  const cameraModeActive = isCameraGestureModeActive();

  handState.forEach((hand, index) => {
    if (!hand.active) {
      clearWebcamAxisDrag(index);
      clearWebcamDeformLock(index);
      hand.surfaceHit = false;
      clearHandOutput(index);
      return;
    }

    hand.smoothedNDC.lerp(hand.rawNDC, LERP_FACTOR);
    const pinchActive = hand.pinchStrength > PINCH_ACTIVE_THRESHOLD;
    const dragState = webcamAxisDragState[index];

    if (cameraModeActive) {
      clearWebcamAxisDrag(index);
      clearWebcamDeformLock(index);
      hand.surfaceHit = false;
      clearHandOutput(index);
      return;
    }

    if (dragState.active && !pinchActive) {
      clearWebcamAxisDrag(index);
    }

    if (!pinchActive) {
      clearWebcamDeformLock(index);
    }

    if (pinchActive) {
      ndcToScreen(hand.smoothedNDC, tempHandScreen);

      if (dragState.active) {
        clearWebcamDeformLock(index);
        updateAxisScaleFromScreenDelta(dragState.axis, tempHandScreen, dragState.previousScreen);
        dragState.previousScreen.copy(tempHandScreen);
        hand.surfaceHit = false;
        clearHandOutput(index);
        return;
      }

      if (webcamScaleGestureState.active) {
        hand.surfaceHit = false;
        clearHandOutput(index);
        return;
      }

      if (!stretchGestureLocked && !handHasWebcamDeformLock(index)) {
        raycaster.setFromCamera(hand.smoothedNDC, mainCamera);
        const axisHit = raycaster.intersectObjects(axisMeshes, false)
          .find(hit => typeof hit.object.userData.axis === 'string');

        if (axisHit) {
          dragState.active = true;
          dragState.axis = axisHit.object.userData.axis;
          dragState.previousScreen.copy(tempHandScreen);
          setAxisDragSource(`webcam-${index}`, dragState.axis);
          hand.surfaceHit = false;
          clearHandOutput(index);
          return;
        }
      }
    }

    raycaster.setFromCamera(hand.smoothedNDC, mainCamera);

    const hits = raycaster.intersectObject(currentMesh);

    if (hits.length === 0 || !resolveHitUV(hits[0], currentMesh, hand.uv)) {
      hand.surfaceHit = false;
      clearHandOutput(index);
      return;
    }

    hand.surfaceHit = true;
    if (pinchActive) {
      webcamDeformHandLocks[index] = true;
    }
    hand.hitPoint.copy(hits[0].point);
    applyHandOutput(hand, index);
  });
}

function updateWebcamDeformGestureLock() {
  if (isCameraGestureModeActive()) {
    webcamDeformGestureLocked = false;
    return;
  }

  const hand0Pinching = handState[0].active &&
    handState[0].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    !handIsAxisDragging(0);
  const hand1Pinching = handState[1].active &&
    handState[1].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    !handIsAxisDragging(1);

  if (!hand0Pinching || !hand1Pinching) {
    webcamDeformGestureLocked = false;
    return;
  }

  if (!webcamScaleGestureState.active && handState[0].surfaceHit && handState[1].surfaceHit) {
    webcamDeformGestureLocked = true;
  }
}

function updateWebcamScaleGesture() {
  if (isCameraGestureModeActive()) {
    resetWebcamScaleGesture();
    return;
  }

  if (webcamDeformGestureLocked || webcamDeformHandLocks.some(Boolean)) {
    resetWebcamScaleGesture();
    return;
  }

  const hand0Ready = handState[0].active &&
    handState[0].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    !handState[0].surfaceHit &&
    !handIsAxisDragging(0);
  const hand1Ready = handState[1].active &&
    handState[1].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    !handState[1].surfaceHit &&
    !handIsAxisDragging(1);

  if (!hand0Ready || !hand1Ready) {
    resetWebcamScaleGesture();
    return;
  }

  ndcToScreen(handState[0].smoothedNDC, tempScaleGestureScreenStart);
  ndcToScreen(handState[1].smoothedNDC, tempScaleGestureScreenEnd);

  const currentDistance = tempScaleGestureScreenStart.distanceTo(tempScaleGestureScreenEnd);
  const safeDistance = Math.max(currentDistance, 1);

  if (!webcamScaleGestureState.active) {
    webcamScaleGestureState.active = true;
    webcamScaleGestureState.initialDistance = safeDistance;
    webcamScaleGestureState.initialScale = uniformObjectScale;
  }

  const nextScale = webcamScaleGestureState.initialScale *
    (safeDistance / webcamScaleGestureState.initialDistance);

  setUniformObjectScale(nextScale);
  setScaleGestureIndicator(tempScaleGestureScreenStart, tempScaleGestureScreenEnd, true);
}

function updateMouseHandOutputs() {
  handState.forEach((hand, index) => {
    if (!hand.active) {
      clearHandOutput(index);
      return;
    }

    applyHandOutput(hand, index);
  });
}

function updateStretchRadius() {
  const h0 = handState[0].active &&
    handState[0].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    !handIsAxisDragging(0);
  const h1 = handState[1].active &&
    handState[1].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    !handIsAxisDragging(1);
  const planeStretchEnabled = currentObjectType === OBJECTS.PLANE;
  const bothHandsPinching = h0 && h1;
  const bothHandsOnSurface = handState[0].surfaceHit && handState[1].surfaceHit;

  if (!planeStretchEnabled || !bothHandsPinching) {
    resetStretchSnapshotState();
    stretchGestureLocked = false;
    stretchModeActive = false;
    stretchActivationDistance = 0;
  } else if (!stretchGestureLocked && !webcamScaleGestureState.active && bothHandsOnSurface) {
    const activationDistance = handState[0].smoothedNDC.distanceTo(handState[1].smoothedNDC);

    stretchGestureLocked = activationDistance < STRETCH_ACTIVATION_THRESHOLD;
    stretchModeActive = stretchGestureLocked;

    if (stretchGestureLocked) {
      stretchActivationDistance = activationDistance;
      captureStretchSnapshot();
    } else {
      stretchActivationDistance = 0;
    }
  } else {
    stretchModeActive = stretchGestureLocked;
  }

  let nextFalloffRadius = params.falloffRadius;

  if (stretchModeActive && bothHandsPinching) {
    const distance = handState[0].smoothedNDC.distanceTo(handState[1].smoothedNDC);
    const stretchDistance = distance - stretchActivationDistance;

    if (stretchDistance > STRETCH_MOVEMENT_THRESHOLD) {
      const baseForStretch = Math.max(params.falloffRadius, MIN_FALLOFF_RADIUS);
      const stretchRadius = baseForStretch * (1.0 + stretchDistance * STRETCH_MULTIPLIER);

      nextFalloffRadius = Math.min(
        Math.max(stretchRadius, MIN_FALLOFF_RADIUS),
        MAX_FALLOFF_RADIUS,
      );
    }
  }

  deformUniforms.u_falloffRadius.value = nextFalloffRadius;
}

function applyActiveDeformations(deltaSeconds) {
  const cameraGestureModeActive = isCameraGestureModeActive();
  let displacementChanged = false;

  const h0Pinching = handState[0].active &&
    handState[0].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    handState[0].surfaceHit &&
    !handIsAxisDragging(0);
  const h1Pinching = handState[1].active &&
    handState[1].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    handState[1].surfaceHit &&
    !handIsAxisDragging(1);
  const stretchActive = stretchModeActive &&
    h0Pinching &&
    h1Pinching;
  const planeStretchActive = currentObjectType === OBJECTS.PLANE &&
    stretchActive &&
    Boolean(stretchSnapshotState.active && stretchSnapshotState.data);

  if (planeStretchActive) {
    displacementChanged = decaySnapshot(
      stretchSnapshotState.data,
      dispSystem,
      deltaSeconds,
      deformUniforms.u_decay.value,
    ) || displacementChanged;

    if (deformUniforms.u_falloffRadius.value > params.falloffRadius) {
      displacementChanged = applyStretchFromSnapshot(
        stretchSnapshotState.data,
        [handState[0].hitPoint, handState[1].hitPoint],
        stretchSnapshotState.sourceHeights,
        deformUniforms.u_falloffRadius.value,
        currentMesh,
        dispSystem,
      ) || displacementChanged;
    } else {
      dispSystem.sculptData.set(stretchSnapshotState.data);
      displacementChanged = true;
    }

    return displacementChanged;
  }

  displacementChanged = applyDecay(
    dispSystem.sculptData,
    dispSystem,
    deltaSeconds,
    deformUniforms.u_decay.value,
  ) || displacementChanged;

  if (cameraGestureModeActive) {
    return displacementChanged;
  }

  handState.forEach((hand, index) => {
    if (!hand.active || !hand.surfaceHit || hand.pinchStrength <= 0 || handIsAxisDragging(index)) {
      return;
    }

    displacementChanged = applyImpulse(
      hand.hitPoint,
      hand.pinchStrength,
      deformUniforms.u_deformStrength.value,
      deformUniforms.u_falloffRadius.value,
      currentMesh,
      dispSystem.sculptData,
      dispSystem,
    ) || displacementChanged;
  });

  return displacementChanged;
}

function isSplashOpen() {
  return Boolean(document.getElementById('gia-splash'));
}

function openSplash() {
  resetInputState();
  showSplash();
}

function startObjectFade(now = performance.now()) {
  objectFadeStartedAt = now;
}

function updateObjectFade(now) {
  if (objectFadeStartedAt === 0) {
    surfaceUniforms.u_opacity.value = 1.0;
    return;
  }

  const progress = Math.min((now - objectFadeStartedAt) / OBJECT_FADE_DURATION_MS, 1.0);

  surfaceUniforms.u_opacity.value = progress;

  if (progress >= 1.0) {
    objectFadeStartedAt = 0;
  }
}

function switchObject(type) {
  resetInputState();
  clearHandOutput(0);
  clearHandOutput(1);

  const nextObject = spawnObject(
    type,
    currentObjectRoot,
    currentMesh,
    dispSystem,
    surfaceMaterial,
    surfaceUniforms,
    { fadeIn: true },
  );

  currentMesh = nextObject.mesh;
  currentObjectType = type;
  dispSystem = nextObject.dispSystem;
  resetAudioDisplacementState();
  resetObjectScale();
  surfaceUniforms.u_displacementTex.value = dispSystem.tex;
  surfaceUniforms.u_texSide.value = dispSystem.side;
  startObjectFade();
}

currentObjectRoot.add(currentMesh);
resetObjectScale(false);
updateAxisGizmoLayout();
surfaceUniforms.u_displacementTex.value = dispSystem.tex;
surfaceUniforms.u_texSide.value = dispSystem.side;
const { axisControl, scaleControl, setAudioSignalWarning } = initUI(surfaceUniforms, deformUniforms, params, {
  objectOptions: OBJECT_OPTIONS,
  onObjectChange: switchObject,
  onObjectScaleChange: value => {
    setUniformObjectScale(value);
  },
  onAxisToggle: value => {
    axisVisible = value;
    setAxisVisible(axisGizmo, axisVisible);
  },
});
configureMouseInteraction({
  getAxisMeshes: () => axisMeshes,
  getCurrentCamera: () => mainCamera,
  getRaycaster: () => raycaster,
  onAxisDragStateChange: ({ active, axis, source }) => {
    setAxisDragSource(source, active ? axis : null);
  },
  onAxisScaleDelta: applyAxisScaleDelta,
});
configureCameraControls({
  getCurrentCamera: () => mainCamera,
  getCurrentMesh: () => currentMesh,
  getRaycaster: () => raycaster,
  isEnabled: () => modeController?.getCurrentMode() === MODE.MOUSE && !isSplashOpen(),
});
attachCameraControlListeners(canvas);
attachMouseListeners(canvas);
modeController = initModeToggle({
  canvas,
  attachMouseListeners,
  detachMouseListeners,
  resetAllHandState: prepareForModeChange,
  initWebcam: () => initWebcam({ showPermissionError: false }),
  initMediaPipe,
  stopWebcam: stopWebcamStream,
  setHands: nextHands => {
    hands = nextHands;
  },
  setWebcamActive: value => {
    webcamActive = value;
    if (value) {
      lastWebcamRecoveryAt = performance.now();
    } else {
      mediaPipeSendInFlight = false;
      mediaPipeSendStartedAt = 0;
    }
  },
});
createHelpButton(openSplash);
document.addEventListener('keydown', event => {
  if (event.key === 'a' && !isSplashOpen()) {
    axisVisible = !axisVisible;
    params.showAxis = axisVisible;
    setAxisVisible(axisGizmo, axisVisible);
    axisControl?.updateDisplay();
    return;
  }

  if (event.key === '?' && !isSplashOpen()) {
    openSplash();
  }
});

function loop() {
  requestAnimationFrame(loop);
  const deltaSeconds = clock.getDelta();
  const now = performance.now();
  const pageVisible = document.visibilityState === 'visible';
  const splashOpen = isSplashOpen();
  const currentMode = modeController.getCurrentMode();
  const webcamFrameSourceReady = isWebcamFrameSourceReady();
  const webcamInteractionActive = currentMode === MODE.WEBCAM && webcamActive && !splashOpen;

  elapsedTime += deltaSeconds;
  mainCamera.position.set(
    camRadius * Math.sin(camPhi) * Math.sin(camTheta),
    camRadius * Math.cos(camPhi),
    camRadius * Math.sin(camPhi) * Math.cos(camTheta),
  );
  mainCamera.lookAt(0, 0, 0);
  mainCamera.updateProjectionMatrix();
  mainCamera.updateMatrixWorld();
  surfaceUniforms.u_time.value = elapsedTime;
  updateObjectFade(now);
  updateAxisGizmoLayout();
  surfaceUniforms.u_noiseScale.value = params.noiseScale;
  surfaceUniforms.u_noiseSpeed.value = params.noiseSpeed;
  surfaceUniforms.u_highFreq.value = 0.0;
  const audioReactiveActive = params.audioReactive && isAudioActive();
  const colorReactiveActive = params.colorReactive && audioReactiveActive;
  const frequencyData = audioReactiveActive ? getAudioFrequencyData() : null;
  let displacementChanged = false;
  let shouldComposeDisplacement = false;

  if (
    webcamInteractionActive &&
    pageVisible &&
    !webcamFrameSourceReady &&
    !videoRecoveryInProgress &&
    now - lastWebcamRecoveryAt >= WEBCAM_RESTART_COOLDOWN_MS
  ) {
    void recoverWebcam();
  }

  if (
    webcamInteractionActive &&
    hands &&
    pageVisible &&
    webcamFrameSourceReady &&
    !mediaPipeSendInFlight &&
    !mediaPipeRecoveryInProgress &&
    !videoRecoveryInProgress
  ) {
    sendFrameToMediaPipe(hands);
  }

  if (
    webcamInteractionActive &&
    hands &&
    pageVisible &&
    webcamFrameSourceReady &&
    mediaPipeSendInFlight &&
    !mediaPipeRecoveryInProgress &&
    !videoRecoveryInProgress &&
    now - mediaPipeSendStartedAt > HAND_RESULTS_STALL_TIMEOUT_MS
  ) {
    void recoverMediaPipe();
  }

  if (splashOpen) {
    resetInputState();
    clearHandOutput(0);
    clearHandOutput(1);
    setGestureCameraFeedback();
  } else if (currentMode === MODE.WEBCAM) {
    updateWebcamHandOutputs();
    updateWebcamDeformGestureLock();
    updateWebcamScaleGesture();
    setGestureCameraFeedback(updateGestureCamera(gestureState, handState, deltaSeconds));
  } else {
    resetWebcamScaleGesture();
    setGestureCameraFeedback();
    updateMouseInput(mainCamera, currentMesh, raycaster);
    updateMouseHandOutputs();
  }

  updateStretchRadius();
  displacementChanged = applyActiveDeformations(deltaSeconds) || displacementChanged;
  shouldComposeDisplacement = shouldComposeDisplacement || displacementChanged;

  if (audioReactiveActive) {
    const shimmerBoost = currentObjectType === OBJECTS.PARTICLES ? PARTICLE_AUDIO_BOOST : 1.0;
    let hasSignal = false;

    if (frequencyData) {
      displacementChanged = applyAudioFrequencyDisplacement(
        currentMesh,
        dispSystem,
        frequencyData,
        params.audioSensitivity,
        AUDIO_DISP_SCALE,
      ) || displacementChanged;
      const { dataArray } = getAudioAnalyser();

      if (dataArray) {
        let highSum = 0;

        for (let bin = 80; bin <= 127; bin += 1) {
          highSum += dataArray[bin];
        }

        const rawHighs = (highSum / 48) / 255.0;
        surfaceUniforms.u_highFreq.value = Math.min(
          1.0,
          rawHighs * params.audioSensitivity * shimmerBoost * 3.0,
        );
      }

      for (let index = 0; index < frequencyData.length; index += 1) {
        if (frequencyData[index] > 0) {
          hasSignal = true;
          break;
        }
      }
    }

    audioDisplacementWasActive = true;
    shouldComposeDisplacement = true;

    if (params.audioSensitivity > 0 && !hasSignal) {
      if (audioZeroSignalStartedAt === 0) {
        audioZeroSignalStartedAt = now;
      }

      if (now - audioZeroSignalStartedAt >= AUDIO_ZERO_SIGNAL_WARNING_DELAY_MS) {
        setAudioSignalWarning('No audio detected - check sharing settings.');
      }
    } else {
      audioZeroSignalStartedAt = 0;
      setAudioSignalWarning('');
    }
  } else {
    if (audioDisplacementWasActive) {
      displacementChanged = resetAudioDisplacementState() || displacementChanged;
      shouldComposeDisplacement = true;
    }

    audioDisplacementWasActive = false;
    audioZeroSignalStartedAt = 0;
    setAudioSignalWarning('');
  }

  if (colorReactiveActive && frequencyData) {
    const energy = getColorReactiveEnergy(frequencyData, params.audioSensitivity);
    const reactivePosition = getColorReactivePosition(energy);

    smoothedColorReactivePosition += (
      reactivePosition - smoothedColorReactivePosition
    ) * COLOR_REACTIVE_SMOOTHING;

    const reactiveColor = getColorAtPosition(smoothedColorReactivePosition);
    surfaceUniforms.u_color.value.setRGB(reactiveColor.r, reactiveColor.g, reactiveColor.b);
  } else {
    resetColorReactiveState();
    applySingleSurfaceColor();
  }

  if (shouldComposeDisplacement) {
    displacementChanged = composeDisplacement(dispSystem) || displacementChanged;
  }

  if (displacementChanged) {
    dispSystem.tex.needsUpdate = true;
  }

  renderer.setRenderTarget(null);
  renderer.render(mainScene, mainCamera);
}

loop();
openSplash();

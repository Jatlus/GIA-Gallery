import * as THREE from 'three';

import {
  CAM_ORBIT_SPEED,
  CAM_RADIUS_MAX,
  CAM_RADIUS_MIN,
  CAM_ZOOM_SPEED,
  GESTURE_CAMERA_MODE_EXIT_FIST_FRAMES,
  GESTURE_CAMERA_MODE_EXIT_LABEL_FRAMES,
  GESTURE_CAMERA_MODE_HOLD_FRAMES,
  GESTURE_CAMERA_MODE_STILL_THRESHOLD,
  GESTURE_OPEN_PALM_FRAMES_REQUIRED,
  PINCH_ACTIVE_THRESHOLD,
} from './constants.js';
import {
  camPhi,
  camRadius,
  camTheta,
  setCamPhi,
  setCamRadius,
  setCamTheta,
} from './scene.js';

let cameraGestureMode = false;
let cameraModeToggleFrames = 0;
let cameraModeExitFrames = 0;
let exitIndicatorFrames = 0;
let prevTwoHandPinchDist = null;

function stepFrameCounter(frames) {
  return frames > 0 ? frames - 1 : 0;
}

function buildFeedback(overrides = {}) {
  return {
    cameraModeActive: cameraGestureMode,
    zoomInActive: false,
    zoomOutActive: false,
    exitIndicatorFrames,
    orbitActive: false,
    orbitStartNDC: null,
    orbitEndNDC: null,
    ...overrides,
  };
}

function isStillPalm(gesture) {
  const deltaX = gesture.palmNDC.x - gesture.prevPalmNDC.x;
  const deltaY = gesture.palmNDC.y - gesture.prevPalmNDC.y;

  return Math.abs(deltaX) < GESTURE_CAMERA_MODE_STILL_THRESHOLD &&
    Math.abs(deltaY) < GESTURE_CAMERA_MODE_STILL_THRESHOLD;
}

export function isCameraGestureModeActive() {
  return cameraGestureMode;
}

export function exitCameraGestureMode() {
  cameraGestureMode = false;
  cameraModeToggleFrames = 0;
  cameraModeExitFrames = 0;
  exitIndicatorFrames = 0;
  prevTwoHandPinchDist = null;
}

export function resetGestureCameraState() {
  exitCameraGestureMode();
}

export function updateGestureCamera(gestureState, handState, deltaSeconds = 0) {
  exitIndicatorFrames = stepFrameCounter(exitIndicatorFrames);

  const bothOpenPalmsStill = gestureState[0].active &&
    gestureState[1].active &&
    gestureState[0].openPalm &&
    gestureState[1].openPalm &&
    isStillPalm(gestureState[0]) &&
    isStillPalm(gestureState[1]);
  const bothHandsFists = gestureState[0].active &&
    gestureState[1].active &&
    gestureState[0].fist &&
    gestureState[1].fist;

  if (!cameraGestureMode) {
    cameraModeToggleFrames = bothOpenPalmsStill
      ? cameraModeToggleFrames + 1
      : 0;
    cameraModeExitFrames = 0;
    prevTwoHandPinchDist = null;

    if (cameraModeToggleFrames >= GESTURE_CAMERA_MODE_HOLD_FRAMES) {
      cameraGestureMode = true;
      cameraModeToggleFrames = 0;
    }

    return buildFeedback();
  }

  cameraModeToggleFrames = 0;
  cameraModeExitFrames = bothHandsFists
    ? cameraModeExitFrames + 1
    : 0;

  if (cameraModeExitFrames >= GESTURE_CAMERA_MODE_EXIT_FIST_FRAMES) {
    cameraGestureMode = false;
    cameraModeExitFrames = 0;
    exitIndicatorFrames = GESTURE_CAMERA_MODE_EXIT_LABEL_FRAMES;
    prevTwoHandPinchDist = null;
    return buildFeedback();
  }

  if (bothHandsFists) {
    prevTwoHandPinchDist = null;
    return buildFeedback();
  }

  if (bothOpenPalmsStill) {
    prevTwoHandPinchDist = null;
    return buildFeedback();
  }

  const bothHandsPinching = handState[0].active &&
    handState[1].active &&
    handState[0].pinchStrength > PINCH_ACTIVE_THRESHOLD &&
    handState[1].pinchStrength > PINCH_ACTIVE_THRESHOLD;

  if (bothHandsPinching) {
    const currentDist = handState[0].smoothedNDC.distanceTo(handState[1].smoothedNDC);

    if (prevTwoHandPinchDist !== null) {
      const delta = currentDist - prevTwoHandPinchDist;

      prevTwoHandPinchDist = currentDist;

      if (Math.abs(delta) >= 0.005) {
        setCamRadius(THREE.MathUtils.clamp(
          camRadius - delta * 8.0,
          CAM_RADIUS_MIN,
          CAM_RADIUS_MAX,
        ));
        return buildFeedback({
          zoomInActive: delta > 0,
          zoomOutActive: delta < 0,
        });
      }

      return buildFeedback();
    }

    prevTwoHandPinchDist = currentDist;
    return buildFeedback();
  }

  prevTwoHandPinchDist = null;

  const h0palm = gestureState[0].openPalm &&
    gestureState[0].openPalmFrames >= GESTURE_OPEN_PALM_FRAMES_REQUIRED &&
    gestureState[0].active;
  const h1palm = gestureState[1].openPalm &&
    gestureState[1].openPalmFrames >= GESTURE_OPEN_PALM_FRAMES_REQUIRED &&
    gestureState[1].active;

  if (h0palm && h1palm) {
    const vel0x = gestureState[0].palmNDC.x - gestureState[0].prevPalmNDC.x;
    const vel0y = gestureState[0].palmNDC.y - gestureState[0].prevPalmNDC.y;
    const vel1x = gestureState[1].palmNDC.x - gestureState[1].prevPalmNDC.x;
    const vel1y = gestureState[1].palmNDC.y - gestureState[1].prevPalmNDC.y;
    const dot = vel0x * vel1x + vel0y * vel1y;

    if (dot > 0.0) {
      const avgVelX = (vel0x + vel1x) * 0.5;
      const avgVelY = (vel0y + vel1y) * 0.5;

      setCamTheta(camTheta - avgVelX * CAM_ORBIT_SPEED * 70);
      setCamPhi(THREE.MathUtils.clamp(
        camPhi + avgVelY * CAM_ORBIT_SPEED * 70,
        0.1,
        Math.PI - 0.1,
      ));
      return buildFeedback({
        orbitActive: true,
        orbitStartNDC: gestureState[0].palmNDC,
        orbitEndNDC: gestureState[1].palmNDC,
      });
    }
  }

  return buildFeedback();
}

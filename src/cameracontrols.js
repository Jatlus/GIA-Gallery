import * as THREE from 'three';

import {
  CAM_ORBIT_SPEED,
  CAM_RADIUS_MAX,
  CAM_RADIUS_MIN,
  CAM_ZOOM_SPEED,
} from './constants.js';
import {
  camPhi,
  camRadius,
  camTheta,
  setCamPhi,
  setCamRadius,
  setCamTheta,
} from './scene.js';

let attachedCanvas = null;
export let orbitActive = false;
export let rightMouseDownHitsMesh = false;

const controlContext = {
  getCurrentCamera: () => null,
  getCurrentMesh: () => null,
  getRaycaster: () => null,
  isEnabled: () => true,
};
const orbitState = {
  lastClient: new THREE.Vector2(),
};
const tempMouseNDC = new THREE.Vector2();

function mouseToNDC(clientX, clientY) {
  tempMouseNDC.set(
    (clientX / window.innerWidth) * 2.0 - 1.0,
    -((clientY / window.innerHeight) * 2.0 - 1.0),
  );

  return tempMouseNDC;
}

function resetOrbitState() {
  orbitActive = false;
  rightMouseDownHitsMesh = false;
  orbitState.lastClient.set(0, 0);
}

function orbitControlsEnabled() {
  return controlContext.isEnabled?.() === true;
}

function onMouseDown(event) {
  if (event.button !== 2 || !orbitControlsEnabled()) {
    return;
  }

  event.preventDefault();

  const camera = controlContext.getCurrentCamera?.();
  const currentMesh = controlContext.getCurrentMesh?.();
  const raycaster = controlContext.getRaycaster?.();

  resetOrbitState();

  if (!camera || !currentMesh || !raycaster) {
    return;
  }

  raycaster.setFromCamera(mouseToNDC(event.clientX, event.clientY), camera);

  if (raycaster.intersectObject(currentMesh).length > 0) {
    rightMouseDownHitsMesh = true;
    return;
  }

  orbitActive = true;
  orbitState.lastClient.set(event.clientX, event.clientY);
}

function onMouseMove(event) {
  if (!orbitActive) {
    return;
  }

  if (!orbitControlsEnabled()) {
    resetOrbitState();
    return;
  }

  const dx = event.clientX - orbitState.lastClient.x;
  const dy = event.clientY - orbitState.lastClient.y;

  orbitState.lastClient.set(event.clientX, event.clientY);
  setCamTheta(camTheta - dx * CAM_ORBIT_SPEED);
  setCamPhi(THREE.MathUtils.clamp(camPhi + dy * CAM_ORBIT_SPEED, 0.1, Math.PI - 0.1));
}

function onMouseUp(event) {
  if (event.button === 2) {
    resetOrbitState();
  }
}

function onMouseLeave() {
  resetOrbitState();
}

function onWheel(event) {
  if (!orbitControlsEnabled() || !event.ctrlKey) {
    return;
  }

  event.preventDefault();

  const delta = event.deltaY > 0 ? CAM_ZOOM_SPEED : -CAM_ZOOM_SPEED;

  setCamRadius(THREE.MathUtils.clamp(camRadius + delta, CAM_RADIUS_MIN, CAM_RADIUS_MAX));
}

export function configureCameraControls(options = {}) {
  Object.assign(controlContext, options);
}

export function attachCameraControlListeners(canvas) {
  if (attachedCanvas === canvas) {
    return;
  }

  if (attachedCanvas) {
    detachCameraControlListeners(attachedCanvas);
  }

  attachedCanvas = canvas;
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
}

export function detachCameraControlListeners(canvas) {
  if (attachedCanvas !== canvas) {
    return;
  }

  canvas.removeEventListener('mousedown', onMouseDown);
  canvas.removeEventListener('mousemove', onMouseMove);
  canvas.removeEventListener('mouseup', onMouseUp);
  canvas.removeEventListener('mouseleave', onMouseLeave);
  canvas.removeEventListener('wheel', onWheel);
  resetOrbitState();
  attachedCanvas = null;
}

export function resetCameraControlState() {
  resetOrbitState();
}

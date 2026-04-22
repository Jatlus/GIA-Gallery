import * as THREE from 'three';

import {
  AXIS_DRAG_SCALE_PER_PIXEL,
  LERP_FACTOR,
  MOUSE_INDICATOR_BORDER_WIDTH,
  MOUSE_INDICATOR_SIZE,
  MOUSE_INDICATOR_Z_INDEX,
} from './constants.js';
import { rightMouseDownHitsMesh } from './cameracontrols.js';
import { handState, resetAllHandState } from './hands.js';
import { resolveHitUV } from './surface.js';

let attachedCanvas = null;
let indicator = null;
let leftDown = false;
let rightDown = false;
const axisDragState = {
  active: false,
  axis: '',
  lastClient: new THREE.Vector2(),
};
const interactionContext = {
  getAxisMeshes: () => [],
  getCurrentCamera: () => null,
  getRaycaster: () => null,
  onAxisDragStateChange: null,
  onAxisScaleDelta: null,
};
const rawMouseNDC = new THREE.Vector2();
const rawRightNDC = new THREE.Vector2();
const smoothMouseNDC = new THREE.Vector2();
const tempAxisDirection = new THREE.Vector2();
const tempAxisScreenEnd = new THREE.Vector2();
const tempAxisScreenStart = new THREE.Vector2();
const tempClientDelta = new THREE.Vector2();
const tempProjectedPoint = new THREE.Vector3();

const AXIS_WORLD_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

export function configureMouseInteraction(options = {}) {
  Object.assign(interactionContext, options);
}

function ensureIndicator() {
  if (indicator) {
    return indicator;
  }

  indicator = document.createElement('div');
  indicator.id = 'gia-mouse-indicator';
  indicator.style.cssText = `position:fixed;width:${MOUSE_INDICATOR_SIZE}px;height:${MOUSE_INDICATOR_SIZE}px;` +
    `border-radius:50%;border:${MOUSE_INDICATOR_BORDER_WIDTH}px solid rgba(255,255,255,0.72);` +
    `pointer-events:none;z-index:${MOUSE_INDICATOR_Z_INDEX};transform:translate(-50%,-50%);display:none;`;
  document.body.appendChild(indicator);

  return indicator;
}

function showIndicator(clientX, clientY) {
  const mouseIndicator = ensureIndicator();

  mouseIndicator.style.left = `${clientX}px`;
  mouseIndicator.style.top = `${clientY}px`;
  mouseIndicator.style.display = 'block';
}

function hideIndicator() {
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function updateCursor() {
  if (!attachedCanvas) {
    return;
  }

  attachedCanvas.style.cursor = leftDown ? 'grabbing' : 'crosshair';
}

function resetMouseButtons() {
  leftDown = false;
  rightDown = false;
}

function clearHand(index) {
  handState[index].active = false;
  handState[index].pinchStrength = 0;
  handState[index].surfaceHit = false;
  handState[index].assignmentKey = '';
}

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

  projectWorldPointToScreen(new THREE.Vector3(0, 0, 0), camera, tempAxisScreenStart);
  projectWorldPointToScreen(axisVector, camera, tempAxisScreenEnd);
  target.subVectors(tempAxisScreenEnd, tempAxisScreenStart);

  if (target.lengthSq() <= Number.EPSILON) {
    return false;
  }

  target.normalize();
  return true;
}

function endAxisDrag() {
  if (!axisDragState.active) {
    return;
  }

  interactionContext.onAxisDragStateChange?.({
    active: false,
    axis: axisDragState.axis,
    source: 'mouse',
  });
  axisDragState.active = false;
  axisDragState.axis = '';
}

function beginAxisDrag(axis, clientX, clientY) {
  axisDragState.active = true;
  axisDragState.axis = axis;
  axisDragState.lastClient.set(clientX, clientY);
  interactionContext.onAxisDragStateChange?.({
    active: true,
    axis,
    source: 'mouse',
  });
}

function resolveAxisHit(clientX, clientY) {
  const camera = interactionContext.getCurrentCamera?.();
  const raycaster = interactionContext.getRaycaster?.();
  const axisMeshes = interactionContext.getAxisMeshes?.() ?? [];

  if (!camera || !raycaster || axisMeshes.length === 0) {
    return '';
  }

  raycaster.setFromCamera(mouseToNDC(clientX, clientY), camera);

  const axisHit = raycaster.intersectObjects(axisMeshes, false)
    .find(hit => typeof hit.object.userData.axis === 'string');

  return axisHit?.object.userData.axis ?? '';
}

function updateAxisDrag(clientX, clientY) {
  if (!axisDragState.active || typeof interactionContext.onAxisScaleDelta !== 'function') {
    return;
  }

  const camera = interactionContext.getCurrentCamera?.();

  if (!camera || !getAxisScreenDirection(axisDragState.axis, camera, tempAxisDirection)) {
    axisDragState.lastClient.set(clientX, clientY);
    return;
  }

  tempClientDelta.set(
    clientX - axisDragState.lastClient.x,
    clientY - axisDragState.lastClient.y,
  );

  const projectedDelta = tempClientDelta.dot(tempAxisDirection);

  if (projectedDelta !== 0) {
    interactionContext.onAxisScaleDelta(axisDragState.axis, projectedDelta * AXIS_DRAG_SCALE_PER_PIXEL);
  }

  axisDragState.lastClient.set(clientX, clientY);
}

function mouseToNDC(clientX, clientY) {
  return new THREE.Vector2(
    (clientX / window.innerWidth) * 2.0 - 1.0,
    -((clientY / window.innerHeight) * 2.0 - 1.0),
  );
}

function onMouseDown(event) {
  if (event.button === 0) {
    leftDown = true;
    rawMouseNDC.copy(mouseToNDC(event.clientX, event.clientY));
    smoothMouseNDC.copy(rawMouseNDC);

    const axis = resolveAxisHit(event.clientX, event.clientY);

    if (axis) {
      beginAxisDrag(axis, event.clientX, event.clientY);
      clearHand(0);
      clearHand(1);
    }
  }

  if (event.button === 2) {
    if (rightMouseDownHitsMesh) {
      rightDown = true;
      rawRightNDC.copy(mouseToNDC(event.clientX, event.clientY));
      if (!leftDown) {
        rawMouseNDC.copy(rawRightNDC);
        smoothMouseNDC.copy(rawRightNDC);
      }
    } else {
      rightDown = false;
      clearHand(1);
    }
  }

  showIndicator(event.clientX, event.clientY);
  updateCursor();
}

function onMouseMove(event) {
  showIndicator(event.clientX, event.clientY);

  if (axisDragState.active) {
    updateAxisDrag(event.clientX, event.clientY);
    return;
  }

  if (leftDown || rightDown) {
    rawMouseNDC.copy(mouseToNDC(event.clientX, event.clientY));
  }
}

function onMouseUp(event) {
  if (event.button === 0) {
    leftDown = false;
    endAxisDrag();
  }

  if (event.button === 2) {
    rightDown = false;
  }

  updateCursor();
}

function onMouseLeave() {
  endAxisDrag();
  resetMouseButtons();
  resetAllHandState();
  hideIndicator();
  updateCursor();
}

function onContextMenu(event) {
  event.preventDefault();
}

export function attachMouseListeners(canvas) {
  if (attachedCanvas === canvas) {
    updateCursor();
    return;
  }

  if (attachedCanvas) {
    detachMouseListeners(attachedCanvas);
  }

  ensureIndicator();
  attachedCanvas = canvas;
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.style.cursor = 'crosshair';
}

export function detachMouseListeners(canvas) {
  if (attachedCanvas !== canvas) {
    return;
  }

  endAxisDrag();
  canvas.removeEventListener('mousedown', onMouseDown);
  canvas.removeEventListener('mousemove', onMouseMove);
  canvas.removeEventListener('mouseup', onMouseUp);
  canvas.removeEventListener('mouseleave', onMouseLeave);
  canvas.removeEventListener('contextmenu', onContextMenu);
  resetMouseButtons();
  hideIndicator();
  canvas.style.cursor = 'default';
  attachedCanvas = null;
}

export function resetMouseInteractionState() {
  endAxisDrag();
  resetMouseButtons();
  clearHand(0);
  clearHand(1);
}

export function updateMouseInput(camera, currentMesh, raycaster) {
  if (axisDragState.active) {
    resetAllHandState();
    return;
  }

  if (!leftDown && !rightDown) {
    resetAllHandState();
    return;
  }

  smoothMouseNDC.lerp(rawMouseNDC, LERP_FACTOR);
  handState[0].rawNDC.copy(rawMouseNDC);
  handState[0].smoothedNDC.copy(smoothMouseNDC);

  raycaster.setFromCamera(smoothMouseNDC, camera);
  const hits = raycaster.intersectObject(currentMesh);

  if (hits.length > 0 && resolveHitUV(hits[0], currentMesh, handState[0].uv)) {
    handState[0].active = true;
    handState[0].pinchStrength = 1.0;
    handState[0].surfaceHit = true;
    handState[0].hitPoint.copy(hits[0].point);
  } else {
    clearHand(0);
  }

  if (rightDown) {
    handState[1].rawNDC.copy(rawRightNDC);
    handState[1].smoothedNDC.copy(rawRightNDC);
    raycaster.setFromCamera(rawRightNDC, camera);

    const rightHits = raycaster.intersectObject(currentMesh);

    if (rightHits.length > 0 && resolveHitUV(rightHits[0], currentMesh, handState[1].uv)) {
      handState[1].active = true;
      handState[1].pinchStrength = 1.0;
      handState[1].surfaceHit = true;
      handState[1].hitPoint.copy(rightHits[0].point);
    } else {
      clearHand(1);
    }
  } else {
    clearHand(1);
  }
}

import * as THREE from 'three';

import {
  CAM_PHI_DEFAULT,
  CAM_RADIUS_DEFAULT,
  CAM_THETA_DEFAULT,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CANVAS_Z_INDEX,
} from './constants.js';

export let camTheta = CAM_THETA_DEFAULT;
export let camPhi = CAM_PHI_DEFAULT;
export let camRadius = CAM_RADIUS_DEFAULT;

export function setCamTheta(value) {
  camTheta = value;
}

export function setCamPhi(value) {
  camPhi = value;
}

export function setCamRadius(value) {
  camRadius = value;
}

export function initScene() {
  const canvas = document.getElementById('app-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  const mainScene = new THREE.Scene();
  const mainCamera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR,
  );

  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    display: 'block',
    zIndex: String(CANVAS_Z_INDEX),
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const handleResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    mainCamera.aspect = window.innerWidth / window.innerHeight;
    mainCamera.updateProjectionMatrix();
  };

  window.addEventListener('resize', handleResize);

  return { mainScene, mainCamera, renderer };
}

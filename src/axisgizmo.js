import * as THREE from 'three';

const AXIS_EXTENT = 3;
const TUBE_RADIUS = 0.015;
const GLOW_RADIUS = 0.030;
const ARROW_RADIUS = 0.10;
const ARROW_HEIGHT = 0.20;
const AXIS_SEGMENTS = 16;
const LABEL_SIZE = 48;
const LABEL_FONT_SIZE = 24;
const LABEL_SCALE = 0.15;
const AXIS_LENGTH = AXIS_EXTENT * 2;
const AXIS_CLEARANCE = 1.5;
const LABEL_MARGIN = 0.14;
const GLOW_OPACITY = 0.08;
const GLOW_HIGHLIGHT_OPACITY = 0.24;
const HIGHLIGHT_BLEND = 0.35;
const DISABLED_RAYCAST = () => {};

function tagAxisMesh(mesh, axis, color) {
  mesh.userData.axis = axis;
  mesh.userData.baseColor = color;
  mesh.userData.baseOpacity = typeof mesh.material.opacity === 'number' ? mesh.material.opacity : 1;
  mesh.userData.defaultRaycast = mesh.raycast;
}

function setMeshRaycastEnabled(mesh, enabled) {
  if (enabled) {
    mesh.raycast = mesh.userData.defaultRaycast;
    return;
  }

  mesh.raycast = DISABLED_RAYCAST;
}

function setMeshHighlight(mesh, active) {
  const baseColor = mesh.userData.baseColor;

  if (typeof baseColor === 'number') {
    mesh.material.color.setHex(baseColor);

    if (active) {
      mesh.material.color.lerp(new THREE.Color(0xffffff), HIGHLIGHT_BLEND);
    }
  }

  if (mesh.material.transparent) {
    mesh.material.opacity = active ? GLOW_HIGHLIGHT_OPACITY : mesh.userData.baseOpacity;
  }
}

function createLabelSprite(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = LABEL_SIZE;
  canvas.height = LABEL_SIZE;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = `${LABEL_FONT_SIZE}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width * 0.5, canvas.height * 0.5);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);

  sprite.scale.setScalar(LABEL_SCALE);

  return sprite;
}

function createAxisGroup(axis, label, color, rotation) {
  const group = new THREE.Object3D();
  const coreMaterial = new THREE.MeshBasicMaterial({ color });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: GLOW_OPACITY,
    depthWrite: false,
  });

  const coreTube = new THREE.Mesh(
    new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, AXIS_LENGTH, AXIS_SEGMENTS),
    coreMaterial,
  );
  const glowTube = new THREE.Mesh(
    new THREE.CylinderGeometry(GLOW_RADIUS, GLOW_RADIUS, AXIS_LENGTH, AXIS_SEGMENTS),
    glowMaterial,
  );
  const arrowhead = new THREE.Mesh(
    new THREE.ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 8),
    coreMaterial.clone(),
  );
  const labelSprite = createLabelSprite(label);

  tagAxisMesh(coreTube, axis, color);
  tagAxisMesh(glowTube, axis, color);
  tagAxisMesh(arrowhead, axis, color);

  group.add(glowTube, coreTube, arrowhead, labelSprite);
  group.rotation.copy(rotation);

  const axisGroup = {
    arrowhead,
    coreTube,
    dragMeshes: [glowTube, coreTube, arrowhead],
    group,
    halfLength: AXIS_EXTENT,
    highlightMeshes: [glowTube, coreTube, arrowhead],
    labelSprite,
    glowTube,
  };

  setAxisHalfLength(axisGroup, AXIS_EXTENT);

  return axisGroup;
}

function setAxisHalfLength(axisGroup, halfLength) {
  const clampedHalfLength = Math.max(AXIS_EXTENT, halfLength);
  const stretch = clampedHalfLength / AXIS_EXTENT;

  axisGroup.halfLength = clampedHalfLength;
  axisGroup.coreTube.scale.y = stretch;
  axisGroup.glowTube.scale.y = stretch;
  axisGroup.arrowhead.position.y = clampedHalfLength + (ARROW_HEIGHT * 0.5);
  axisGroup.labelSprite.position.y = clampedHalfLength + ARROW_HEIGHT + LABEL_MARGIN;
}

export function createAxisGizmo(scene) {
  const axisGizmo = new THREE.Object3D();
  const xAxis = createAxisGroup('x', 'X', 0xFF6B6B, new THREE.Euler(0, 0, -Math.PI / 2));
  const yAxis = createAxisGroup('y', 'Y', 0x4ECDC4, new THREE.Euler(0, 0, 0));
  const zAxis = createAxisGroup('z', 'Z', 0x9B8EC4, new THREE.Euler(Math.PI / 2, 0, 0));

  axisGizmo.name = 'axisGizmo';
  axisGizmo.userData.axisGroups = {
    x: xAxis,
    y: yAxis,
    z: zAxis,
  };
  axisGizmo.userData.axisMeshes = [
    ...xAxis.dragMeshes,
    ...yAxis.dragMeshes,
    ...zAxis.dragMeshes,
  ];
  axisGizmo.add(xAxis.group, yAxis.group, zAxis.group);

  scene.add(axisGizmo);

  return axisGizmo;
}

export function getAxisMeshes(axisGizmo) {
  return axisGizmo.userData.axisMeshes ?? [];
}

export function setAxisDragHighlight(axisGizmo, axis, active) {
  const axisGroup = axisGizmo.userData.axisGroups?.[axis];

  if (!axisGroup) {
    return;
  }

  axisGroup.highlightMeshes.forEach(mesh => {
    setMeshHighlight(mesh, active);
  });
}

export function updateAxisLengths(axisGizmo, halfExtents) {
  const axisGroups = axisGizmo.userData.axisGroups;

  if (!axisGroups || !halfExtents) {
    return;
  }

  setAxisHalfLength(axisGroups.x, halfExtents.x + AXIS_CLEARANCE);
  setAxisHalfLength(axisGroups.y, halfExtents.y + AXIS_CLEARANCE);
  setAxisHalfLength(axisGroups.z, halfExtents.z + AXIS_CLEARANCE);
}

export function setAxisVisible(axisGizmo, visible) {
  axisGizmo.visible = visible;
  getAxisMeshes(axisGizmo).forEach(mesh => {
    setMeshRaycastEnabled(mesh, visible);
  });
}

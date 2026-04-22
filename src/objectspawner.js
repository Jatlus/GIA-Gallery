import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {
  CUBE_SEGMENTS,
  CUBE_SIZE,
  ICOSAHEDRON_DETAIL,
  ICOSAHEDRON_RADIUS,
  OBJECT_FADE_DURATION_MS,
  PARTICLE_COUNT,
  PARTICLE_DISPLACEMENT_SCALE,
  PARTICLE_NOISE_AMPLITUDE,
  PARTICLE_POINT_SIZE,
  PARTICLE_POINT_SIZE_MIN,
  PARTICLE_POINT_SIZE_SCALE,
  PARTICLE_RADIUS,
  PLANE_SEGMENTS,
  PLANE_SIZE,
  SPHERE_HEIGHT_SEGMENTS,
  SPHERE_RADIUS,
  SPHERE_WIDTH_SEGMENTS,
  SURFACE_NOISE_AMPLITUDE,
  SURFACE_OPACITY_DEFAULT,
  SURFACE_ROTATION_X,
  TORUS_KNOT_RADIAL_SEGMENTS,
  TORUS_KNOT_RADIUS,
  TORUS_KNOT_TUBULAR_SEGMENTS,
  TORUS_KNOT_TUBE_RADIUS,
  TORUS_RADIAL_SEGMENTS,
  TORUS_RADIUS,
  TORUS_TUBULAR_SEGMENTS,
  TORUS_TUBE_RADIUS,
} from './constants.js';
import { createDisplacementSystem } from './surface.js';
import fragSrc from './shaders/surface.frag?raw';
import noiseGlsl from 'glsl-noise/simplex/3d.glsl?raw';

export const OBJECTS = {
  PLANE: 'Plane',
  SPHERE: 'Sphere',
  CUBE: 'Cube',
  TORUS: 'Torus',
  TORUSKNOT: 'Torus Knot',
  ICOSAHEDRON: 'Icosahedron',
  PARTICLES: 'Particles',
};

export const OBJECT_OPTIONS = Object.values(OBJECTS);

const TWO_PI = Math.PI * 2;
const particleVert = `${noiseGlsl}

uniform float u_time;
uniform float u_noiseScale;
uniform float u_noiseSpeed;
uniform sampler2D u_displacementTex;
uniform float u_texSide;
uniform float u_highFreq;
uniform float u_noiseAmplitude;
uniform float u_pointSize;
uniform float u_pointSizeScale;
uniform float u_pointSizeMin;
uniform float u_displacementScale;
uniform float u_objectUniformScale;

out float vHeight;
out vec3 vWorldPosition;

void main() {
  float vertIdx = float(gl_VertexID);
  float u = (mod(vertIdx, u_texSide) + 0.5) / u_texSide;
  float v = (floor(vertIdx / u_texSide) + 0.5) / u_texSide;
  float disp = texture(u_displacementTex, vec2(u, v)).r;
  vec3 radialDirection = length(position) > 0.0001 ? normalize(position) : vec3(0.0, 1.0, 0.0);
  float baseHeight = snoise(position * u_noiseScale + vec3(u_time * u_noiseSpeed)) * u_noiseAmplitude
    + disp * u_displacementScale;
  float shimmer = 0.0;

  if (u_highFreq > 0.0) {
    shimmer = snoise(vec3(
      position.x * 8.0 + u_time * 4.0,
      position.y * 8.0 + u_time * 3.7,
      position.z * 8.0 + u_time * 4.3
    )) * u_highFreq * 0.15;
  }

  float height = baseHeight + shimmer;
  vec3 displaced = position + radialDirection * height;
  vec4 baseWorldPosition = modelMatrix * vec4(position, 1.0);
  vec3 worldDisplacementDirection = normalize(mat3(modelMatrix) * radialDirection);
  vec4 worldPosition = vec4(
    baseWorldPosition.xyz + worldDisplacementDirection * (height * u_objectUniformScale),
    1.0
  );
  vec4 mvPosition = viewMatrix * worldPosition;

  vHeight = displaced.y;
  vWorldPosition = worldPosition.xyz;
  gl_PointSize = max((u_pointSize * u_pointSizeScale) / max(-mvPosition.z, 0.0001), u_pointSizeMin);
  gl_Position = projectionMatrix * mvPosition;
}`;

function createCubeUVAttribute(geometry) {
  const positions = geometry.attributes.position;
  const uvs = new Float32Array(positions.count * 2);
  const halfSize = CUBE_SIZE * 0.5;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const absZ = Math.abs(z);
    let u = 0.5;
    let v = 0.5;

    if (absX >= absY && absX >= absZ) {
      u = (z + halfSize) / CUBE_SIZE;
      v = (y + halfSize) / CUBE_SIZE;
    } else if (absY >= absX && absY >= absZ) {
      u = (x + halfSize) / CUBE_SIZE;
      v = (z + halfSize) / CUBE_SIZE;
    } else {
      u = (x + halfSize) / CUBE_SIZE;
      v = (y + halfSize) / CUBE_SIZE;
    }

    const uvOffset = index * 2;

    uvs[uvOffset] = THREE.MathUtils.clamp(u, 0, 1);
    uvs[uvOffset + 1] = THREE.MathUtils.clamp(v, 0, 1);
  }

  return new THREE.Float32BufferAttribute(uvs, 2);
}

function createWeldedCubeGeometry() {
  const geometry = new THREE.BoxGeometry(
    CUBE_SIZE,
    CUBE_SIZE,
    CUBE_SIZE,
    CUBE_SEGMENTS,
    CUBE_SEGMENTS,
    CUBE_SEGMENTS,
  );

  // BoxGeometry duplicates seam vertices per face; strip face-local attrs first so mergeVertices can weld them.
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');

  const weldedGeometry = mergeVertices(geometry);

  weldedGeometry.setAttribute('uv', createCubeUVAttribute(weldedGeometry));
  weldedGeometry.computeVertexNormals();

  return weldedGeometry;
}

function createParticleGeometry() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const uvs = new Float32Array(PARTICLE_COUNT * 2);

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const theta = Math.random() * TWO_PI;
    const phi = Math.acos(1.0 - 2.0 * Math.random());
    const radius = PARTICLE_RADIUS * Math.cbrt(Math.random());
    const sinPhi = Math.sin(phi);
    const x = radius * sinPhi * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * sinPhi * Math.sin(theta);
    const positionOffset = index * 3;
    const uvOffset = index * 2;
    const length = Math.hypot(x, y, z) || 1.0;
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    positions[positionOffset] = x;
    positions[positionOffset + 1] = y;
    positions[positionOffset + 2] = z;
    uvs[uvOffset] = 0.5 + Math.atan2(nz, nx) / TWO_PI;
    uvs[uvOffset + 1] = 0.5 - Math.asin(Math.max(-1.0, Math.min(1.0, ny))) / Math.PI;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  return geometry;
}

function createGeometry(type) {
  switch (type) {
    case OBJECTS.SPHERE:
      return new THREE.SphereGeometry(
        SPHERE_RADIUS,
        SPHERE_WIDTH_SEGMENTS,
        SPHERE_HEIGHT_SEGMENTS,
      );
    case OBJECTS.CUBE:
      return createWeldedCubeGeometry();
    case OBJECTS.TORUS:
      return new THREE.TorusGeometry(
        TORUS_RADIUS,
        TORUS_TUBE_RADIUS,
        TORUS_RADIAL_SEGMENTS,
        TORUS_TUBULAR_SEGMENTS,
      );
    case OBJECTS.TORUSKNOT:
      return new THREE.TorusKnotGeometry(
        TORUS_KNOT_RADIUS,
        TORUS_KNOT_TUBE_RADIUS,
        TORUS_KNOT_TUBULAR_SEGMENTS,
        TORUS_KNOT_RADIAL_SEGMENTS,
      );
    case OBJECTS.ICOSAHEDRON:
      return new THREE.IcosahedronGeometry(ICOSAHEDRON_RADIUS, ICOSAHEDRON_DETAIL);
    case OBJECTS.PARTICLES:
      return createParticleGeometry();
    case OBJECTS.PLANE:
    default:
      return new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, PLANE_SEGMENTS, PLANE_SEGMENTS);
  }
}

function createParticleMaterial(sharedUniforms) {
  return new THREE.ShaderMaterial({
    fragmentShader: fragSrc,
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...sharedUniforms,
      u_noiseAmplitude: { value: PARTICLE_NOISE_AMPLITUDE },
      u_pointSize: { value: PARTICLE_POINT_SIZE },
      u_pointSizeScale: { value: PARTICLE_POINT_SIZE_SCALE },
      u_pointSizeMin: { value: PARTICLE_POINT_SIZE_MIN },
      u_displacementScale: { value: PARTICLE_DISPLACEMENT_SCALE },
    },
    vertexShader: particleVert,
  });
}

function configureSurfaceMaterial(type, surfaceMaterial, surfaceUniforms) {
  const flatShading = type === OBJECTS.ICOSAHEDRON;

  surfaceUniforms.u_facetStrength.value = type === OBJECTS.ICOSAHEDRON ? 1.0 : 0.0;
  surfaceUniforms.u_noiseAmplitude.value = SURFACE_NOISE_AMPLITUDE;

  if (surfaceMaterial.flatShading !== flatShading) {
    surfaceMaterial.flatShading = flatShading;
    surfaceMaterial.needsUpdate = true;
  }
}

function createObjectMesh(type, surfaceMaterial, surfaceUniforms) {
  const geometry = createGeometry(type);

  if (type === OBJECTS.PARTICLES) {
    const material = createParticleMaterial(surfaceUniforms);
    const particles = new THREE.Points(geometry, material);

    particles.userData.disposeMaterialOnRemove = true;
    return particles;
  }

  const mesh = new THREE.Mesh(geometry, surfaceMaterial);

  if (type === OBJECTS.PLANE) {
    mesh.rotation.x = SURFACE_ROTATION_X;
  }

  return mesh;
}

export function spawnObject(
  type,
  scene,
  currentMesh,
  dispSystem,
  surfaceMaterial,
  surfaceUniforms,
  options = {},
) {
  const { fadeIn = true } = options;
  const previousMesh = currentMesh;
  const previousTexture = dispSystem?.tex ?? null;

  const mesh = createObjectMesh(type, surfaceMaterial, surfaceUniforms);
  const nextDispSystem = createDisplacementSystem(mesh.geometry);

  configureSurfaceMaterial(type, surfaceMaterial, surfaceUniforms);
  nextDispSystem.data.fill(0);
  nextDispSystem.tex.needsUpdate = true;
  surfaceUniforms.u_displacementTex.value = nextDispSystem.tex;
  surfaceUniforms.u_texSide.value = nextDispSystem.side;
  surfaceUniforms.u_opacity.value = fadeIn ? 0.0 : SURFACE_OPACITY_DEFAULT;
  scene.add(mesh);

  if (previousMesh) {
    scene.remove(previousMesh);
    previousMesh.geometry.dispose();

    if (previousMesh.userData.disposeMaterialOnRemove) {
      previousMesh.material.dispose();
    }
  }

  previousTexture?.dispose();

  return {
    dispSystem: nextDispSystem,
    fadeDurationMs: fadeIn ? OBJECT_FADE_DURATION_MS : 0,
    mesh,
  };
}

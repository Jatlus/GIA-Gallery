import * as THREE from 'three';

import {
  AUDIO_SENSITIVITY_DEFAULT,
  BASE_FALLOFF_RADIUS,
  COLOR_DEFAULT_B,
  COLOR_DEFAULT_G,
  COLOR_DEFAULT_R,
  DECAY_DEFAULT,
  DEFORM_STRENGTH_DEFAULT,
  NOISE_SCALE_DEFAULT,
  NOISE_SPEED_DEFAULT,
  OBJECT_SCALE_DEFAULT,
  PLANE_SEGMENTS,
  PLANE_SIZE,
  SURFACE_DISPLACEMENT_SCALE,
  SURFACE_NOISE_AMPLITUDE,
  SURFACE_OPACITY_DEFAULT,
  SURFACE_ROTATION_X,
} from './constants.js';
import fragSrc from './shaders/surface.frag?raw';
import vertSrc from './shaders/surface.vert?raw';
import noiseGlsl from 'glsl-noise/simplex/3d.glsl?raw';

const fullVert = noiseGlsl + '\n' + vertSrc;
const tempWorldPosition = new THREE.Vector3();
const tempStretchCurrentSegmentDirection = new THREE.Vector3();
const tempStretchSegmentPoint = new THREE.Vector3();
const tempStretchSegmentOffset = new THREE.Vector3();
const AUDIO_VERTEX_SILENCE_FLOOR = 0.0005;
const AUDIO_LOG_FREQUENCY_SPREAD = 9;
const AUDIO_KICK_ATTACK = 0.5;
const AUDIO_KICK_RELEASE = 0.03;
const AUDIO_PIANO_ATTACK = 0.7;
const AUDIO_PIANO_RELEASE = 0.05;
const AUDIO_HIGH_ATTACK = 0.4;
const AUDIO_HIGH_RELEASE = 0.08;
const AUDIO_KICK_RANGE_END = 2;
const AUDIO_PIANO_RANGE_START = 3;
const AUDIO_LOW_PIANO_RANGE_END = 25;
const AUDIO_PIANO_RANGE_END = 100;
const AUDIO_SOFT_VOCAL_RANGE_START = 35;
const AUDIO_SOFT_VOCAL_RANGE_END = 55;
const AUDIO_KICK_BOOST = 2.5;
const AUDIO_PIANO_GUITAR_BOOST = 5.0;
const AUDIO_HIGH_BOOST = 4.0;
const AUDIO_SOFT_VOCAL_MULTIPLIER = 1.5;

function createEmptyDisplacementTexture() {
  const texture = new THREE.DataTexture(new Float32Array([0]), 1, 1, THREE.RedFormat, THREE.FloatType);

  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

export function createDisplacementSystem(geometry) {
  const vertCount = geometry.attributes.position.count;
  const position = geometry.attributes.position;
  const side = 2 ** Math.ceil(Math.log2(Math.max(1, Math.sqrt(vertCount))));
  const data = new Float32Array(side * side);
  const sculptData = new Float32Array(vertCount);
  const audioData = new Float32Array(vertCount);
  const previousAudioData = new Float32Array(vertCount);
  const previousPianoData = new Float32Array(vertCount);
  const tex = new THREE.DataTexture(data, side, side, THREE.RedFormat, THREE.FloatType);
  let meshMaxDist = 0;

  for (let index = 0; index < vertCount; index += 1) {
    const dist = Math.hypot(
      position.getX(index),
      position.getY(index),
      position.getZ(index),
    );

    if (dist > meshMaxDist) {
      meshMaxDist = dist;
    }
  }

  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;

  return {
    audioData,
    data,
    previousAudioData,
    previousPianoData,
    sculptData,
    tex,
    side,
    vertCount,
    meshMaxDist: Math.max(meshMaxDist * 0.85, Number.EPSILON),
  };
}

function getClampedBinIndex(normalizedValue, maxBinIndex) {
  return THREE.MathUtils.clamp(Math.floor(normalizedValue * maxBinIndex), 0, maxBinIndex);
}

function usesAngularFrequencyBlend(geometry) {
  return geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry';
}

function smoothAudioSample(previousValue, nextValue, attack, release) {
  const rate = nextValue > previousValue ? attack : release;
  const smoothedValue = previousValue + ((nextValue - previousValue) * rate);

  return smoothedValue < AUDIO_VERTEX_SILENCE_FLOOR ? 0 : smoothedValue;
}

function getAudioSmoothingForBin(binIndex) {
  if (binIndex <= AUDIO_KICK_RANGE_END) {
    return { attack: AUDIO_KICK_ATTACK, release: AUDIO_KICK_RELEASE };
  }

  if (binIndex <= AUDIO_PIANO_RANGE_END) {
    return { attack: AUDIO_PIANO_ATTACK, release: AUDIO_PIANO_RELEASE };
  }

  return { attack: AUDIO_HIGH_ATTACK, release: AUDIO_HIGH_RELEASE };
}

function getAudioBoostForBin(binIndex) {
  let boost = AUDIO_HIGH_BOOST;

  if (binIndex <= AUDIO_KICK_RANGE_END) {
    boost = AUDIO_KICK_BOOST;
  } else if (binIndex >= AUDIO_PIANO_RANGE_START && binIndex <= AUDIO_PIANO_RANGE_END) {
    boost = AUDIO_PIANO_GUITAR_BOOST;
  }

  if (binIndex >= AUDIO_SOFT_VOCAL_RANGE_START && binIndex <= AUDIO_SOFT_VOCAL_RANGE_END) {
    boost *= AUDIO_SOFT_VOCAL_MULTIPLIER;
  }

  return boost;
}

function getFrequencyBinForVertex(geometry, localPosition, dispSystem, maxBinIndex) {
  let normalizedDistance = THREE.MathUtils.clamp(
    localPosition.length() / dispSystem.meshMaxDist,
    0,
    1,
  );

  if (usesAngularFrequencyBlend(geometry)) {
    const angle = (Math.atan2(localPosition.z, localPosition.x) / (Math.PI * 2)) + 0.5;

    normalizedDistance = THREE.MathUtils.clamp(
      (normalizedDistance * 0.8) + (angle * 0.2),
      0,
      1,
    );
  }

  const logDistance = Math.log1p(normalizedDistance * AUDIO_LOG_FREQUENCY_SPREAD) /
    Math.log1p(AUDIO_LOG_FREQUENCY_SPREAD);

  return getClampedBinIndex(logDistance, maxBinIndex);
}

export function clearDisplacement(dispSystem) {
  let changed = false;

  for (let index = 0; index < dispSystem.data.length; index += 1) {
    if (dispSystem.data[index] !== 0) {
      dispSystem.data[index] = 0;
      changed = true;
    }
  }

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    if (dispSystem.sculptData[index] !== 0) {
      dispSystem.sculptData[index] = 0;
      changed = true;
    }

    if (dispSystem.audioData[index] !== 0) {
      dispSystem.audioData[index] = 0;
      changed = true;
    }

    if (dispSystem.previousAudioData[index] !== 0) {
      dispSystem.previousAudioData[index] = 0;
      changed = true;
    }

    if (dispSystem.previousPianoData[index] !== 0) {
      dispSystem.previousPianoData[index] = 0;
      changed = true;
    }
  }

  if (changed) {
    dispSystem.tex.needsUpdate = true;
  }

  return changed;
}

export function applyAudioFrequencyDisplacement(
  mesh,
  dispSystem,
  frequencyData,
  sensitivity,
  audioScale,
) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const audioData = dispSystem.audioData;
  const previousAudioData = dispSystem.previousAudioData;
  const previousPianoData = dispSystem.previousPianoData;
  const maxBinIndex = Math.max(frequencyData.length - 1, 0);
  let changed = false;

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    tempWorldPosition.fromBufferAttribute(position, index);

    const binIndex = getFrequencyBinForVertex(
      geometry,
      tempWorldPosition,
      dispSystem,
      maxBinIndex,
    );
    const boost = getAudioBoostForBin(binIndex);
    const rawSample = frequencyData[binIndex] ?? 0;
    const binRatio = maxBinIndex > 0 ? binIndex / maxBinIndex : 0;
    const innerDampen = Math.sqrt(1 - binRatio);
    const outerBoost = 1 + (binRatio * 25);
    const isPianoBin = binIndex >= AUDIO_PIANO_RANGE_START && binIndex <= AUDIO_PIANO_RANGE_END;
    let finalBoost;

    if (binIndex >= AUDIO_PIANO_RANGE_START && binIndex <= AUDIO_LOW_PIANO_RANGE_END) {
      finalBoost = 6.0;
    } else if (binIndex > AUDIO_LOW_PIANO_RANGE_END && binIndex <= AUDIO_PIANO_RANGE_END) {
      finalBoost = outerBoost * innerDampen * 3.5;
    } else if (binIndex > 80) {
      // Let the edge-focused bins keep their full outer boost so the rim can actually reach the top band range.
      finalBoost = outerBoost;
    } else {
      finalBoost = outerBoost * innerDampen;
    }

    if (binIndex >= AUDIO_PIANO_RANGE_START && binIndex <= 20) {
      finalBoost *= 2.0;
    }

    const boostedValue = Math.min(255, rawSample * finalBoost);
    const boostedSample = (boostedValue / 255) * boost;
    let smoothedSample;

    if (isPianoBin) {
      // Piano transients were getting swallowed by the generic smoother, so keep a dedicated faster attack envelope.
      smoothedSample = smoothAudioSample(
        previousPianoData[index],
        boostedSample,
        AUDIO_PIANO_ATTACK,
        AUDIO_PIANO_RELEASE,
      );
      previousPianoData[index] = smoothedSample;
    } else {
      const smoothing = getAudioSmoothingForBin(binIndex);

      smoothedSample = smoothAudioSample(
        previousAudioData[index],
        boostedSample,
        smoothing.attack,
        smoothing.release,
      );
      previousAudioData[index] = smoothedSample;
    }

    const audioAmount = smoothedSample * sensitivity * audioScale;

    if (audioData[index] !== audioAmount) {
      audioData[index] = audioAmount;
      changed = true;
    }
  }

  return changed;
}

export function composeDisplacement(dispSystem) {
  let changed = false;

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    const combinedValue = dispSystem.sculptData[index] + dispSystem.audioData[index];

    if (dispSystem.data[index] !== combinedValue) {
      dispSystem.data[index] = combinedValue;
      changed = true;
    }
  }

  for (let index = dispSystem.vertCount; index < dispSystem.data.length; index += 1) {
    if (dispSystem.data[index] !== 0) {
      dispSystem.data[index] = 0;
      changed = true;
    }
  }

  return changed;
}

export function applyImpulse(hitPoint, strength, deformStrength, falloffRadius, mesh, sculptData, dispSystem) {
  const position = mesh.geometry.attributes.position;
  const radiusSquared = Math.max(falloffRadius * falloffRadius, Number.EPSILON);

  mesh.updateWorldMatrix(true, false);

  let changed = false;

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    tempWorldPosition
      .fromBufferAttribute(position, index)
      .applyMatrix4(mesh.matrixWorld);

    const dx = tempWorldPosition.x - hitPoint.x;
    const dy = tempWorldPosition.y - hitPoint.y;
    const dz = tempWorldPosition.z - hitPoint.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const falloff = Math.exp(-distanceSquared / radiusSquared);
    const impulse = falloff * strength * deformStrength;

    if (impulse !== 0) {
      const nextValue = sculptData[index] + impulse;

      if (sculptData[index] !== nextValue) {
        sculptData[index] = nextValue;
        changed = true;
      }
    }
  }

  return changed;
}

export function sampleDisplacementAtPoint(data, hitPoint, sampleRadius, mesh, dispSystem) {
  const position = mesh.geometry.attributes.position;
  const radiusSquared = Math.max(sampleRadius * sampleRadius, Number.EPSILON);
  let maxSample = 0;

  mesh.updateWorldMatrix(true, false);

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    const sourceValue = data[index];

    if (sourceValue <= 0) {
      continue;
    }

    tempWorldPosition
      .fromBufferAttribute(position, index)
      .applyMatrix4(mesh.matrixWorld);

    const dx = tempWorldPosition.x - hitPoint.x;
    const dy = tempWorldPosition.y - hitPoint.y;
    const dz = tempWorldPosition.z - hitPoint.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const weightedSample = sourceValue * Math.exp(-(distanceSquared / radiusSquared));

    if (weightedSample > maxSample) {
      maxSample = weightedSample;
    }
  }

  return maxSample;
}

function decayDisplacementValues(data, vertCount, decayStep, decayAmount) {
  if (decayAmount === 0) {
    return false;
  }

  const factor = 1.0 - (decayAmount * decayStep);
  let changed = false;

  for (let index = 0; index < vertCount; index += 1) {
    const nextValue = data[index] * factor;

    if (nextValue < 0.0005) {
      if (data[index] !== 0.0) {
        data[index] = 0.0;
        changed = true;
      }
      continue;
    }

    if (data[index] !== nextValue) {
      data[index] = nextValue;
      changed = true;
    }
  }

  return changed;
}

export function decaySnapshot(snapshotData, dispSystem, decayStep, decayAmount) {
  return decayDisplacementValues(
    snapshotData,
    dispSystem.vertCount,
    decayStep,
    decayAmount,
  );
}

export function applyDecay(sculptData, dispSystem, decayStep, decayAmount, stretchActive = false) {
  if (stretchActive) {
    return false;
  }

  return decayDisplacementValues(
    sculptData,
    dispSystem.vertCount,
    decayStep,
    decayAmount,
  );
}

export function applyStretchFromSnapshot(
  snapshotData,
  handPoints,
  sourceHeights,
  stretchRadius,
  mesh,
  dispSystem,
) {
  const position = mesh.geometry.attributes.position;
  const radiusSquared = Math.max(stretchRadius * stretchRadius, Number.EPSILON);
  const bridgeHeight = Math.max(sourceHeights[0] ?? 0, sourceHeights[1] ?? 0);
  const hand0Point = handPoints[0];
  const hand1Point = handPoints[1];
  const hasBridge = Boolean(hand0Point) && Boolean(hand1Point) && bridgeHeight > 0;
  let bridgeLengthSquared = 0;

  dispSystem.sculptData.set(snapshotData);
  mesh.updateWorldMatrix(true, false);

  if (hasBridge) {
    tempStretchCurrentSegmentDirection.subVectors(hand1Point, hand0Point);
    bridgeLengthSquared = tempStretchCurrentSegmentDirection.lengthSq();
  }

  for (let index = 0; index < dispSystem.vertCount; index += 1) {
    let stretchedValue = snapshotData[index];

    tempWorldPosition
      .fromBufferAttribute(position, index)
      .applyMatrix4(mesh.matrixWorld);

    if (hasBridge && bridgeLengthSquared > Number.EPSILON) {
      tempStretchSegmentOffset.subVectors(tempWorldPosition, hand0Point);
      const t = THREE.MathUtils.clamp(
        tempStretchSegmentOffset.dot(tempStretchCurrentSegmentDirection) / bridgeLengthSquared,
        0,
        1,
      );

      tempStretchSegmentPoint
        .copy(tempStretchCurrentSegmentDirection)
        .multiplyScalar(t)
        .add(hand0Point);

      const dx = tempWorldPosition.x - tempStretchSegmentPoint.x;
      const dy = tempWorldPosition.y - tempStretchSegmentPoint.y;
      const dz = tempWorldPosition.z - tempStretchSegmentPoint.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;

      stretchedValue = Math.max(
        stretchedValue,
        bridgeHeight * Math.exp(-(distanceSquared / radiusSquared)),
      );
    }

    dispSystem.sculptData[index] = stretchedValue;
  }

  return true;
}

export function resolveHitUV(hit, mesh, target) {
  if (hit.uv) {
    target.copy(hit.uv);
    return true;
  }

  const uvAttribute = mesh.geometry.attributes.uv;

  if (uvAttribute && typeof hit.index === 'number') {
    target.set(uvAttribute.getX(hit.index), uvAttribute.getY(hit.index));
    return true;
  }

  return false;
}

export function createSurfaceParams() {
  return {
    audioReactive: false,
    audioSensitivity: AUDIO_SENSITIVITY_DEFAULT,
    colorReactive: false,
    decay: DECAY_DEFAULT,
    deformStrength: DEFORM_STRENGTH_DEFAULT,
    falloffRadius: BASE_FALLOFF_RADIUS,
    noiseScale: NOISE_SCALE_DEFAULT,
    noiseSpeed: NOISE_SPEED_DEFAULT,
    objectScale: OBJECT_SCALE_DEFAULT,
    startStopAudio: () => {},
    showAxis: true,
  };
}

export function createSurface() {
  const uniforms = {
    u_displacementTex: { value: createEmptyDisplacementTexture() },
    u_texSide: { value: 1.0 },
    u_time: { value: 0 },
    u_noiseScale: { value: NOISE_SCALE_DEFAULT },
    u_noiseSpeed: { value: NOISE_SPEED_DEFAULT },
    u_color: {
      value: new THREE.Color(COLOR_DEFAULT_R, COLOR_DEFAULT_G, COLOR_DEFAULT_B),
    },
    u_highFreq: { value: 0.0 },
    u_facetStrength: { value: 0.0 },
    u_noiseAmplitude: { value: SURFACE_NOISE_AMPLITUDE },
    u_displacementScale: { value: SURFACE_DISPLACEMENT_SCALE },
    u_objectUniformScale: { value: OBJECT_SCALE_DEFAULT },
    u_opacity: { value: SURFACE_OPACITY_DEFAULT },
  };

  const geometry = new THREE.PlaneGeometry(
    PLANE_SIZE,
    PLANE_SIZE,
    PLANE_SEGMENTS,
    PLANE_SEGMENTS,
  );
  const material = new THREE.ShaderMaterial({
    fragmentShader: fragSrc,
    glslVersion: THREE.GLSL3,
    transparent: true,
    uniforms,
    vertexShader: fullVert,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.x = SURFACE_ROTATION_X;

  return { mesh, material, uniforms };
}

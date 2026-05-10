uniform float u_time;
uniform float u_noiseScale;
uniform float u_noiseSpeed;
uniform sampler2D u_displacementTex;
uniform float u_texSide;
uniform float u_highFreq;
uniform float u_noiseAmplitude;
uniform float u_displacementScale;
uniform float u_objectUniformScale;

out float vHeight;
out vec3 vWorldPosition;

void main() {
  float vertIdx = float(gl_VertexID);
  float u = (mod(vertIdx, u_texSide) + 0.5) / u_texSide;
  float v = (floor(vertIdx / u_texSide) + 0.5) / u_texSide;
  float disp = texture(u_displacementTex, vec2(u, v)).r;
  float baseHeight = snoise(vec3(position.xz * u_noiseScale + u_time * u_noiseSpeed, 0.0)) * u_noiseAmplitude
    + disp * u_displacementScale;
  float shimmer = 0.0;

  if (u_highFreq > 0.0) {
    shimmer = snoise(vec3(
      position.x * 12.0 + u_time * 6.0,
      position.y * 12.0 + u_time * 5.5,
      position.z * 12.0 + u_time * 6.3
    )) * u_highFreq * 0.4;
  }

  float height = baseHeight + shimmer;
  vec3 displaced = position + normal * height;
  vec4 baseWorldPosition = modelMatrix * vec4(position, 1.0);
  vec3 worldDisplacementDirection = normalize(mat3(modelMatrix) * normal);
  vec4 worldPosition = vec4(
    baseWorldPosition.xyz + worldDisplacementDirection * (height * u_objectUniformScale),
    1.0
  );
  vHeight = displaced.y;
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}

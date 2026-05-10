uniform vec3 u_color;
uniform float u_facetStrength;
uniform float u_opacity;

in float vHeight;
in vec3 vWorldPosition;
out vec4 fragColor;

void main() {
  float lightness = clamp(0.45 + vHeight * 0.18, 0.18, 0.8);

  if (u_facetStrength > 0.0) {
    vec3 faceNormal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    vec3 lightDirection = normalize(vec3(0.35, 0.9, 0.45));
    float facetLight = abs(dot(faceNormal, lightDirection));
    float facetedLightness = clamp(0.24 + facetLight * 0.5 + vHeight * 0.08, 0.18, 0.82);

    lightness = mix(lightness, facetedLightness, u_facetStrength);
  }

  float shade = clamp(lightness / 0.45, 0.4, 1.6);
  vec3 color = clamp(u_color * shade, 0.0, 1.0);

  fragColor = vec4(color, u_opacity);
}

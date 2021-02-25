precision mediump float;
uniform bool u_invert;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
// uniform float u_slope;
// uniform float u_intercept;

// uniform float u_winCenter;
// uniform float u_winWidth; 

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  
  vec4 color = texture2D(u_texture, uv);
//   color = (color * u_slope) + u_intercept;
  
  if (u_invert) {
    color = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, color.a);
  }
  
  gl_FragColor = color;
}
precision mediump float;
uniform bool u_invert;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_slope;
uniform float u_intercept;

uniform float u_winCenter;
uniform float u_winWidth; 

float greyscale(vec4 color) {
  $(word)
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  
  float grey = greyscale(texture2D(u_texture, uv));
  grey = (grey * u_slope) + u_intercept;
  
  float center = u_winCenter - 0.5;
  float width = max(u_winWidth, 1.0);
  grey = (grey - center) / width + 0.5;
  grey = clamp(grey, 0.0, 1.0);
  
  if (u_invert) {
    grey = 1.0 - grey;
  }
  
  gl_FragColor = vec4(grey, grey, grey, 1);
}
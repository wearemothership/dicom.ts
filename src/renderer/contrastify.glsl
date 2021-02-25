precision mediump float;
uniform bool u_invert;
uniform sampler2D u_minColor;
uniform sampler2D u_maxColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_slope;
uniform float u_intercept;

float greyscale(vec4 color) {
  $(word)
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  float minColor = greyscale(texture2D(u_minColor, vec2(0)));
  float maxColor = greyscale(texture2D(u_maxColor, vec2(0)));
  float grey = greyscale(texture2D(u_texture, uv));     
  float range = maxColor - minColor;
  grey = ((grey - minColor) / range);
  grey = (grey * u_slope) + u_intercept;
  if (u_invert) {
    grey = 1.0 - grey;
  }
  gl_FragColor = vec4(grey, grey, grey, 1);
}
precision highp float;
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

float minMaxWord(vec4 color) {
	$(minMaxWord)
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution;
	uv.y = 1.0 - uv.y;
	float grey = greyscale(texture2D(u_texture, uv));
	if (grey < 0.0) { // pixel padding value
		// TODO optimise out?
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}
	float minColor = minMaxWord(texture2D(u_minColor, vec2(0)));
	float maxColor = minMaxWord(texture2D(u_maxColor, vec2(0)));

	grey = grey * u_slope + u_intercept;
	minColor = minColor * u_slope + u_intercept;
	maxColor = maxColor * u_slope + u_intercept;

	float ww = maxColor - minColor;
	float wc = (minColor + maxColor) / 2.0 - 0.5;

	grey = ((grey - wc) / ww) + 0.5;
	grey = clamp(grey, 0.0, 1.0);

	if (u_invert) {
		grey = 1.0 - grey;
	}
	gl_FragColor = vec4(grey, grey, grey, 1);
}

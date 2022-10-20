#version 300 es

precision highp float;

in vec3 texcoord;
layout(location = 0) out vec4 out_0;

uniform highp sampler2D u_minColor;
uniform highp sampler2D u_maxColor;
uniform highp sampler3D u_texture;
uniform float u_slope;
uniform float u_intercept;

float greyscale(vec4 color) {
	$(word)
}

float minMaxWord(vec4 color) {
	$(minMaxWord)
}

void main() {
	float grey = greyscale(texture(u_texture, texcoord));
	// $(pixelPadding)
	float minColor = minMaxWord(texture(u_minColor, vec2(0)));
	float maxColor = minMaxWord(texture(u_maxColor, vec2(0)));

	grey = grey * u_slope + u_intercept;
	minColor = minColor * u_slope + u_intercept;
	maxColor = maxColor * u_slope + u_intercept;

	float ww = maxColor - minColor;
	float wc = (minColor + maxColor) / 2.0 - 0.5;

	grey = ((grey - wc) / ww) + 0.5;
	grey = clamp(grey, 0.0, 1.0);

	// $(shouldInvert)
	out_0 = vec4(grey, grey, grey, 1);
}

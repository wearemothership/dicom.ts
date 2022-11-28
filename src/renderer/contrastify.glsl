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
	/* check to see if the texture coordinates are all in the valid range, or abort otherwise*/
	const vec3 vzero = vec3(0.0,0.0,0.0);
	const vec3 vone = vec3(1.0,1.0,1.0);
	if(step(vzero, texcoord) != vone || step(texcoord, vone) != vone)
		discard;
		
	float grey = greyscale(texture(u_texture, texcoord));
	// $(pixelPadding)
	float minColor = minMaxWord(texture(u_minColor, vec2(0.5)));
	float maxColor = minMaxWord(texture(u_maxColor, vec2(0.5)));

	grey = grey * u_slope + u_intercept;
	minColor = minColor * u_slope + u_intercept;
	maxColor = maxColor * u_slope + u_intercept;

	float ww = maxColor - minColor;
	float wc = (minColor + maxColor) / 2.0 - 0.5;

	grey = ((grey - wc) / ww) + 0.5;
	grey = clamp(grey, 0.0, 1.0);

	// $(shouldInvert)
	out_0 =  vec4(grey, grey, grey, 1);
}

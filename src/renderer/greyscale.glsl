#version 300 es

precision highp float;

layout(location = 0) out vec4 out_0;

uniform highp sampler3D u_texture;
// uniform vec2 u_resolution;
uniform float u_slope;
uniform float u_intercept;

uniform float u_winCenter;
uniform float u_winWidth;

uniform vec4  u_modulation;

in vec3 texcoord;

float greyscale(vec4 color) {
	$(word)
}

void main() {
	/* check to see if the texture coordinates are all in the valid range, or abort otherwise*/
	const vec3 vzero = vec3(0.0,0.0,0.0);
	const vec3 vone = vec3(1.0,1.0,1.0);
	if(step(vzero, texcoord) != vone || step(texcoord, vone) != vone)
		discard;

	float grey = greyscale(texture(u_texture, texcoord));
	// $(pixelPadding)
	grey = (grey * u_slope) + u_intercept;

	float center = u_winCenter - 0.5;
	float width = max(u_winWidth, 1.0);
	grey = (grey - center) / width + 0.5;
	grey = clamp(grey, 0.0, 1.0);

	// $(shouldInvert)
	out_0 = vec4(grey, grey,grey, 1.0)*u_modulation;
}

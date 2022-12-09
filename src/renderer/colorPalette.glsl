#version 300 es

precision highp float;

in vec3 texcoord;
layout(location = 0) out vec4 out_0;

uniform bool u_invert;
uniform highp sampler3D u_texture;
uniform highp sampler2D u_redTexture;
uniform highp sampler2D u_greenTexture;
uniform highp sampler2D u_blueTexture;
uniform float u_paletteWidthRatio;
uniform vec4  u_modulation;

float getWord(vec4 color) {
	$(word)
}

float getPaletteWord(vec4 color) {
	$(paletteWord)
}

void main() {

	/* check to see if the texture coordinates are all in the valid range, or abort otherwise*/
	const vec3 vzero = vec3(0.0,0.0,0.0);
	const vec3 vone = vec3(1.0,1.0,1.0);
	if(step(vzero, texcoord) != vone || step(texcoord, vone) != vone)
		discard;
	float palettePos = getWord(texture(u_texture, texcoord)) * u_paletteWidthRatio;

	float red = getPaletteWord(texture(u_redTexture, vec2( palettePos, 0.5)));
	float green = getPaletteWord(texture(u_greenTexture, vec2(palettePos, 0.5)));
	float blue = getPaletteWord(texture(u_blueTexture, vec2(palettePos, 0.5)));

	vec4 color = vec4(red, green, blue, 1.0);
	if (u_invert) {
		color = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, 1.0);
	}
	// color.a = color.r*0.2126 + color.g*0.7152 + color.b*0.0722;
	out_0 = color*u_modulation;
}


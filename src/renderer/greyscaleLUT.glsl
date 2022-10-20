#version 300 es

precision highp float;

in vec3 texcoord;

layout(location = 0) out vec4 out_0;

uniform highp sampler3D u_texture;
uniform highp sampler2D u_lutTexture;
uniform float u_lutWidth;
uniform float u_firstInputValue;
uniform float u_maxValue;

float greyscale(vec4 color) {
	$(word)
}

void main() {

	float grey = greyscale(texture(u_texture, texcoord);
	// $(pixelPadding)
	float lutPos = (max(u_firstInputValue, grey) - u_firstInputValue);
	grey = greyscale(texture(u_lutTexture, vec2(lutPos / u_lutWidth, 0.5))) / u_maxValue;
	// $(shouldInvert)
	out_0 = vec4(grey, grey, grey, 1);
}

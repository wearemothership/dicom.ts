#version 300 es

precision highp float;

layout(location = 0) out vec4 out_0;
uniform bool u_invert;
uniform highp sampler3D u_texture;
uniform vec2 u_resolution;

uniform float u_slope;
uniform float u_intercept;

vec4 getPlanar(vec2 coord) {
	float third = 1.0 / 3.0;
	int col = int(mod(coord.y, 3.0));
	float yPos = coord.y / 3.0;

	float xPos = coord.x;

	vec4 red = texture(u_texture, vec3(xPos, yPos, 0.5));

	yPos = yPos + third;
	vec4 green = texture(u_texture, vec3(xPos, yPos, 0.5));

	yPos = yPos + third;
	vec4 blue = texture(u_texture, vec3(xPos, yPos, 0.5));

	if (col == 0) {
		return vec4(red.r, green.r, blue.r, 1.0);
	}
	if (col == 1) {
		return vec4(red.g, green.g, blue.g, 1.0);
	}
	if (col == 2) {
		return vec4(red.b, green.b, blue.b, 1.0);
	}
	return vec4(0.0, 0.0, 0.0, 0.0);
}

void main() {
	vec4 color;
	vec2 uv = gl_FragCoord.xy / u_resolution;
	uv.y = 1.0 - uv.y;

	color = // $(getColor);

  	color = (color * u_slope) + u_intercept;

	// $(u_invert)

	out_0 = color;
}

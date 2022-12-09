#version 300 es

precision highp float;

in vec3 texcoord;

layout(location = 0) out vec4 out_0;

uniform bool u_invert;
uniform highp sampler3D u_texture;
uniform float u_slope;
uniform float u_intercept;
uniform vec4  u_modulation;

vec4 getPlanar(vec3 coord) {
	float third = 1.0 / 3.0;
	int col = int(mod(coord.y, 3.0));
	float yPos = coord.y / 3.0;

	float xPos = coord.x;

	vec4 red = texture(u_texture, vec3(xPos, yPos, coord.z));

	yPos = yPos + third;
	vec4 green = texture(u_texture, vec3(xPos, yPos, coord.z));

	yPos = yPos + third;
	vec4 blue = texture(u_texture, vec3(xPos, yPos, coord.z));

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
	/* check to see if the texture coordinates are all in the valid range, or abort otherwise*/
	const vec3 vzero = vec3(0.0,0.0,0.0);
	const vec3 vone = vec3(1.0,1.0,1.0);
	if(step(vzero, texcoord) != vone || step(texcoord, vone) != vone)
		discard;
		
	vec4 color;

	color = // $(getColor);

  	color = (color * u_slope) + u_intercept;

	// $(u_invert)
	/* use a variable alpha value equal to luminance, for an adaptable overlay trasparency.
		Where the colour seems to be less intense, allow a more visible underlay image*/
	// color.a = color.r*0.2126 + color.g*0.7152 + color.b*0.0722;
	out_0 = color*u_modulation;
}

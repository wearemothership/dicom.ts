precision highp float;
uniform bool u_invert;
uniform sampler2D u_texture;
uniform vec2 u_resolution;

uniform float u_slope;
uniform float u_intercept;

vec4 getPlanar(vec2 coord) {
	float third = 1.0 / 3.0;
	int col = int(mod(coord.y, 3.0));
	float yPos = coord.y / 3.0;

	float xPos = coord.x;

	vec4 red = texture2D(u_texture, vec2(xPos, yPos));

	yPos = yPos + third;
	vec4 green = texture2D(u_texture, vec2(xPos, yPos));

	yPos = yPos + third;
	vec4 blue = texture2D(u_texture, vec2(xPos, yPos));

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

	gl_FragColor = color;
}

precision highp float;
uniform bool u_invert;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform sampler2D u_redTexture;
uniform sampler2D u_greenTexture;
uniform sampler2D u_blueTexture;
uniform float u_paletteWidth;

float getWord(vec4 color) {
	$(word)
}

float getPaletteWord(vec4 color) {
	$(paletteWord)
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution;
	uv.y = 1.0 - uv.y;

	float palettePos = getWord(texture2D(u_texture, uv));

	float red = getPaletteWord(texture2D(u_redTexture, vec2( palettePos, 0.5)));
	float green = getPaletteWord(texture2D(u_greenTexture, vec2(palettePos, 0.5)));
	float blue = getPaletteWord(texture2D(u_blueTexture, vec2(palettePos, 0.5)));

	vec4 color = vec4(red, green, blue, 1.0);
	if (u_invert) {
		color = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, 1.0);
	}

	gl_FragColor = color;
}

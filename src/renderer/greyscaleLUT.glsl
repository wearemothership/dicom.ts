precision highp float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform sampler2D u_lutTexture;
uniform float u_lutWidth;
uniform float u_firstInputValue;
uniform float u_maxValue;

float greyscale(vec4 color) {
	$(word)
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution;
	uv.y = 1.0 - uv.y;

	float grey = greyscale(texture2D(u_texture, uv));
	// $(pixelPadding)
	float lutPos = (max(u_firstInputValue, grey) - u_firstInputValue);
	grey = greyscale(texture2D(u_lutTexture, vec2(lutPos / u_lutWidth, 0.5))) / u_maxValue;
	// $(shouldInvert)
	gl_FragColor = vec4(grey, grey, grey, 1);
}

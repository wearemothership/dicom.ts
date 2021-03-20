#extension GL_EXT_draw_buffers : require

precision mediump float;

#define CELL_SIZE $(cellSize)

uniform sampler2D u_minTexture;
uniform sampler2D u_maxTexture;
uniform vec2 u_srcResolution;

float greyscale(vec4 color) {
  $(word)
}

void main() {
    // compute the first pixel the source cell
    vec2 srcPixel = floor(gl_FragCoord.xy) * float(CELL_SIZE);

    // one pixel in source
    vec2 onePixel = vec2(1) / u_srcResolution;

    // uv for first pixel in cell. +0.5 for center of pixel
    vec2 uv = (srcPixel + 0.5) / u_srcResolution;

    float minVal = 65535.0;
    float maxVal = 0.0;
    vec4 minColor = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 maxColor = vec4(0.0, 0.0, 0.0, 0.0);
    for (int y = 0; y < CELL_SIZE; ++y) {
        for (int x = 0; x < CELL_SIZE; ++x) {
            vec2 off = uv + vec2(x, y) * onePixel;
            vec4 colorMin = texture2D(u_minTexture, off);
            float grey = greyscale(colorMin);
            if (minVal > grey) {
                minColor = colorMin;
                minVal = grey;
            }
            vec4 colorMax = texture2D(u_maxTexture, off);
            grey = greyscale(colorMax);
            if (maxVal < grey) {
                maxColor = colorMax;
                maxVal = grey;
            }
        }
    }

    gl_FragData[0] = minColor;
    gl_FragData[1] = maxColor;
}

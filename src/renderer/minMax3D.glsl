#version 300 es

precision mediump float;

layout(location = 0) out vec4 out_0;
layout(location = 1) out vec4 out_1;


#define CELL_SIZE $(cellSize)

uniform highp sampler3D u_minTexture;
uniform highp sampler3D u_maxTexture;
uniform vec2 u_srcResolution;

float greyscale(vec4 color) {
  $(word)
}

void main() {
           
    // compute the first pixel the source cell
    vec2 srcPixel = floor(gl_FragCoord.xy) * float(CELL_SIZE);

    // one pixel in source
    vec2 onePixel = vec2(1.0) / u_srcResolution;

    // uv for first pixel in cell. +0.5 for center of pixel
    vec2 uv = (srcPixel + 0.5) / u_srcResolution;
    // if we deal with a 3D texture (first pass), then do it for all depth planes
    float psize = float(textureSize(u_minTexture,0).p);

    float minVal = 65535.0;
    float maxVal = 0.0;
    vec4 minColor = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 maxColor = vec4(0.0, 0.0, 0.0, 0.0);
    for(float p = 0.5; p < psize; p = p +1.0){
        float poff = p/psize;
        for (int y = 0; y < CELL_SIZE; ++y) {
            for (int x = 0; x < CELL_SIZE; ++x) {
                vec2 off = uv + vec2(x, y) * onePixel;
                vec4 colorMin = texture(u_minTexture, vec3(off,poff));
                float grey = greyscale(colorMin);
                if (minVal > grey) {
                    minColor = colorMin;
                    minVal = grey;
                }
                vec4 colorMax = texture(u_maxTexture, vec3(off,poff));
                grey = greyscale(colorMax);
                if (maxVal < grey) {
                    maxColor = colorMax;
                    maxVal = grey;
                }
            }
        }
    }

    out_0 = minColor;
    out_1 = maxColor;
}

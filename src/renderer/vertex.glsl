#version 300 es

precision highp float;
uniform mat4 u_matrix_model;
uniform mat4 u_matrix_view;
uniform mat4 u_matrix_proj;
uniform mat4 u_matrix_pat2pix;
uniform vec3 u_resolution;

in vec4 position;
out vec3 texcoord;

void main() {
    vec4 patpos, pixpos;
    patpos = u_matrix_model * position;//normalized unit coords to patient coords
    pixpos = u_matrix_pat2pix * patpos;//convert patient position to local pixel coords
    texcoord = 0.5/u_resolution + pixpos.xyz/ u_resolution;//derive local tex coords from pixel position
    gl_Position = u_matrix_proj * u_matrix_view * patpos;//view-align and project from the rendering frustum
}

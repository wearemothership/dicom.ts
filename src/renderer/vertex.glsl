#version 300 es

precision highp float;
uniform mat4 u_matrix;//ortho * lookAt * model
uniform vec3 u_resolution;

in vec4 position;
out vec3 texcoord;

void main() {
    texcoord = 0.5/u_resolution + position.xyz/ u_resolution;
    gl_Position = u_matrix * position;
}

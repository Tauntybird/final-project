#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec2 fs_UV;

uniform sampler2D u_Sampler;

out vec4 out_Col;

void main()
{
    // float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    // out_Col = vec4(dist) * fs_Col;
    // out_Col = texture2D(u_Sampler, fs_UV);
    out_Col = texture(u_Sampler, fs_UV);
}

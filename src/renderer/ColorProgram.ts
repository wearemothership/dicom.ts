import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram from "./Program";
import { ISize } from "../decoder/Decoder";

const vertexShader = raw("./vertex.glsl");
const colorShader = raw("./color.glsl");

class ContrastifyProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	frame: FrameInfo;

	gl:WebGLRenderingContext;

	outputSize: ISize;

	constructor(gl:WebGLRenderingContext, frame: FrameInfo) {
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, colorShader]);
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

		// can this be reused?
		this.unitQuadBufferInfo = unitQuadBufferInfo;

		this.programInfo = programInfo;
		this.frame = frame;
		this.gl = gl;
		this.outputSize = { width: frame.width, height: frame.height };
	}

	run(frame: FrameInfo) {
		const {
			gl,
			programInfo,
			unitQuadBufferInfo,
			outputSize
		} = this;
		const { invert, texture } = frame;
		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_invert: invert,
			// u_slope: slope,
			// u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
		// cleanup on next runloop
		setTimeout(() => {
			gl.deleteTexture(texture);
			gl.deleteProgram(programInfo.program);
		}, 0);
	}
}

export default ContrastifyProgram;

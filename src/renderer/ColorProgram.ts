import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram from "./Program";
import { ISize } from "../decoder/Decoder";
import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const colorShader = raw("./color.glsl");

class ContrastifyProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	info: IDisplayInfo;

	gl:WebGLRenderingContext;

	outputSize: ISize;

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, colorShader]);
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

		// can this be reused?
		this.unitQuadBufferInfo = unitQuadBufferInfo;

		this.programInfo = programInfo;
		this.info = info;
		this.gl = gl;
		this.outputSize = info.size;
	}

	run(frame: FrameInfo) {
		const {
			gl,
			programInfo,
			unitQuadBufferInfo,
			outputSize,
			info,
		} = this;
		const { invert } = info;
		const { texture } = frame;
		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_invert: invert,
			// u_slope: slope,
			// u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
		// cleanup on next runloop
	}

	destroy() {
		this.gl.deleteProgram(this.programInfo.program);
	}
}

export default ContrastifyProgram;

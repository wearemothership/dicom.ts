import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram from "./Program";
import { ISize } from "../image/Types";
// import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const colorShader = raw("./color.glsl");
class ContrastifyProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo;

	gl:WebGLRenderingContext;

	static programStringForInfo(): string {
		return colorShader;
	}

	// don't need info! all non palette color images use same program
	constructor(gl:WebGLRenderingContext /* , info: IDisplayInfo */) {
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, colorShader]);
		this.unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
		this.programInfo = programInfo;
		this.gl = gl;
	}

	use() {
		const { gl, programInfo, unitQuadBufferInfo } = this;

		twgl.bindFramebufferInfo(gl, null);
		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);
	}

	run(frame: FrameInfo, outputSize: ISize) {
		const {
			gl,
			programInfo,
			unitQuadBufferInfo,
		} = this;
		const {
			invert,
			planar,
			slope,
			intercept
		} = frame.imageInfo;
		const { texture } = frame;
		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_invert: invert,
			u_planar: planar,
			u_slope: slope,
			u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
	}

	destroy() {
		this.gl.deleteProgram(this.programInfo.program);
	}
}

export default ContrastifyProgram;

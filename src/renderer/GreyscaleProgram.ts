import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";
import { ISize } from "../image/Types";

const vertexShader = raw("./vertex.glsl");
const greyscaleShader = raw("./greyscale.glsl");

class GreyscaleProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	gl:WebGLRenderingContext;

	static programStringForInfo(info: IDisplayInfo): string {
		return preCompileGreyscaleShader(info, greyscaleShader);
	}

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const greyscaleShaderString = GreyscaleProgram.programStringForInfo(info);
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleShaderString]);

		this.unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		this.programInfo = programInfo;
		this.gl = gl;
	}

	use() {
		const { gl, programInfo, unitQuadBufferInfo } = this;

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo!);
	}

	run(frame: FrameInfo, outputSize: ISize) {
		const {
			gl,
			unitQuadBufferInfo,
			programInfo,
		} = this;
		const {
			texture,
			imageInfo,
		} = frame;

		let {
			windowWidth,
			windowCenter
		} = imageInfo;

		const {
			maxPixVal,
			minPixVal,
			slope,
			intercept,
			signed,
			bitsAllocated
		} = imageInfo;

		if (!windowWidth && (maxPixVal !== null || minPixVal !== null)) {
			windowWidth = Math.abs((maxPixVal ?? 0) - (minPixVal ?? 0));
			windowCenter = ((maxPixVal || 0) + (minPixVal || 0)) / 2;
		}
		if (signed) {
			windowCenter = (windowCenter || 0) + (2 ** (bitsAllocated - 1));
		}

		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_winWidth: windowWidth,
			u_winCenter: windowCenter,
			u_slope: slope,
			u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
	}

	destroy() {
		this.gl.deleteProgram(this.programInfo.program);
	}
}

export default GreyscaleProgram;

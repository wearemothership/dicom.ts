import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { preCompileGreyscaleShader } from "./Program";
import { ISize } from "../decoder/Decoder";
import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const greyscaleShader = raw("./greyscale.glsl");

class GreyscaleProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	info: IDisplayInfo;

	gl:WebGLRenderingContext;

	outputSize: ISize;

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const greyscaleShaderString = preCompileGreyscaleShader(info, greyscaleShader);
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleShaderString]);
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

		// can this be reused?
		this.unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
		this.programInfo = programInfo;

		this.info = info;
		this.gl = gl;
		this.outputSize = info.size;
		return this;
	}

	run(frame: FrameInfo) {
		const {
			gl,
			unitQuadBufferInfo,
			programInfo,
			outputSize,
			info
		} = this;
		const {
			texture
		} = frame;

		let {
			windowWidth,
			windowCenter
		} = info;

		const {
			maxPixVal,
			minPixVal,
			slope,
			intercept,
			signed,
			bitsAllocated
		} = info;

		if (!windowWidth && (maxPixVal !== null || minPixVal !== null)) {
			windowWidth = Math.abs((maxPixVal ?? 0) - (minPixVal ?? 0));
			windowCenter = ((maxPixVal || 0) + (minPixVal || 0)) / 2;
		}
		else if (signed) {
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

import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { glslUnpackWordString } from "./Program";
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
		const getWordString = glslUnpackWordString(info);

		const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleShader.replace("$(word)", getWordString)]);
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

		const {
			windowWidth,
			windowCenter,
			invert,
			slope,
			intercept
		} = info;

		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_invert: invert,
			u_winWidth: windowWidth,
			u_winCenter: windowCenter,
			u_slope: slope,
			u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
		// cleanup on next runloop
		setTimeout(() => {
			gl.deleteTexture(texture);
			gl.deleteProgram(programInfo.program);
		}, 0);
	}
}

export default GreyscaleProgram;

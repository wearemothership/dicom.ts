import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { preCompileGreyscaleShader } from "./Program";
import { ISize } from "../decoder/Decoder";
import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const greyscaleLUTShader = raw("./greyscaleLUT.glsl");

class GreyscaleLUTProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	info: IDisplayInfo;

	gl:WebGLRenderingContext;

	outputSize: ISize;

	lutTexture: WebGLTexture;

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const { lut } = info;
		const fragShaderString = preCompileGreyscaleShader(info, greyscaleLUTShader);

		const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragShaderString]);
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (info.bitsAllocated <= 8) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}

		// 1D tex
		this.lutTexture = twgl.createTexture(gl, {
			src: new Uint8Array(lut!.data.buffer),
			width: lut!.data.length,
			height: 1,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		});

		// can this be reused?
		this.unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
		this.programInfo = programInfo;
		this.gl = gl;
		this.outputSize = info.size;
		this.info = info;
		return this;
	}

	run(frame: FrameInfo) {
		const {
			gl,
			unitQuadBufferInfo,
			programInfo,
			outputSize,
			lutTexture,
			info
		} = this;
		const {
			texture,
		} = frame;

		const { lut } = info;

		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_lutTexture: lutTexture,
			u_lutWidth: lut!.data.length,
			u_firstInputValue: lut!.firstValue,
			u_maxValue: 2 ** info.bitsStored
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
	}

	destroy() {
		const { gl } = this;
		gl.deleteProgram(this.programInfo.program);
		gl.deleteTexture(this.lutTexture);
	}
}

export default GreyscaleLUTProgram;

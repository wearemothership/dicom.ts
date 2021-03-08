import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo, { IImageLutInfo } from "../image/FrameInfo";
import IProgram, { glslUnpackWordString } from "./Program";
import { ISize } from "../decoder/Decoder";

const vertexShader = raw("./vertex.glsl");
const greyscaleLUTShader = raw("./greyscaleLUT.glsl");

class GreyscaleLUTProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	frame: FrameInfo;

	gl:WebGLRenderingContext;

	outputSize: ISize;

	lut: IImageLutInfo;

	lutTexture: WebGLTexture;

	constructor(gl:WebGLRenderingContext, frame: FrameInfo, lut: IImageLutInfo) {
		const getWordString = glslUnpackWordString(frame);

		const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleLUTShader.replace("$(word)", getWordString)]);
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (frame.bitsAllocated <= 8) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}

		// 1D tex
		this.lutTexture = twgl.createTexture(gl, {
			src: new Uint8Array(lut.data.buffer),
			width: lut.data.length,
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
		this.lut = lut;
		this.frame = frame;
		this.gl = gl;
		this.outputSize = { width: frame.width, height: frame.height };
		return this;
	}

	run(frame: FrameInfo) {
		const {
			gl,
			unitQuadBufferInfo,
			programInfo,
			lut,
			outputSize,
			lutTexture
		} = this;
		const {
			texture,
			invert,
		} = frame;

		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_lutTexture: lutTexture,
			u_lutWidth: lut.data.length,
			u_firstInputValue: lut.firstValue,
			u_invert: invert,
			u_maxValue: 2 ** frame.bitsStored
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
		// cleanup on next runloop
		setTimeout(() => {
			gl.deleteTexture(texture);
			gl.deleteTexture(lutTexture);
			gl.deleteProgram(programInfo.program);
		}, 0);
	}
}

export default GreyscaleLUTProgram;

import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";
import { ISize } from "../image/Types";

const vertexShader = raw("./vertex.glsl");
const greyscaleLUTShader = raw("./greyscaleLUT.glsl");

class GreyscaleLUTProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	info: IDisplayInfo;

	gl:WebGLRenderingContext;

	static programStringForInfo(info: IDisplayInfo): string {
		return preCompileGreyscaleShader(info, greyscaleLUTShader);
	}

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const fragShaderString = GreyscaleLUTProgram.programStringForInfo(info);

		const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragShaderString]);

		this.programInfo = programInfo;
		this.gl = gl;
		this.info = info;
	}

	use() {
		const { gl, programInfo } = this;
		// can this be reused?
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);
		this.unitQuadBufferInfo = unitQuadBufferInfo;
	}

	run(frame: FrameInfo, outputSize: ISize) {
		const {
			gl,
			unitQuadBufferInfo,
			programInfo,
			info
		} = this;
		const {
			texture,
			imageInfo
		} = frame;

		const { lut } = imageInfo;

		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (info.bitsAllocated <= 8) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}
		// 1D tex
		const lutTexture = twgl.createTexture(gl, {
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

		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_lutTexture: lutTexture!,
			u_lutWidth: lut!.data.length,
			u_firstInputValue: lut!.firstValue,
			u_maxValue: 2 ** info.bitsStored
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);

		setTimeout(() => {
			gl.deleteTexture(lutTexture!);
		}, 0);
	}

	destroy() {
		const { gl } = this;
		gl.deleteProgram(this.programInfo.program);
	}
}

export default GreyscaleLUTProgram;

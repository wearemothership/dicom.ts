import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { glslUnpackWordString } from "./Program";
import { ISize } from "../decoder/Decoder";
import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const colorPaletteShader = raw("./colorPalette.glsl");

class ColorPaletteProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	info: IDisplayInfo;

	gl:WebGLRenderingContext;

	outputSize: ISize;

	rgbTextures: [WebGLTexture, WebGLTexture, WebGLTexture];

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const { palette } = info;
		const getWordString = glslUnpackWordString(info, false);
		const getPaletteWordString = glslUnpackWordString({
			...info,
			rgb: false,
			bitsAllocated: palette!.bitsAllocated,
			bitsStored: palette!.bitsAllocated
		}, false);

		const programInfo = twgl.createProgramInfo(gl, [vertexShader,
			colorPaletteShader
				.replace("$(word)", getWordString)
				.replace("$(paletteWord)", getPaletteWordString)]);
		const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (palette!.bitsAllocated === 8) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}

		// 1D tex
		const r = twgl.createTexture(gl, {
			src: new Uint8Array(palette!.r.buffer),
			width: palette!.nEntries,
			height: 1,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		});

		const g = twgl.createTexture(gl, {
			src: new Uint8Array(palette!.g.buffer),
			width: palette!.nEntries,
			height: 1,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		});

		const b = twgl.createTexture(gl, {
			src: new Uint8Array(palette!.b.buffer),
			width: palette!.nEntries,
			height: 1,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		});
		this.rgbTextures = [r, g, b];
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
			rgbTextures,
			info
		} = this;
		const {
			texture,
		} = frame;

		const { palette, invert } = info;
		twgl.setUniforms(programInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: texture,
			u_redTexture: rgbTextures[0],
			u_greenTexture: rgbTextures[1],
			u_blueTexture: rgbTextures[2],
			u_paletteWidth: palette!.nEntries,
			u_invert: invert
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
	}

	destroy() {
		const { gl, rgbTextures } = this;
		gl.deleteProgram(this.programInfo.program);
		gl.deleteTexture(rgbTextures[0]);
		gl.deleteTexture(rgbTextures[1]);
		gl.deleteTexture(rgbTextures[2]);
	}
}

export default ColorPaletteProgram;

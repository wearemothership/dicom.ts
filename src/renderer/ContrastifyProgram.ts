import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo, FramebufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { glslUnpackWordString, preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";
import { ISize } from "../image/Types";

const vertexShader = raw("./vertex.glsl");
const minMaxShader = raw("./minMax.glsl");
const contrastifyShader = raw("./contrastify.glsl");

const cellSize = 16;

// eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
interface WEBGL_draw_buffers {
	drawBuffersWEBGL(buffers: Array<number>):void,
	COLOR_ATTACHMENT0_WEBGL: number,
	COLOR_ATTACHMENT1_WEBGL: number
}

class ContrastifyProgram implements IProgram {
	// eslint-disable-next-line camelcase
	ext: WEBGL_draw_buffers;

	minMaxProgramInfo: ProgramInfo;

	contrastProgramInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	gl:WebGLRenderingContext;

	static programStringForInfo(info: IDisplayInfo): [string, string] {
		// don't ignore pixelPaddingVal in minMax calcs
		const getMinMaxWordString = glslUnpackWordString({ ...info, pixelPaddingVal: null }, true);

		const minMaxFragString = minMaxShader
			.replace("$(cellSize)", cellSize.toString())
			.replace("$(word)", getMinMaxWordString);

		const contrastifyShaderString = preCompileGreyscaleShader(
			info,
			contrastifyShader.replace("$(minMaxWord)", getMinMaxWordString),
			true
		);
		return [minMaxFragString, contrastifyShaderString];
	}

	constructor(gl:WebGLRenderingContext, info: IDisplayInfo) {
		const ext = gl.getExtension("WEBGL_draw_buffers");
		if (!ext) {
			throw new Error("Image requires WEBGL_draw_buffers");
		}
		this.ext = ext!;

		// TODO: don;t double up on program string generation

		const [minMaxFrag, contrastifyFrag] = ContrastifyProgram.programStringForInfo(info);

		this.minMaxProgramInfo = <ProgramInfo> <unknown> twgl.createProgramInfo(
			gl,
			[vertexShader, minMaxFrag]
		);

		this.contrastProgramInfo = <ProgramInfo> <unknown> twgl.createProgramInfo(
			gl,
			[vertexShader, contrastifyFrag]
		);

		this.unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		this.gl = gl;
	}

	// eslint-disable-next-line class-methods-use-this
	use() {
		// can't really do anything here...
	}

	run(frame: FrameInfo, outputSize: ISize) {
		const framebuffers:Array<FramebufferInfo> = [];

		const {
			gl,
			ext,
			minMaxProgramInfo,
			contrastProgramInfo,
			unitQuadBufferInfo,
		} = this;

		const {
			imageInfo
		} = frame;

		const {
			size,
			slope,
			intercept
		} = imageInfo;
		const { width, height } = size;
		let w = width;
		let h = height;

		const srcTex = frame.texture;

		while (w > 1 || h > 1) {
			// | 0 like floor but Infinity/NaN are zero'd
			// eslint-disable-next-line no-bitwise
			w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
			// eslint-disable-next-line no-bitwise
			h = Math.max(1, (h + cellSize - 1) / cellSize | 0);

			// creates a framebuffer and creates and attaches 2 RGBA/UNSIGNED textures
			const fbi = twgl.createFramebufferInfo(gl, [
				{
					format: gl.RGBA,
					min: gl.NEAREST,
					mag: gl.NEAREST,
					wrap: gl.CLAMP_TO_EDGE
				},
				{
					format: gl.RGBA,
					min: gl.NEAREST,
					mag: gl.NEAREST,
					wrap: gl.CLAMP_TO_EDGE
				},
			], w, h);
			// WebGl2
			// gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
			ext.drawBuffersWEBGL([ext.COLOR_ATTACHMENT0_WEBGL, ext.COLOR_ATTACHMENT1_WEBGL]);
			framebuffers.push(fbi);
		}

		// need separate FBs to read the output
		const lastFBI = framebuffers[framebuffers.length - 1];
		const uniforms = {
			u_srcResolution: [width, height],
			u_minTexture: srcTex,
			u_maxTexture: srcTex,
		};

		gl.useProgram(minMaxProgramInfo.program);
		twgl.setBuffersAndAttributes(gl, minMaxProgramInfo, unitQuadBufferInfo!);

		w = width;
		h = height;
		framebuffers.forEach((fbi) => {
			// | 0 like floor but Infinity/NaN are zero'd
			// eslint-disable-next-line no-bitwise
			w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
			// eslint-disable-next-line no-bitwise
			h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
			// uniforms.u_dstResolution = [w, h];
			twgl.bindFramebufferInfo(gl, fbi);
			twgl.setUniforms(minMaxProgramInfo, uniforms);
			twgl.drawBufferInfo(gl, unitQuadBufferInfo!);

			[uniforms.u_minTexture, uniforms.u_maxTexture] = fbi.attachments;
			uniforms.u_srcResolution = [w, h];
		});

		// // Read min/max pixel onto CPU - slow but might be useful
		// const minFBI = twgl.createFramebufferInfo(gl, [
		// 	{ attachment: lastFBI.attachments[0] }
		// ], 1, 1);
		// const maxFBI = twgl.createFramebufferInfo(gl, [
		// 	{ attachment: lastFBI.attachments[1] }
		// ], 1, 1);

		// const minVals = new Uint8Array(4);
		// const maxVals = new Uint8Array(4);

		// twgl.bindFramebufferInfo(gl, minFBI);
		// gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, minVals);
		// console.log("min: ", minVals[0], minVals[1], minVals[2], minVals[3]);
		// twgl.bindFramebufferInfo(gl, maxFBI);
		// gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, maxVals);
		// console.log("max: ", maxVals[0], maxVals[1], maxVals[2], maxVals[3]);

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(contrastProgramInfo.program);

		twgl.setUniforms(contrastProgramInfo, {
			u_resolution: [outputSize.width, outputSize.height],
			u_texture: srcTex,
			u_minColor: lastFBI.attachments[0],
			u_maxColor: lastFBI.attachments[1],
			u_slope: slope,
			u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
		// cleanup on next runloop
		setTimeout(() => {
			framebuffers.forEach((fbi) => {
				const { attachments, framebuffer } = fbi;
				gl.deleteFramebuffer(framebuffer);
				if (attachments[0] instanceof WebGLRenderbuffer) {
					gl.deleteRenderbuffer(attachments[0]);
				}
				else {
					gl.deleteTexture(attachments[0]);
				}
			});
		}, 0);
	}

	destroy() {
		this.gl.deleteProgram(this.contrastProgramInfo.program);
		this.gl.deleteProgram(this.minMaxProgramInfo.program);
	}
}

export default ContrastifyProgram;

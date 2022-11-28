import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo, FramebufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, {Uniforms, IDrawObject, glslUnpackWordString, preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";
import { ISize } from "../image/Types";

const vertexShader = raw("./vertex.glsl");
const vertexShaderMM = raw("./vertexMM.glsl");
const minMaxShader = raw("./minMax.glsl");
const minMax3DShader = raw("./minMax3D.glsl");
const contrastifyShader = raw("./contrastify.glsl");
// console.log(minMaxShader);

const cellSize = 16;

class ContrastifyProgram implements IProgram {
	// eslint-disable-next-line camelcase

	minMaxProgramInfo: ProgramInfo;

	minMax3DProgramInfo: ProgramInfo;

	contrastProgramInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo ;

	gl:WebGL2RenderingContext;


	static programStringForInfo(info: IDisplayInfo): [string, string, string] {
		// don't ignore pixelPaddingVal in minMax calcs
		const getMinMaxWordString = glslUnpackWordString({ ...info, pixelPaddingVal: null }, true);

		const minMaxFragString = minMaxShader
			.replace("$(cellSize)", cellSize.toString())
			.replace("$(word)", getMinMaxWordString);

		const minMax3DFragString = minMax3DShader
			.replace("$(cellSize)", cellSize.toString())
			.replace("$(word)", getMinMaxWordString);

		const contrastifyShaderString = preCompileGreyscaleShader(
			info,
			contrastifyShader.replace("$(minMaxWord)", getMinMaxWordString),
			true
		);
		//return in order of usage
		return [minMax3DFragString, minMaxFragString, contrastifyShaderString];
	}

	
	constructor(gl:WebGL2RenderingContext, info: IDisplayInfo) {

		// TODO: don;t double up on program string generation

		const [minMax3DFrag, minMaxFrag, contrastifyFrag] = ContrastifyProgram.programStringForInfo(info);

		this.minMax3DProgramInfo = <ProgramInfo> <unknown> twgl.createProgramInfo(
			gl,
			[vertexShaderMM, minMax3DFrag]
		);

		this.minMaxProgramInfo = <ProgramInfo> <unknown> twgl.createProgramInfo(
			gl,
			[vertexShaderMM, minMaxFrag]
		);

		this.contrastProgramInfo = <ProgramInfo> <unknown> twgl.createProgramInfo(
			gl,
			[vertexShader, contrastifyFrag]
		);
		/* build a normalized unit quad as a 3D geometry, which will be transformed as required*/		
		const arrays = {			
			position: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,1,-1],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);

		this.gl = gl;
	}

	// eslint-disable-next-line class-methods-use-this
	

	makeDrawObject(frame: FrameInfo) : IDrawObject {
		const framebuffers:Array<FramebufferInfo> = [];

		const {
			gl,
			minMax3DProgramInfo,
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
		
		const nFrames:number = frame.imageInfo.nFrames;
		/*create an FBO for each intermediate reduction step*/
		while (w > 1 || h > 1) {
			// | 0 like floor but Infinity/NaN are zero'd
			// eslint-disable-next-line no-bitwise
			w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
			// eslint-disable-next-line no-bitwise
			h = Math.max(1, (h + cellSize - 1) / cellSize | 0);

			// creates a framebuffer and creates and attaches 2 RGBA/UNSIGNED textures for each downsize
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
			gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
			framebuffers.push(fbi);
		}

		// need separate FBs to read the output
		const lastFBI = framebuffers[framebuffers.length - 1];
		/*	Start with the 3D version, in the first run.
			As we write on two attachements simultaneously for Min/Max, we cannot benefit 
			from drawing instanced the 3D depth planes, as we cannot set separate blend equations
			for each FBO attachements (i.e. gl.Min/gl.Max); hence the 'p' loop in FS on first run. Bad, but unavoidable! :(
		*/
		let progInfo:ProgramInfo = minMax3DProgramInfo;

		w = width;
		h = height;
		let i:number = 0;
		const mmUnitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
		const uniforms = {
			u_srcResolution: [width, height],
			u_minTexture: srcTex,
			u_maxTexture: srcTex,
		};
	
		framebuffers.forEach((fbi) => {
			// | 0 like floor but Infinity/NaN are zero'd
			// eslint-disable-next-line no-bitwise
			w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
			// eslint-disable-next-line no-bitwise
			h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
			// uniforms.u_dstResolution = [w, h];
			twgl.bindFramebufferInfo(gl, fbi);

			// carry on with 2D textures for sources after first run
			if(uniforms.u_minTexture !== srcTex){
				progInfo = minMaxProgramInfo;
			}
			// ++i;
			
			gl.useProgram(progInfo.program);
			twgl.setBuffersAndAttributes(gl, progInfo, mmUnitQuadBufferInfo!);
			twgl.setUniforms(progInfo, uniforms);
			twgl.drawBufferInfo(gl, mmUnitQuadBufferInfo!);

			[uniforms.u_minTexture, uniforms.u_maxTexture] = fbi.attachments;
			uniforms.u_srcResolution = [w, h];
			
		});

		// Read min/max pixel onto CPU - slow but might be useful
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

		const imgSize = frame.imageInfo.size;

		const specificUniforms = {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			u_texture: srcTex,
			u_minColor: lastFBI.attachments[0],
			u_maxColor: lastFBI.attachments[1],
			u_slope: slope,
			u_intercept: intercept,
			u_matrix_pat2pix: twgl.m4.inverse(frame.mat4Pix2Pat)
		};
		// // cleanup on next runloop
		// setTimeout(() => {
		// 	framebuffers.forEach((fbi) => {
		// 		const { attachments, framebuffer } = fbi;
		// 		gl.deleteFramebuffer(framebuffer);
		// 		if (attachments[0] instanceof WebGLRenderbuffer) {
		// 			gl.deleteRenderbuffer(attachments[0]);
		// 		}
		// 		else {
		// 			gl.deleteTexture(attachments[0]);
		// 		}
		// 	});
		// }, 0);

		/*place holder for the shared (global) uniforms, to be updated just before rendering*/
		const emptyUniforms:Uniforms = { };
		
		return {
			active: true,
			programInfo: contrastProgramInfo,
			bufferInfo: unitQuadBufferInfo,
			uniforms: [emptyUniforms, specificUniforms]
		}
	}
	
	destroy() {
		this.gl.deleteProgram(this.contrastProgramInfo.program);
		this.gl.deleteProgram(this.minMaxProgramInfo.program);
	}
}

export default ContrastifyProgram;

import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { Uniforms,IDrawObject, preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";
import { ISize } from "../image/Types";

const vertexShader = raw("./vertex.glsl");
const greyscaleShader = raw("./greyscale.glsl");

//======================================================================================
class GreyscaleProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo | null = null;

	gl:WebGL2RenderingContext;

	static programStringForInfo(info: IDisplayInfo): string {
		return preCompileGreyscaleShader(info, greyscaleShader);
	}

	constructor(gl:WebGL2RenderingContext, info: IDisplayInfo) {
		const greyscaleShaderString = GreyscaleProgram.programStringForInfo(info);
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleShaderString]);

		// this.unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

		this.programInfo = programInfo;
		this.gl = gl;
	}
	//-----------------------------------------------------------------------------
	use() {
		const { gl, programInfo, unitQuadBufferInfo } = this;

		twgl.bindFramebufferInfo(gl, null);

		gl.useProgram(programInfo.program);
	}

	
	//-----------------------------------------------------------------------------
	run(frame: FrameInfo, size: ISize) {
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
		const imgSize = frame.imageInfo.size;
		const nFrames:number = frame.imageInfo.nFrames;
		
		const arrays = {
			position: [0,0,frame.frameNo, imgSize.width,0,frame.frameNo, 
						imgSize.width, imgSize.height,frame.frameNo, 0,imgSize.height,frame.frameNo],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);//twgl.primitives.createXYQuadBufferInfo(gl);
		twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo!);
		const modviewproj = twgl.m4.ortho(imgSize.width*0.0,imgSize.width*1.0, 
											imgSize.height*1.0,imgSize.height*0.0,
											-1-nFrames,1);
		//VC??? - left it here

		//set also the model-view-project matrix4
		twgl.setUniforms(programInfo, {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			u_matrix: modviewproj,
			u_texture: texture,
			u_winWidth: windowWidth,
			u_winCenter: windowCenter,
			u_slope: slope,
			u_intercept: intercept
		});
		twgl.drawBufferInfo(gl, unitQuadBufferInfo!);
	}

	
	//-----------------------------------------------------------------------------
	makeDrawObject(frame: FrameInfo, sharedUniforms: Uniforms) : IDrawObject {
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
		const imgSize = frame.imageInfo.size;
		const nFrames:number = frame.imageInfo.nFrames;
		
		const arrays = {			
			position: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,1,-1],
			// position: [-1,-1,-1,  -1,-1,1,  -1,1,1,  -1,1,-1],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);
		twgl.setBuffersAndAttributes(gl, programInfo, this.unitQuadBufferInfo!);

		//set also the model-view-project matrix4
		const localUniforms = {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			// u_matrix: modviewproj,
			u_texture: texture,
			u_winWidth: windowWidth,
			u_winCenter: windowCenter,
			u_slope: slope,
			u_intercept: intercept
		};

		return {
			active: true,
			programInfo,
			bufferInfo: this.unitQuadBufferInfo,
			uniforms: [localUniforms, sharedUniforms]
		}
	}


	
	//-----------------------------------------------------------------------------
	destroy() {
		this.gl.deleteProgram(this.programInfo.program);
	}
}

export default GreyscaleProgram;

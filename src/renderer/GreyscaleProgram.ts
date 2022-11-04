import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { Uniforms,IDrawObject, preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const greyscaleShader = raw("./greyscale.glsl");

//======================================================================================
class GreyscaleProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo;

	gl:WebGL2RenderingContext;

	static programStringForInfo(info: IDisplayInfo): string {
		return preCompileGreyscaleShader(info, greyscaleShader);
	}

	constructor(gl:WebGL2RenderingContext, info: IDisplayInfo) {
		const greyscaleShaderString = GreyscaleProgram.programStringForInfo(info);
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleShaderString]);
		/* build a normalized unit quad as a 3D geometry, which will be transformed as required*/		
		const arrays = {			
			position: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,1,-1],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);

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
	makeDrawObject(frame: FrameInfo, sharedUniforms: Uniforms) : IDrawObject {
		const {
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

		const localUniforms = {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			u_texture: texture,
			u_winWidth: windowWidth,
			u_winCenter: windowCenter,
			u_slope: slope,
			u_intercept: intercept
		};

		return {
			active: true,
			programInfo,
			bufferInfo: unitQuadBufferInfo,
			uniforms: [localUniforms, sharedUniforms]
		}
	}


	
	//-----------------------------------------------------------------------------
	destroy() {
		const { gl } = this;
		gl.deleteProgram(this.programInfo.program);
	}
}

export default GreyscaleProgram;

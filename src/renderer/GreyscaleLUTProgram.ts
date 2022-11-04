import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, { Uniforms, IDrawObject, preCompileGreyscaleShader } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const greyscaleLUTShader = raw("./greyscaleLUT.glsl");

class GreyscaleLUTProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo ;

	info: IDisplayInfo;

	gl:WebGL2RenderingContext;

	static programStringForInfo(info: IDisplayInfo): string {
		return preCompileGreyscaleShader(info, greyscaleLUTShader);
	}

	constructor(gl:WebGL2RenderingContext, info: IDisplayInfo) {
		const fragShaderString = GreyscaleLUTProgram.programStringForInfo(info);

		/* build a normalized unit quad as a 3D geometry, which will be transformed as required*/		
		const arrays = {			
			position: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,1,-1],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);
		
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, fragShaderString]);

		this.programInfo = programInfo;
		this.gl = gl;
		this.info = info;
	}

	use() {
		const { gl, programInfo } = this;
		twgl.bindFramebufferInfo(gl, null);
	}

	makeDrawObject(frame: FrameInfo, sharedUniforms: Uniforms) : IDrawObject {
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
		const imgSize = frame.imageInfo.size;
		const nFrames:number = frame.imageInfo.nFrames;

		const localUniforms = {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			u_texture: texture,
			u_lutTexture: lutTexture!,
			u_lutWidth: lut!.data.length,
			u_firstInputValue: lut!.firstValue,
			u_maxValue: 2 ** info.bitsStored
		};
		
		return {
			active: true,
			programInfo,
			bufferInfo: unitQuadBufferInfo,
			uniforms: [localUniforms, sharedUniforms]
		}
	}

	destroy() {
		const { gl } = this;
		gl.deleteProgram(this.programInfo.program);
	}
}

export default GreyscaleLUTProgram;

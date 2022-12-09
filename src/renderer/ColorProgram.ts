import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, {Uniforms,IDrawObject } from "./Program";
import { ISize } from "../image/Types";
import { IDisplayInfo } from "../image/DisplayInfo";
// import { IDisplayInfo } from "../image/DisplayInfo";

const vertexShader = raw("./vertex.glsl");
const colorShader = raw("./color.glsl");

//======================================================================================
/* It creates a WebGL program that draws a unit quad, and uses a fragment shader to color it based on
the texture */
class ColorProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo;

	gl:WebGL2RenderingContext;

	static programStringForInfo(imageInfo: IDisplayInfo): string {
		const { planar, invert } = imageInfo;
		let shaderString:string;
		if (planar) {
			shaderString = colorShader.replace("// $(getColor);", "getPlanar(texcoord);\n");
		}
		else {
			shaderString = colorShader.replace("// $(getColor);", "texture(u_texture, texcoord);\n");
		}
		if (invert) {
			shaderString = shaderString.replace("// $(u_invert)", "color = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, color.a);");
		}
		return shaderString;
	}

	// don't need info! all non palette color images use same program
	constructor(gl:WebGL2RenderingContext, info: IDisplayInfo) {
		const shaderString = ColorProgram.programStringForInfo(info);
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, shaderString]);
		
		/* build a normalized unit quad as a 3D geometry, which will be transformed as required*/		
		const arrays = {			
			position: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,1,-1],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);

		this.programInfo = programInfo;
		this.gl = gl;
	}

	
	makeDrawObject(frame: FrameInfo) : IDrawObject {
		const {
			gl,
			programInfo,
			unitQuadBufferInfo,
		} = this;
		const {
			invert,
			slope,
			intercept,
			modulationColor,
		} = frame.imageInfo;
		const { texture } = frame;

		
		const imgSize = frame.imageInfo.size;
		const nFrames:number = frame.imageInfo.nFrames;

		const specificUniforms = {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			u_texture: texture,
			u_invert: invert,
			u_slope: slope,
			u_intercept: intercept,
			u_modulation: modulationColor,
		};
		/*place holder for the shared (global) uniforms, to be updated just before rendering*/
		const emptyUniforms:Uniforms = { };
		return {
			active: true,
			programInfo,
			bufferInfo: unitQuadBufferInfo,
			uniforms: [emptyUniforms, specificUniforms]
		}
	}

	destroy() {
		this.gl.deleteProgram(this.programInfo.program);
	}
}

export default ColorProgram;

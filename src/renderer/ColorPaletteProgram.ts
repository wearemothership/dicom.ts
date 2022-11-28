import * as twgl from "twgl.js";
import { ProgramInfo, BufferInfo } from "twgl.js";

import raw from "raw.macro";
import FrameInfo from "../image/FrameInfo";
import IProgram, {  Uniforms,IDrawObject, glslUnpackWordString } from "./Program";
import { IDisplayInfo } from "../image/DisplayInfo";
import { ISize } from "../image/Types";

const vertexShader = raw("./vertex.glsl");
const colorPaletteShader = raw("./colorPalette.glsl");

class ColorPaletteProgram implements IProgram {
	programInfo: ProgramInfo;

	unitQuadBufferInfo: BufferInfo;

	gl:WebGL2RenderingContext;

	static programStringForInfo(info: IDisplayInfo): string {
		const { palette } = info;
		const getWordString = glslUnpackWordString(info, false);
		const getPaletteWordString = glslUnpackWordString({
			...info,
			rgb: false,
			bitsAllocated: palette!.bitsAllocated,
			bitsStored: palette!.bitsAllocated
		}, false);
		return colorPaletteShader
			.replace("$(word)", getWordString)
			.replace("$(paletteWord)", getPaletteWordString);
	}

	constructor(gl:WebGL2RenderingContext, info: IDisplayInfo) {
		const programString = ColorPaletteProgram.programStringForInfo(info);
		const programInfo = twgl.createProgramInfo(gl, [vertexShader, programString]);
		this.programInfo = programInfo;
		this.gl = gl;
		/* build a normalized unit quad as a 3D geometry, which will be transformed as required*/		
		const arrays = {			
			position: [-1,-1,-1,  1,-1,-1,  1,1,-1,  -1,1,-1],
			indices: [0,1,2,0,2,3]
		}
		this.unitQuadBufferInfo =  twgl.createBufferInfoFromArrays(gl, arrays);

	}

	//-----------------------------------------------------------------------------
	makeDrawObject(frame: FrameInfo) : IDrawObject {
		const {
			gl,
			unitQuadBufferInfo,
			programInfo,
		} = this;
		const {
			texture,
			imageInfo
		} = frame;

		const { palette, invert, bitsAllocated } = imageInfo;

		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (palette!.bitsAllocated === 8) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}
		const {
			r,
			g,
			b,
			nEntries
		} = palette!;
		// 1D tex
		const red = twgl.createTexture(gl, {
			src: new Uint8Array(r.buffer, r.byteOffset, r.byteLength),
			width: nEntries,
			height: 1,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		});

		const green = twgl.createTexture(gl, {
			src: new Uint8Array(g.buffer, g.byteOffset, g.byteLength),
			width: nEntries,
			height: 1,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		});

		const blue = twgl.createTexture(gl, {
			src: new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
			width: nEntries,
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

		const specificUniforms = {
			u_resolution: [imgSize.width, imgSize.height, nFrames],
			u_texture: texture,
			u_redTexture: red,
			u_greenTexture: green,
			u_blueTexture: blue,
			u_paletteWidthRatio: (2 ** bitsAllocated) / palette!.nEntries,
			u_invert: invert
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
		const { gl, programInfo } = this;
		gl.deleteProgram(programInfo.program);
	}
}

export default ColorPaletteProgram;

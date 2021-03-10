import * as twgl from "twgl.js";
import { IDecoderInfo } from "../image/DecoderInfo";
import { displayInfoFromDecoderInfo, IDisplayInfo } from "../image/DisplayInfo";
import FrameInfo from "../image/FrameInfo";
import { ImageSize } from "../image/Types";

export interface ISize {
	width: number,
	height: number
}

interface IDecoder {
	outputSize: ISize
	image: IDisplayInfo
	getFrame(gl:WebGL2RenderingContext, frameNo:number):Promise<FrameInfo>
	// createTexture(gl:WebGL2RenderingContext, frameNo:number):Promise<WebGLTexture>
}

class Decoder implements IDecoder {
	image: IDisplayInfo;

	outputSize: ImageSize;

	constructor(image:IDecoderInfo) {
		this.image = displayInfoFromDecoderInfo(image);

		this.outputSize = image.size;
	}

	async getFrame(gl:WebGLRenderingContext, frameNo:number):Promise<FrameInfo> {
		const texture = await this.createTexture(gl, frameNo);
		return new FrameInfo({
			imageInfo: this.image,
			frameNo,
			texture
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected decode(frameNo:number):Promise<DataView> {
		return Promise.resolve(this.image.data);
	}

	protected async createTexture(gl:WebGLRenderingContext, frameNo:number):Promise<WebGLTexture> {
		const pixelData = await this.decode(frameNo);
		const greyBuffer = new Uint8Array(pixelData.buffer);
		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (this.image.rgb) {
			format = gl.RGB;
			internalFormat = gl.RGB;
		}
		else if (this.image.bytesAllocated === 1) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}
		const { width, height } = this.outputSize;
		return Promise.resolve(twgl.createTexture(gl, {
			src: greyBuffer,
			width,
			height,
			format,
			internalFormat,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		}));
	}
}

export default Decoder;

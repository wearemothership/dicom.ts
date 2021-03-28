import * as twgl from "twgl.js";
import { IDecoderInfo } from "../image/DecoderInfo";
import { displayInfoFromDecoderInfo, IDisplayInfo } from "../image/DisplayInfo";
import { ImageSize, ISize } from "../image/Types";
import FrameInfo from "../image/FrameInfo";

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
			gl,
			texture
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected decode(frameNo:number):Promise<DataView> {
		const { data, nFrames } = this.image;
		const bytesPerFrame = data.byteLength / nFrames;
		const dv = new DataView(
			data.buffer,
			data.byteOffset + bytesPerFrame * frameNo, bytesPerFrame
		);
		return Promise.resolve(dv);
	}

	protected async createTexture(gl:WebGLRenderingContext, frameNo:number):Promise<WebGLTexture> {
		const pixelData = await this.decode(frameNo);
		const buffer = new Uint8Array(pixelData.buffer, pixelData.byteOffset, pixelData.byteLength);
		let { height } = this.outputSize;
		const { width } = this.outputSize;
		const { image } = this;
		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (image.rgb && !image.planar && !image.palette) {
			format = gl.RGB;
			internalFormat = gl.RGB;
		}
		else if (image.bytesAllocated === 1) {
			format = gl.LUMINANCE;
			internalFormat = gl.LUMINANCE;
		}
		if (image.planar) {
			height *= 3;
		}

		return Promise.resolve(twgl.createTexture(gl, {
			src: buffer,
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

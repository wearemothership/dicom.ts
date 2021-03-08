import * as twgl from "twgl.js";
import Image from "../parser/image";
import FrameInfo from "../image/FrameInfo";

export interface ISize {
	width: number,
	height: number
}

interface IDecoder {
	outputSize: ISize
	image: any
	getFrame(gl:WebGL2RenderingContext, frameNo:number):Promise<FrameInfo>
	// createTexture(gl:WebGL2RenderingContext, frameNo:number):Promise<WebGLTexture>
}

class Decoder implements IDecoder {
	image:any;

	outputSize = {
		width: 1,
		height: 1
	}

	constructor(image:any) {
		this.image = image;

		this.outputSize = {
			width: image.width,
			height: image.height
		};
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
	protected decode(frameNo:number):Promise<Uint8Array | Uint16Array> {
		return Promise.resolve(this.image.getPixelData().value);
	}

	protected async createTexture(gl:WebGLRenderingContext, frameNo:number):Promise<WebGLTexture> {
		const pixelData = await this.decode(frameNo);
		const greyBuffer = new Uint8Array(pixelData.buffer);
		let format = gl.LUMINANCE_ALPHA;
		let internalFormat = gl.LUMINANCE_ALPHA;
		if (this.image.dataType === Image.byteType.rgb) {
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

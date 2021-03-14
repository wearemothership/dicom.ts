import * as twgl from "twgl.js";
import { IDecoderInfo } from "../image/DecoderInfo";
import { displayInfoFromDecoderInfo, IDisplayInfo } from "../image/DisplayInfo";
import FrameInfo from "../image/FrameInfo";
import { ImageSize } from "../image/Types";
import { TagIds } from "../parser/tag";

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
			bytesPerFrame * frameNo, bytesPerFrame
		);
		return Promise.resolve(dv);
	}

	// TODO: remove this - upload palette to GPU!
	protected convertPalette(pixelData: DataView) {
		const { image } = this;
		const { size, bytesAllocated } = image;
		const reds = image.image.getPalleteValues(TagIds.PaletteRed) ?? [];
		const greens = image.image.getPalleteValues(TagIds.PaletteGreen) ?? [];
		const blues = image.image.getPalleteValues(TagIds.PaletteBlue) ?? [];

		if ((reds.length > 0)
			&& (greens.length > 0)
			&& (blues.length > 0)) {
			const rgb = new DataView(new ArrayBuffer(size.rows * size.columns * 3));
			const numElements = pixelData.byteLength / bytesAllocated;

			if (bytesAllocated === 1) {
				for (let ctr = 0; ctr < numElements; ctr += 1) {
					const index = pixelData.getUint8(ctr);
					const rVal = reds[index];
					const gVal = greens[index];
					const bVal = blues[index];
					rgb.setUint8((ctr * 3), rVal);
					rgb.setUint8((ctr * 3) + 1, gVal);
					rgb.setUint8((ctr * 3) + 2, bVal);
				}
			}
			else if (bytesAllocated === 2) {
				for (let ctr = 0; ctr < numElements; ctr += 1) {
					const index = pixelData.getUint16(ctr * 2);
					const rVal = reds[index];
					const gVal = greens[index];
					const bVal = blues[index];
					rgb.setUint8((ctr * 3), rVal);
					rgb.setUint8((ctr * 3) + 1, gVal);
					rgb.setUint8((ctr * 3) + 2, bVal);
				}
			}
			return rgb;
		}
		return pixelData;
	}

	protected async createTexture(gl:WebGLRenderingContext, frameNo:number):Promise<WebGLTexture> {
		const decodedData = await this.decode(frameNo);
		const pixelData = this.convertPalette(decodedData);
		const buffer = new Uint8Array(pixelData.buffer, pixelData.byteOffset, pixelData.byteLength);

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

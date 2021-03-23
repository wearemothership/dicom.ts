import * as twgl from "twgl.js";
import { IDecoderInfo } from "../image/DecoderInfo";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class NativeDecoder extends Decoder {
	private jpegData:DataView[]

	constructor(image:IDecoderInfo) {
		super(image);
		this.image.rgb = true; // native img decoder outputs RGB
		this.jpegData = getJpegData(image.data);
	}

	protected createTexture(gl:WebGL2RenderingContext, frameNo:number):Promise<WebGLTexture> {
		const { width, height } = this.outputSize;
		const jpegFrameData = this.jpegData?.[frameNo];
		if (!jpegFrameData) {
			throw Error("Invalid data");
		}
		const blob = new Blob([jpegFrameData]);
		const src = URL.createObjectURL(blob);
		return new Promise((resolve, reject) => twgl.createTexture(gl, {
			src,
			width,
			height,
			type: gl.UNSIGNED_BYTE,
			min: gl.NEAREST,
			mag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE,
		}, (error, texture) => {
			URL.revokeObjectURL(src);
			if (error) {
				return reject(error);
			}
			return resolve(texture);
		}));
	}
}

export default NativeDecoder;

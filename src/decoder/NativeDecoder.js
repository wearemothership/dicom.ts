import * as twgl from "twgl.js";
import Decoder from "./Decoder";

class NativeDecoder extends Decoder {
	constructor(image) {
		super(image);
		this.jpegData = image.getJpegs();
	}

	createTexture(gl, frameNo) {
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

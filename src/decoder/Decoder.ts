// eslint-disable-next-line max-classes-per-file
import * as twgl from "twgl.js";
// import * as Utils from "../parser/utilities";
import Image from "../parser/image";

class Decoder {
	outputSize = {
		width: 1,
		height: 1
	}

	constructor(image) {
		this.image = image;
		this.outputSize = {
			width: image.width,
			height: image.height
		};
	}

	decode(/* frameNo */) {
		return Promise.resolve(this.image.getPixelData().value);
	}

	createTexture(gl, frameNo) {
		return this.decode(frameNo).then((pixelData) => {
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
		});
	}
}

export default Decoder;

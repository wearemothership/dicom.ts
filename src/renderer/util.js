import * as twgl from "twgl.js";
import { Image } from "../parser";

/**
 * Should we try and load the image into an Image element ans use HW decoder
 * @param {Daikon Image} image the parsed DICOM image
 * @returns Boolean if yes we can use native browser decoder
 */
// const shouldUseNativeDecoder = () => false;
const shouldUseNativeDecoder = (image) => (
	Image && image.isCompressed()
	&& !["1.2.840.10008.1.2.4.51", "1.2.840.10008.1.2.4.81"].includes(image.transferSyntax) // not extended JPEG or LS
	&& (
		image.isCompressedJPEGBaseline()
		|| (
			image.isCompressedJPEG2000() // safar supports JPEG2000 netively
			&& /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
		)
	)
);
/**
 * Unpack pseudo integer or a float  from a color value
 * insert into GLSL to change behaviour depending on data
 * @param {Daikon Image} image the parsed DICOM image
 * @param {Boolean} integerVal should return greyscale psuedo int (0 - 65535)
 * 							   else return a 0.0-1.0 float color ratio
 */
export const glslUnpackWordString = (image, integerVal = true) => {
	let val;
	let divisor = "";
	if (!integerVal) {
		divisor = ` / ${2 ** image.bitsStored}.0`;
	}
	const signed = image.pixelRepresentation;
	if (image.bitsAllocated <= 8) {
		// one byte
		val = "(color.r * 256.0)";
		if (signed) {
			return `float p = ${val}; return (p > 127.0 ? 255.0 - p : p)${divisor};`;
		}
	}
	else {
		const isRGB = image.dataType === Image.byteType.rgb
		|| shouldUseNativeDecoder(image);
		// 2nd byte for greyscale images is packed in alpha chan,
		// or green channel for RGB based 16bit greyscale
		const byte2Chan = isRGB ? "g" : "a";
		if (image.littleEndian) {
			val = `(color.${byte2Chan} * 65536.0 + color.r * 256.0)`;
		}
		else {
			val = `(color.r * 65536.0 + color.${byte2Chan} * 256.0)`;
		}
		if (signed) {
			return `float p = ${val};return (p > 32767.0 ? 65535.0 - p : p)${divisor};`;
		}
	}
	return `return ${val}${divisor};`;
};

/**
 * Creates a webgl texture - Takes an object with the folloring params
 * @param {Object.gl} gl - webGl context
 * @param {Object.image} image - the parsed DICOM image
 * @param {Object.width} width - width of the texture
 * @param {Object.height} height - height of texture
 */
export const createTexture = ({
	gl,
	image,
	width,
	height
}) => {
	// If JPEG baseline, or safari and JPEG2000 - use native decoder
	if (shouldUseNativeDecoder(image)) {
		const blob = new Blob([image.getJpegs()[0]]);
		const src = URL.createObjectURL(blob);

		return new Promise((resolve, reject) => {
			twgl.createTexture(gl, {
				src,
				width,
				height,
				type: gl.UNSIGNED_BYTE,
				min: gl.NEAREST,
				mag: gl.NEAREST,
				wrap: gl.CLAMP_TO_EDGE,
			}, (err, texture) => {
				URL.revokeObjectURL(src);
				if (err) {
					reject(err);
				}
				else {
					resolve(texture);
				}
			});
		});
	}

	const pixelData = image.getRawData();
	const greyBuffer = new Uint8Array(new Uint16Array(pixelData).buffer);

	let format = gl.LUMINANCE_ALPHA;
	let internalFormat = gl.LUMINANCE_ALPHA;
	if (image.dataType === Image.byteType.rgb) {
		format = gl.RGB;
		internalFormat = gl.RGB;
	}
	else if (image.bytesAllocated === 1) {
		format = gl.LUMINANCE;
		internalFormat = gl.LUMINANCE;
	}
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
};

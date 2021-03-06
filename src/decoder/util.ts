import { Image } from "../parser";

const hasCreateObjectURL = !!URL.createObjectURL;

/**
 * Should we try and load the image into an Image element ans use HW decoder
 * @param {Daikon Image} image the parsed DICOM image
 * @returns Boolean if yes we can use native browser decoder
 */
export const shouldUseNativeDecoder = (image) => (
	hasCreateObjectURL && (
		(image.isCompressedJPEGBaseline()
			&& !["1.2.840.10008.1.2.4.51", "1.2.840.10008.1.2.4.81"].includes(image.transferSyntax) // not extended JPEG or LS
		) || (
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
		val = "(color.r * 255.0)";
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
			val = `(color.${byte2Chan} * 65535.0 + color.r * 255.0)`;
		}
		else {
			val = `(color.r * 65535.0 + color.${byte2Chan} * 255.0)`;
		}
		if (signed) {
			return `float p = ${val};return (p > 32767.0 ? 65535.0 - p : p)${divisor};`;
		}
	}
	return `return ${val}${divisor};`;
};

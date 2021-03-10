import { ISize } from "../decoder/Decoder";
import { IDisplayInfo } from "../image/DisplayInfo";
import FrameInfo from "../image/FrameInfo";

// let vertexShader = raw("./vertex.glsl");
// let minMaxShader = raw("./minMax.glsl");
// let contrastifyShader = raw("./contrastify.glsl");
// let greyscaleShader = raw("./greyscale.glsl");
// let greyscaleLUTShader = raw("./greyscaleLUT.glsl");
// let colorShader = raw("./color.glsl");

interface IProgram {
	// frame: FrameInfo;

	gl: WebGLRenderingContext;
	outputSize: ISize;
	// new (gl:WebGLRenderingContext, frame: FrameInfo): IProgram;

	run(frame: FrameInfo):void
}

/**
 * Unpack pseudo integer or a float  from a color value
 * insert into GLSL to change behaviour depending on data
 * @param {Image} image the parsed DICOM image
 * @param {Boolean} integerVal should return greyscale psuedo int (0 - 65535)
 * 							   else return a 0.0-1.0 float color ratio
 */
export const glslUnpackWordString = (image: IDisplayInfo, integerVal:boolean = true):string => {
	let val;
	let divisor = "";
	if (!integerVal) {
		divisor = ` / ${2 ** image.bitsStored}.0`;
	}
	const { signed } = image;
	if (image.bitsAllocated <= 8) {
		// one byte
		val = "(color.r * 255.0)";
		if (signed) {
			return `float p = ${val}; return (p > 127.0 ? 255.0 - p : p)${divisor};`;
		}
	}
	else {
		const { rgb } = image;
		// 2nd byte for greyscale images is packed in alpha chan,
		// or green channel for RGB based 16bit greyscale
		const byte2Chan = rgb ? "g" : "a";
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

export default IProgram;

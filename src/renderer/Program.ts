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
	destroy(): void
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
	const { bitsAllocated, signed, pixelPaddingVal } = image;
	if (!integerVal) {
		divisor = ` / ${2 ** image.bitsStored}.0`;
	}
	if (bitsAllocated <= 8) {
		// one byte
		val = "float p = (color.r * 255.0);\n";
		if (pixelPaddingVal !== null) {
			let pv:number = pixelPaddingVal;
			if (signed) {
				// eslint-disable-next-line prefer-destructuring
				pv = new Uint8Array(new Int8Array([pixelPaddingVal]))[0];
			}
			val = `${val}if (floor(p + 0.5) == ${pv}.0) return -1.0;\n`;
		}
		if (signed) {
			val = `${val}(p > 127.0 ? p - 127.0 : p + 127.0);\n`;
		}
	}
	else {
		const { rgb } = image;
		// 2nd byte for greyscale images is packed in alpha chan,
		// or green channel for RGB based 16bit greyscale
		const byte2Chan = rgb ? "g" : "a";
		if (image.littleEndian) {
			val = `float p = (color.${byte2Chan} * 65280.0 + color.r * 255.0);\n`;
		}
		else {
			val = `float p = (color.r * 65280.0 + color.${byte2Chan} * 255.0);\n`;
		}
		if (pixelPaddingVal !== null) {
			let pv:number = pixelPaddingVal;
			if (signed) {
				// eslint-disable-next-line prefer-destructuring
				pv = new Uint16Array(new Int16Array([pixelPaddingVal]))[0];
			}
			val = `${val}if (floor(p + 0.5) == ${pv}.0) return -1.0;\n`;
		}
		if (signed) {
			val = `${val}p = (p > 32767.0 ? p - 32767.0 : p + 32767.0);\n`;
		}
	}
	return `${val}return p${divisor};`;
};

/**
 * replace placeholders in the glsl strings with proper code
 * @param info the image info we are to display
 * @param shaderString input shader program string
 * @param integerVal should getWord return a sized integer, or a 0-1 float ratio
 * @returns
 */
export const preCompileGreyscaleShader = (
	info: IDisplayInfo,
	shaderString: string,
	integerVal: boolean = true
): string => {
	let outShaderString = shaderString.replace("$(word)", glslUnpackWordString(info, integerVal));
	const { invert, pixelPaddingVal } = info;
	if (invert) {
		outShaderString = outShaderString.replace("// $(shouldInvert)", "grey = 1.0 - grey;");
	}
	if (pixelPaddingVal !== null) {
		outShaderString = outShaderString.replace(
			"// $(pixelPadding)",
			"if (grey < 0.0) {\ngl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);\nreturn;\n}\n"
		);
	}
	return outShaderString;
};

export default IProgram;

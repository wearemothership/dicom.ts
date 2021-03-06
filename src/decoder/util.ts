import { Image, Parser } from "../parser";

const hasCreateObjectURL = !!URL.createObjectURL;

/**
 * Should we try and load the image into an Image element ans use HW decoder
 * @param {any} image the parsed DICOM image
 * @returns Boolean if yes we can use native browser decoder
 */
export const shouldUseNativeDecoder = (image:any):boolean => (
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
 * @param {Image} image the parsed DICOM image
 * @param {Boolean} integerVal should return greyscale psuedo int (0 - 65535)
 * 							   else return a 0.0-1.0 float color ratio
 */
export const glslUnpackWordString = (image: any, integerVal:boolean = true):string => {
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

export const getEncapsulatedData = (image:any):Array<any> => {
	const { buffer } = image.getPixelData().value;
	const parser = new Parser();
	return parser.parseEncapsulated(new DataView(buffer));
};

const concatArrayOfBuffers = (buffers:Array<ArrayBuffer>):ArrayBuffer => {
	let length = 0;
	let offset = 0;

	for (let ctr = 0; ctr < buffers.length; ctr += 1) {
		length += buffers[ctr].byteLength;
	}

	const tmp = new Uint8Array(length);

	for (let ctr = 0; ctr < buffers.length; ctr += 1) {
		tmp.set(new Uint8Array(buffers[ctr]), offset);
		offset += buffers[ctr].byteLength;
	}

	return tmp.buffer;
};

export const fillBuffer = (
	array: ArrayLike<number>,
	buffer: DataView,
	offset:number,
	numBytes:number
) => {
	if (numBytes === 1) {
		for (let ctr = 0; ctr < array.length; ctr += 1) {
			buffer.setUint8(offset + ctr, array[ctr]);
		}
	}
	else if (numBytes === 2) {
		for (let ctr = 0; ctr < array.length; ctr += 1) {
			buffer.setUint16(offset + (ctr * 2), array[ctr], true);
		}
	}
};

const JPEG_MAGIC_NUMBER = [0xFF, 0xD8];
const JPEG2000_MAGIC_NUMBER = [0xFF, 0x4F, 0xFF, 0x51];

const isHeaderJPEG = (data:DataView):boolean => {
	if (!data) {
		return false;
	}
	if (data.getUint8(0) !== JPEG_MAGIC_NUMBER[0]) {
		return false;
	}

	if (data.getUint8(1) !== JPEG_MAGIC_NUMBER[1]) {
		return false;
	}

	return true;
};

const isHeaderJPEG2000 = (data:DataView):boolean => {
	if (!data) {
		return false;
	}
	for (let ctr = 0; ctr < JPEG2000_MAGIC_NUMBER.length; ctr += 1) {
		if (data.getUint8(ctr) !== JPEG2000_MAGIC_NUMBER[ctr]) {
			return false;
		}
	}
	return true;
};

export const getJpegData = (image:any):Array<ArrayBuffer> => {
	const encapTags = getEncapsulatedData(image);
	const data:Array<Array<ArrayBuffer>> = [];
	const dataConcat:Array<ArrayBuffer> = [];

	let currentJpeg;
	// organize data as an array of an array of JPEG parts
	if (encapTags) {
		const numTags = encapTags.length;

		for (let ctr = 0; ctr < numTags; ctr += 1) {
			if (isHeaderJPEG(encapTags[ctr].value)
				|| isHeaderJPEG2000(encapTags[ctr].value)) {
				currentJpeg = [];
				currentJpeg.push(encapTags[ctr].value.buffer);
				data.push(currentJpeg);
			}
			else if (currentJpeg && encapTags[ctr].value) {
				currentJpeg.push(encapTags[ctr].value.buffer);
			}
		}
	}

	// concat into an array of full JPEGs
	for (let ctr = 0; ctr < data.length; ctr += 1) {
		const buffers = data[ctr];
		if (buffers.length > 1) {
			dataConcat[ctr] = concatArrayOfBuffers(buffers);
		}
		else {
			[dataConcat[ctr]] = data[ctr];
		}

		delete data[ctr];
	}

	return dataConcat;
};

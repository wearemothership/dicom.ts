/* eslint-disable no-bitwise */
// @ts-ignore
import { convertBytes } from "dicom-character-set";

let crcTable: Array<number>;

export const MAX_VALUE = 9007199254740991;
export const MIN_VALUE = -9007199254740991;

export const dec2hex = (i:number):string => (i + 0x10000).toString(16).substr(-4).toUpperCase();

export const getStringAt = (
	dataview: DataView,
	start: number,
	length:number,
	charset:string = "ISO 2022 IR 6",
	vr?:string
):string => {
	const strBuff = new Uint8Array(dataview.buffer, dataview.byteOffset + start, length);
	let str = convertBytes(charset, strBuff, { vr });

	while (str && str.charCodeAt(str.length - 1) === 0) {
		str = str.slice(0, -1);
	}

	return str;
};

export const stripLeadingZeros = (str:string):string => str.replace(/^[0]+/g, "");

export const safeParseInt = (str:string):number => {
	const intStr = stripLeadingZeros(str);
	if (intStr.length > 0) {
		return parseInt(intStr, 10);
	}

	return 0;
};

export const convertCamcelCaseToTitleCase = (str:string):string => {
	const result = str.replace(/([A-Z][a-z])/g, " $1");
	return (result.charAt(0).toUpperCase() + result.slice(1)).trim();
};

export const safeParseFloat = (str:string):number => {
	const floatStr = stripLeadingZeros(str);
	if (floatStr.length > 0) {
		return parseFloat(floatStr);
	}

	return 0;
};
// http://stackoverflow.com/questions/8361086/convert-byte-array-to-numbers-in-javascript
export const bytesToDouble = (data:Array<number>):number => {
	const [b0, b1, b2, b3, b4, b5, b6, b7] = data;

	const sign = (b0 & (1 << 7)) >> 7;

	const exponent = (((b0 & 127) << 4) | ((b1 & (15 << 4)) >> 4));

	if (exponent === 0) {
		return 0;
	}
	if (exponent === 0x7ff) {
		return (sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	}

	const mul = 2 ** exponent - 1023 - 52;
	const mantissa = b7
		+ b6 * 2 ** 8
		+ b5 * 2 ** (8 * 2)
		+ b4 * 2 ** (8 * 3)
		+ b3 * 2 ** (8 * 4)
		+ b2 * 2 ** (8 * 5)
		+ (b1 & 15) * 2 ** (8 * 6)
		+ 2 ** 52;

	return (-1) ** sign * mantissa * mul;
};

export const concatArrayBuffers = (buffer1: ArrayBuffer, buffer2:ArrayBuffer):ArrayBuffer => {
	const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(new Uint8Array(buffer1), 0);
	tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	return tmp.buffer;
};

export const fillBufferRGB = (array: Array<number>, buffer:DataView, offset:number) => {
	const numElements = array.length || 0;

	for (let ctr = 0; ctr < numElements; ctr += 3) {
		const r = array[ctr];
		const g = array[ctr + 1];
		const b = array[ctr + 2];

		buffer.setUint8(offset + ctr, Math.floor((r + b + g) / 3));
	}
};

export const toArrayBuffer = (buffer: Array<number>) => {
	const ab = new ArrayBuffer(buffer.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buffer.length; i += 1) {
		view[i] = buffer[i];
	}
	return ab;
};

// http://stackoverflow.com/questions/203739/why-does-instanceof-return-false-for-some-literals
export const isString = (s:any):boolean => (typeof (s) === "string" || s instanceof String);

// http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
export const isValidDate = (d:any):boolean => {
	if (Object.prototype.toString.call(d) === "[object Date]") {
		// eslint-disable-next-line no-restricted-globals
		if (isNaN(d.getTime())) {
			return false;
		}
		return true;
	}
	return false;
};

export const swap32 = (val:number) => (
	((val & 0xFF) << 24)
	| ((val & 0xFF00) << 8)
	| ((val >> 8) & 0xFF00)
	| ((val >> 24) & 0xFF)
);

export const swap16 = (val:number) => (
	((((val & 0xFF) << 8)
	| ((val >> 8) & 0xFF)) << 16) >> 16 // since JS uses 32-bit when bit shifting
);

// http://stackoverflow.com/questions/18638900/javascript-crc32
export const makeCRCTable = ():Array<number> => {
	crcTable = crcTable || Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) {
			c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
		}
		crcTable[n] = c;
	}
	return crcTable;
};

export const crc32 = (dataView: DataView):number => {
	crcTable = crcTable || makeCRCTable();
	let crc = 0 ^ (-1);

	for (let i = 0; i < dataView.byteLength; i += 1) {
		crc = (crc >>> 8) ^ crcTable[(crc ^ dataView.getUint8(i)) & 0xFF];
	}

	return (crc ^ (-1)) >>> 0;
};

export const createBitMask = (numBytes:number, bitsStored:number, unsigned:boolean):number => {
	let mask = 0xFFFFFFFF;
	mask >>>= (((4 - numBytes) * 8) + ((numBytes * 8) - bitsStored));

	if (unsigned) {
		if (numBytes === 1) {
			mask &= 0x000000FF;
		}
		else if (numBytes === 2) {
			mask &= 0x0000FFFF;
		}
		else if (numBytes === 4) {
			mask &= 0xFFFFFFFF;
		}
		else if (numBytes === 8) {
			mask = 0xFFFFFFFF;
		}
	}
	else {
		mask = 0xFFFFFFFF;
	}

	return mask;
};

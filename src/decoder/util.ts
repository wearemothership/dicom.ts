import { Parser, Tag } from "../parser";

export const getEncapsulatedData = (data:DataView): Tag[] => {
	const { buffer } = data;
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

export const getJpegData = (inData:DataView): ArrayBuffer[] => {
	const encapTags = getEncapsulatedData(inData);
	const data:Array<Array<ArrayBuffer>> = [];
	const dataConcat:Array<ArrayBuffer> = [];

	let currentJpeg;
	// organize data as an array of an array of JPEG parts
	if (encapTags) {
		const numTags = encapTags.length;

		for (let ctr = 0; ctr < numTags; ctr += 1) {
			const dataView = encapTags[ctr].value as DataView;
			if (isHeaderJPEG(dataView)
				|| isHeaderJPEG2000(dataView)) {
				currentJpeg = [];
				currentJpeg.push(dataView.buffer);
				data.push(currentJpeg);
			}
			else if (currentJpeg && dataView) {
				currentJpeg.push(dataView.buffer);
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

import { Parser, Tag } from "../parser";

export const getEncapsulatedData = (data:DataView): Tag[] => {
	const parser = new Parser();
	return parser.parseEncapsulated(data);
};

const concatDataViews = (dataViews:DataView[]):DataView => {
	let length = 0;
	let offset = 0;

	for (let ctr = 0; ctr < dataViews.length; ctr += 1) {
		length += dataViews[ctr].byteLength;
	}

	const tmp = new Uint8Array(length);
	let dataView;
	for (let ctr = 0; ctr < dataViews.length; ctr += 1) {
		dataView = dataViews[ctr];
		tmp.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength), offset);
		offset += dataViews[ctr].byteLength;
	}

	return new DataView(tmp.buffer);
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

export const getJpegData = (inData:DataView): DataView[] => {
	const encapTags = getEncapsulatedData(inData);
	const data:Array<DataView[]> = [];
	const dataConcat:DataView[] = [];

	let currentJpeg;
	// organize data as an array of an array of JPEG parts
	if (encapTags) {
		const numTags = encapTags.length;

		for (let ctr = 0; ctr < numTags; ctr += 1) {
			const dataView = encapTags[ctr].value as DataView;
			if (isHeaderJPEG(dataView)
				|| isHeaderJPEG2000(dataView)) {
				currentJpeg = [];
				currentJpeg.push(dataView);
				data.push(currentJpeg);
			}
			else if (currentJpeg && dataView) {
				currentJpeg.push(dataView);
			}
		}
	}

	// concat into an array of full JPEGs
	for (let ctr = 0; ctr < data.length; ctr += 1) {
		const buffers = data[ctr];
		if (buffers.length > 1) {
			// TODO: this will be slow...is it necessary?
			dataConcat[ctr] = concatDataViews(buffers);
		}
		else {
			[dataConcat[ctr]] = data[ctr];
		}

		delete data[ctr];
	}

	return dataConcat;
};

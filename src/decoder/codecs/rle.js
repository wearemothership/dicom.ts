/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */

function decode8(frameInfo, dataView) {
	const { samples, size } = frameInfo;
	const nPixels = size.numberOfPixels;
	const decoded = new ArrayBuffer(nPixels * samples);
	const data = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
	const out = new Uint8Array(decoded);

	let outIndex = 0;
	const numSegments = dataView.getInt32(0, true);

	const endOfSegment = nPixels * numSegments;

	for (let s = 0; s < numSegments; ++s) {
		outIndex = s;

		let inIndex = dataView.getInt32((s + 1) * 4, true);

		let maxIndex = dataView.getInt32((s + 2) * 4, true);

		if (maxIndex === 0) {
			maxIndex = dataView.byteLength;
		}
		let maxI;
		let value;
		let n;
		while (inIndex < maxIndex) {
			n = data[inIndex++];
			if (n < 0x80) {
				maxI = Math.min((n + 1) * samples + outIndex, endOfSegment);
				for (; outIndex < maxI; outIndex += samples) {
					out[outIndex] = data[inIndex++];
				}
			}
			else if (n > 0x80) {
				value = data[inIndex++];
				maxI = Math.min((129 - (n ^ 0x80)) * samples + outIndex, endOfSegment);
				for (; outIndex < maxI; outIndex += samples) {
					out[outIndex] = value;
				}
			}
		}
	}

	return decoded;
}

function decode16(frameInfo, dataView) {
	const { samples, size } = frameInfo;
	const nPixels = size.numberOfPixels;
	const decoded = new ArrayBuffer(nPixels * samples * 2);
	const data = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
	const out = new Uint8Array(decoded);

	const numSegments = dataView.getInt32(0, true);

	let maxIndex = 0;
	for (let s = 0; s < numSegments; ++s) {
		let outIndex = 0;

		const highByte = s === 0 ? 1 : 0;

		let inIndex = dataView.getInt32((s + 1) * 4, true);

		maxIndex = dataView.getInt32((s + 2) * 4, true);

		if (maxIndex === 0) {
			maxIndex = (dataView.byteLength) * 2;
		}
		let diff;
		let maxI;
		let value;
		let i;
		let n;
		while (inIndex < maxIndex) {
			n = data[inIndex++];
			i = outIndex * 2 + highByte;
			if (n < 0x80) {
				diff = Math.min(n + 1, nPixels - outIndex);
				maxI = diff * 2 + i;
				for (; i < maxI; i += 2) {
					out[i] = data[inIndex++];
				}
				outIndex += diff;
			}
			else if (n > 0x80) {
				value = data[inIndex++];
				diff = Math.min(129 - (n ^ 0x80), nPixels - outIndex);
				maxI = diff * 2 + i;
				for (; i < maxI; i += 2) {
					out[i] = value;
				}
				outIndex += diff;
			}
		}
	}
	return decoded;
}

function decode(frameInfo, pixelDataView) {
	const { bytesAllocated } = frameInfo;
	if (bytesAllocated === 1) {
		return new DataView(decode8(frameInfo, pixelDataView));
	}
	if (bytesAllocated === 2) {
		return new DataView(decode16(frameInfo, pixelDataView));
	}

	throw new Error("Unsupported data format for RLE");
}

export default decode;

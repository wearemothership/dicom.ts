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

	return new DataView(decoded, 0, nPixels * samples);
}

function decode16(frameInfo, dataView) {
	const { samples, size } = frameInfo;
	const outBytes = size.numberOfPixels * 2;
	const decoded = new ArrayBuffer(outBytes * samples);
	const data = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
	const out = new Uint8Array(decoded);

	const numSegments = dataView.getInt32(0, true);

	let maxIndex = 0;
	for (let s = 0; s < numSegments; ++s) {
		const highByte = s === 0 ? 1 : 0;
		let outIndex = highByte;
		let inIndex = dataView.getInt32((s + 1) * 4, true);

		maxIndex = dataView.getInt32((s + 2) * 4, true);

		if (maxIndex === 0) {
			maxIndex = dataView.byteLength;
		}
		let maxI;
		let value;
		let n;
		while (inIndex < maxIndex) {
			n = data[inIndex++];
			if (n < 0x80) {
				maxI = Math.min((n + 1) * 2 + outIndex, outBytes);
				for (; outIndex < maxI; outIndex += 2) {
					out[outIndex] = data[inIndex++];
				}
			}
			else if (n > 0x80) {
				value = data[inIndex++];
				maxI = Math.min((129 - (n ^ 0x80)) * 2 + outIndex, outBytes);
				for (; outIndex < maxI; outIndex += 2) {
					out[outIndex] = value;
				}
			}
		}
	}
	return new DataView(decoded, 0, outBytes * samples);
}

function decode(frameInfo, pixelDataView) {
	const { bytesAllocated } = frameInfo;
	if (bytesAllocated === 1) {
		return decode8(frameInfo, pixelDataView);
	}
	if (bytesAllocated === 2) {
		return decode16(frameInfo, pixelDataView);
	}

	throw new Error("Unsupported data format for RLE");
}

export default decode;

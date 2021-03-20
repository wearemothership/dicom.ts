/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */

// MIT License

// Copyright (c) 2020 Chris Hafey

// Optimisations
// Copyright (c) 2021 Mothership Software ltd

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

function decode8(imageFrame, frameData) {
	const frameSize = imageFrame.size.numberOfPixels;
	const outFrame = new ArrayBuffer(frameSize * imageFrame.samples);

	const header = frameData;
	const data = new Int8Array(frameData.buffer, frameData.byteOffset, frameData.byteLength);
	const out = new Int8Array(outFrame);

	let outIndex = 0;
	const numSegments = header.getInt32(0, true);

	const { samples } = imageFrame;

	const endOfSegment = frameSize * numSegments;

	for (let s = 0; s < numSegments; ++s) {
		outIndex = s;

		let inIndex = header.getInt32((s + 1) * 4, true);

		let maxIndex = header.getInt32((s + 2) * 4, true);

		if (maxIndex === 0) {
			maxIndex = frameData.byteLength;
		}

		while (inIndex < maxIndex) {
			const n = data[inIndex++];

			if (n >= 0 && n <= 127) {
				// copy n bytes
				const maxI = Math.min(n + 1, endOfSegment - outIndex);
				for (let i = 0; i < maxI; ++i) {
					out[outIndex] = data[inIndex++];
					outIndex += samples;
				}
			}
			else if (n <= -1 && n >= -127) {
				const value = data[inIndex++];
				// run of n bytes
				const maxI = Math.min(1 - n, endOfSegment - outIndex);
				for (let i = 0; i < maxI; ++i) {
					out[outIndex] = value;
					outIndex += samples;
				}
			} /* else if (n === -128) {
		} // do nothing */
		}
	}

	return outFrame;
}

function decode8Planar(imageFrame, frameData) {
	const frameSize = imageFrame.size.numberOfPixels;
	const outFrame = new ArrayBuffer(frameSize * imageFrame.samples);

	const header = frameData;
	const data = new Int8Array(frameData.buffer, frameData.byteOffset, frameData.byteLength);
	const out = new Int8Array(outFrame);

	let outIndex = 0;
	const numSegments = header.getInt32(0, true);

	for (let s = 0; s < numSegments; ++s) {
		outIndex = s * frameSize;

		let inIndex = header.getInt32((s + 1) * 4, true);

		let maxIndex = header.getInt32((s + 2) * 4, true);

		if (maxIndex === 0) {
			maxIndex = frameData.byteLength;
		}

		const endOfSegment = frameSize * numSegments;

		while (inIndex < maxIndex) {
			const n = data[inIndex++];

			if (n >= 0 && n <= 127) {
			// copy n bytes
				const maxI = Math.min(n + 1, endOfSegment - outIndex);
				for (let i = 0; i < maxI; ++i) {
					out[outIndex] = data[inIndex++];
					outIndex++;
				}
			}
			else if (n <= -1 && n >= -127) {
				const value = data[inIndex++];
				// run of n bytes
				const maxI = Math.min(1 - n, endOfSegment - outIndex);
				for (let i = 0; i < maxI; ++i) {
					out[outIndex] = value;
					outIndex++;
				}
			} /* else if (n === -128) {
		} // do nothing */
		}
	}

	return outFrame;
}

function decode16(imageFrame, frameData) {
	const frameSize = imageFrame.size.numberOfPixels;
	const outFrame = new ArrayBuffer(frameSize * imageFrame.samples * 2);

	const header = frameData;
	const data = new Uint8Array(frameData.buffer, frameData.byteOffset, frameData.byteLength);
	const out = new Uint8Array(outFrame);

	const numSegments = header.getInt32(0, true);

	let maxIndex = 0;
	for (let s = 0; s < numSegments; ++s) {
		let outIndex = 0;

		const highByte = s === 0 ? 1 : 0;

		let inIndex = header.getInt32((s + 1) * 4, true);

		maxIndex = header.getInt32((s + 2) * 4, true);

		if (maxIndex === 0) {
			maxIndex = (frameData.byteLength) * 2;
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
				diff = Math.min(n + 1, frameSize - outIndex);
				maxI = diff * 2 + i;
				for (; i < maxI; i += 2) {
					out[i] = data[inIndex++];
				}
				outIndex += diff;
			}
			else if (n > 0x80) {
				value = data[inIndex++];
				diff = Math.min(129 - (n ^ 0x80), frameSize - outIndex);
				maxI = diff * 2 + i;
				for (; i < maxI; i += 2) {
					out[i] = value;
				}
				outIndex += diff;
			} /* else if (n === -128) {
		} // do nothing */
		}
	}
	return outFrame;
}

function decodeRLE(imageFrame, pixelDataView) {
	const { bytesAllocated, planar } = imageFrame;
	if (bytesAllocated === 1) {
		if (planar) {
			return new DataView(decode8Planar(imageFrame, pixelDataView));
		}

		return new DataView(decode8(imageFrame, pixelDataView));
	}
	if (bytesAllocated === 2) {
		return new DataView(decode16(imageFrame, pixelDataView));
	}

	throw new Error("Unsupported pixel format for RLE");
}

export default decodeRLE;

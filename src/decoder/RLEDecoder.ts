import Decoder from "./Decoder";
import RLE from "./codecs/rle";

class RLEDecoder extends Decoder {
	decode(frameNo) {
		const { image } = this;
		if (!this.rleData) {
			const encapTags = image.getEncapsulatedData();
			const numTags = encapTags?.length || 0;
			const data = new Array(numTags);
			// the first sublist item contains offsets - ignore
			for (let ctr = 1; ctr < numTags; ctr += 1) {
				if (encapTags[ctr].value) {
					data[ctr - 1] = encapTags[ctr].value.buffer;
				}
			}
			this.rleData = data;
		}
		const decompressed = RLE({
			rows: image.rows,
			columns: image.columns,
			samplesPerPixel: image.samplesPerPixel,
			bitsAllocated: image.bitsAllocated,
			planarConfiguration: image.getPlanarConfig(),
			pixelRepresentation: image.pixelRepresentation
		},
		this.rleData[frameNo]).pixelData;
		return Promise.resolve(decompressed);
	}
}

export default RLEDecoder;

import JpxDecoder from "./codecs/jpx";
import Decoder from "./Decoder";
import * as Utils from "../parser/utilities";

class JPEG2000Decoder extends Decoder {
	decode(frameNo) {
		const { image } = this;
		const frameSize = image.rows
			* image.columns
			* image.bytesAllocated;

		if (!this.jpegs) {
			this.jpegs = image.getJpegs();
		}
		const decoder = new JpxDecoder();
		decoder.parse(new Uint8Array(this.jpegs[frameNo]));
		// const { width, height } = decoder;
		const decoded = decoder.tiles[0].items;
		const numComponents = decoder.componentsCount;

		// TODO: why is this necessary?
		const decompressed = new DataView(new ArrayBuffer(frameSize * numComponents));
		Utils.fillBuffer(
			decoded,
			decompressed,
			0,
			image.bytesAllocated
		);

		return Promise.resolve(decompressed);
	}
}

export default JPEG2000Decoder;

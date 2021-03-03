import Decoder from "./Decoder";
import RLE from "./codecs/rle";

class RLEDecoder extends Decoder {
	decode(frameNo) {
		const { image } = this;
		if (!this.rleData) {
			this.rleData = image.getRLE();
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

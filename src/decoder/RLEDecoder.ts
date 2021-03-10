import Decoder from "./Decoder";
import RLE from "./codecs/rle";
import { getEncapsulatedData } from "./util";

class RLEDecoder extends Decoder {
	private rleData: Array<ArrayBuffer> | null = null

	protected decode(frameNo: number) {
		const { image } = this;
		if (!this.rleData) {
			const encapTags = getEncapsulatedData(image.data);
			const numTags = encapTags?.length || 0;
			const data = new Array(numTags);
			// the first sublist item contains offsets - ignore
			for (let ctr = 1; ctr < numTags; ctr += 1) {
				const dataView = encapTags[ctr].value as DataView;
				data[ctr - 1] = dataView?.buffer || null;
			}
			this.rleData = data;
		}
		const decompressed = RLE({
			rows: image.size.rows,
			columns: image.size.columns,
			samplesPerPixel: image.samples,
			bitsAllocated: image.bitsAllocated,
			planarConfiguration: image.planar ? 1.0 : 0.0,
			pixelRepresentation: image.signed ? 0x1 : 0x0
		},
		this.rleData[frameNo]).pixelData;
		return Promise.resolve(decompressed);
	}
}

export default RLEDecoder;

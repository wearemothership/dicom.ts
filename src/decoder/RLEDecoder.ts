import Decoder from "./Decoder";
import { getEncapsulatedData } from "./util";

class RLEDecoder extends Decoder {
	private rleData: DataView[] | null = null;

	protected decode(frameNo: number): Promise<DataView> {
		return import("./codecs/rle").then((RLE) => {
			const { image } = this;
			if (!this.rleData) {
				const encapTags = getEncapsulatedData(image.data);
				const numTags = encapTags?.length || 0;
				const data = new Array(numTags);
				// the first sublist item contains offsets - ignore
				for (let ctr = 1; ctr < numTags; ctr += 1) {
					const dataView = encapTags[ctr].rawValue as DataView;
					data[ctr - 1] = dataView;
				}
				this.rleData = data;

				// don't decode to planar...just makes render more complex
				// RLE input is the same either way
				if (image.planar) {
					image.planar = false;
				}
			}
			const decompressed = RLE.default(image, this.rleData[frameNo]);
			return decompressed;
		});
	}
}

export default RLEDecoder;

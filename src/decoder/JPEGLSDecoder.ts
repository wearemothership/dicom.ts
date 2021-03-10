import JpegLSDecoder from "./codecs/jpeg-ls";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class JPEGLosslessDecoder extends Decoder {
	private jpegs:Array<ArrayBuffer> | null = null

	decode(frameNo: number) {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image.data);
		}
		const decompressed = JpegLSDecoder({
			rows: image.size.rows,
			columns: image.size.columns,
			samplesPerPixel: image.samples,
			bitsAllocated: image.bitsAllocated,
			planarConfiguration: image.planar ? 1 : 0,
			pixelRepresentation: image.signed ? 1 : 0,
		}, new Uint8Array(this.jpegs[frameNo])).pixelData;

		return Promise.resolve(decompressed);
	}
}

export default JPEGLosslessDecoder;

import JpegLSDecoder from "./codecs/jpeg-ls";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class JPEGLosslessDecoder extends Decoder {
	private jpegs:Array<ArrayBuffer> | null = null

	decode(frameNo: number) {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image);
		}
		const decompressed = JpegLSDecoder({
			rows: image.rows,
			columns: image.columns,
			samplesPerPixel: image.samplesPerPixel,
			bitsAllocated: image.bitsAllocated,
			planarConfiguration: image.getPlanarConfig(),
			pixelRepresentation: image.pixelRepresentation
		}, new Uint8Array(this.jpegs[frameNo])).pixelData;

		return Promise.resolve(decompressed);
	}
}

export default JPEGLosslessDecoder;

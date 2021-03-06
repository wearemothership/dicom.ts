import JpegLSDecoder from "./codecs/jpeg-ls";
import Decoder from "./Decoder";

class JPEGLosslessDecoder extends Decoder {
	decode(frameNo) {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = image.getJpegs();
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

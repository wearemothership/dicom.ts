import { JpegImage } from "./codecs/jpeg-baseline";
import Decoder from "./Decoder";

class JPEGLosslessDecoder extends Decoder {
	decode(frameNo) {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = image.getJpegs();
		}

		const decoder = new JpegImage();
		decoder.parse(new Uint8Array(this.jpegs[frameNo]));
		const { width, height } = decoder;
		let decoded = null;
		if (image.bitsAllocated === 8) {
			decoded = decoder.getData(width, height);
		}
		else {
			decoded = decoder.getData16(width, height);
		}

		return Promise.resolve(decoded);
	}
}

export default JPEGLosslessDecoder;

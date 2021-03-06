import { lossless as jpegLossless } from "jpeg-lossless-decoder-js";
import Decoder from "./Decoder";

class JPEGLosslessDecoder extends Decoder {
	decode(frameNo) {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = image.getJpegs();
		}
		const decoder = new jpegLossless.Decoder();
		const temp = decoder.decode(this.jpegs[frameNo]);
		// const numComponents = decoder.numComp;

		return Promise.resolve(new Uint8Array(temp.buffer));
	}
}

export default JPEGLosslessDecoder;

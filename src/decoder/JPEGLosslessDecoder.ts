import { lossless as jpegLossless } from "jpeg-lossless-decoder-js";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class JPEGLosslessDecoder extends Decoder {
	private jpegs:Array<ArrayBuffer> | null = null

	protected decode(frameNo:number):Promise<Uint8Array | Uint16Array> {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image);
		}
		const decoder = new jpegLossless.Decoder();
		const temp = decoder.decode(this.jpegs[frameNo]);
		// const numComponents = decoder.numComp;

		return Promise.resolve(new Uint8Array(temp.buffer));
	}
}

export default JPEGLosslessDecoder;

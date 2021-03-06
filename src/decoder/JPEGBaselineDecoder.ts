import { JpegImage } from "./codecs/jpeg-baseline";
import Decoder, { ISize } from "./Decoder";
import { getJpegData } from "./util";

class JPEGLosslessDecoder extends Decoder {
	private jpegs:Array<ArrayBuffer> | null = null

	protected decode(frameNo:number):Promise<Uint8Array | Uint16Array> {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image);
		}

		const decoder = new JpegImage();
		decoder.parse(new Uint8Array(this.jpegs[frameNo]));
		const { width, height } = <ISize> <unknown> decoder;
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

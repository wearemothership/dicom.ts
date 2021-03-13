import Decoder from "./Decoder";
import charls from "./codecs/charlsjs";
import { getJpegData } from "./util";

let initialized = false;
let initCallback = () => {};
charls.onRuntimeInitialized = async () => {
	initialized = true;
	initCallback();
	return Promise.resolve();
};
class JPEGLosslessDecoder extends Decoder {
	private jpegs:ArrayBuffer[] | null = null

	decode(frameNo: number):Promise<DataView> {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image.data);
		}
		return new Promise((resolve) => {
			const charlsDecode = () => {
				const decoder = new charls.JpegLSDecoder();
				const buffer = new Uint8Array(this.jpegs![frameNo]);
				const encodedBuffer = decoder.getEncodedBuffer(buffer.length);

				encodedBuffer.set(buffer);
				decoder.decode();

				const decoded = decoder.getDecodedBuffer();
				return resolve(decoded);
			};
			if (!initialized) {
				initCallback = charlsDecode;
			}
			else {
				charlsDecode();
			}
		});
	}
}

export default JPEGLosslessDecoder;

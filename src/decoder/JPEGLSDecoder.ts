import Decoder from "./Decoder";
import { getJpegData } from "./util";

class JPEGLosslessDecoder extends Decoder {
	private jpegs:DataView[] | null = null;

	decode(frameNo: number):Promise<DataView> {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image.data);
		}
		if (!this.jpegs?.length) {
			return Promise.reject(new Error("No JPEG-LS image data"));
		}
		return import("./codecs/charlsjs").then((CharLS) => (CharLS as any)({})
			.then((charLS: { JpegLSDecoder: new () => any; }) => {
				const decoder = new charLS.JpegLSDecoder();
				const jpeg = this.jpegs![frameNo];
				const buffer = new Uint8Array(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);
				const encodedBuffer = decoder.getEncodedBuffer(buffer.length);

				encodedBuffer.set(buffer);
				decoder.decode();

				const decoded = decoder.getDecodedBuffer();
				return decoded;
			}));
	}
}

export default JPEGLosslessDecoder;

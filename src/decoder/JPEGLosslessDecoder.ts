import { lossless as jpegLossless } from "jpeg-lossless-decoder-js";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class JPEGLosslessDecoder extends Decoder {
	private jpegs:DataView[] | null = null;

	protected decode(frameNo:number):Promise<DataView> {
		const { image } = this;
		if (!this.jpegs) {
			this.jpegs = getJpegData(image.data);
		}
		if (!this.jpegs?.length) {
			return Promise.reject(new Error("No JPEG lossless image data"));
		}
		const decoder = new jpegLossless.Decoder();
		const jpeg = this.jpegs![frameNo];
		const buffer = new Uint8Array(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);
		const temp = decoder.decode(buffer);
		// const numComponents = decoder.numComp;

		return Promise.resolve(temp);
	}
}

export default JPEGLosslessDecoder;

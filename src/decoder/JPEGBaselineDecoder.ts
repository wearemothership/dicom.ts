import { ISize } from "../image/Types";
import { JpegImage } from "./codecs/jpeg-baseline";
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
			return Promise.reject(new Error("No JPEG image data"));
		}
		const decoder = new JpegImage();
		const jpeg = this.jpegs![frameNo];
		const buffer = new Uint8Array(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);

		decoder.parse(buffer);
		const { width, height } = decoder as unknown as ISize;
		let decoded = null;
		if (image.bitsAllocated === 8) {
			decoded = decoder.getData(width, height);
		}
		else {
			decoded = decoder.getData16(width, height);
		}

		return Promise.resolve(<DataView> <unknown> decoded!);
	}
}

export default JPEGLosslessDecoder;

import OpenJpeg from "./codecs/openjpeg";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class JPEG2000Decoder extends Decoder {
	private jpegs:DataView[] | null = null;

	protected decode(frameNo:number):Promise<DataView> {
		const { image } = this;

		if (!this.jpegs) {
			this.jpegs = getJpegData(image.data);
		}
		return new Promise((resolve) => {
			OpenJpeg().then((OJ: { J2KDecoder: new () => any; }) => {
				const decoder = new OJ.J2KDecoder();
				const jpeg = this.jpegs![frameNo];
				const buffer = new Uint8Array(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);
				const encodedBuffer = decoder.getEncodedBuffer(buffer.length);
				encodedBuffer.set(buffer);
				const decodeLevel = 0;
				const decodeLayer = 0;
				for (let i = 0; i < 1; i += 1) {
					decoder.decodeSubResolution(decodeLevel, decodeLayer);
				}
				decoder.getFrameInfo();
				const decodedBuffer = decoder.getDecodedBuffer();
				return resolve(decodedBuffer);
			});
		});
	}
}

export default JPEG2000Decoder;

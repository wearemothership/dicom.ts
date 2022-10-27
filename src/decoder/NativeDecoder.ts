import * as twgl from "twgl.js";
import { IDecoderInfo } from "../image/DecoderInfo";
import Decoder from "./Decoder";
import { getJpegData } from "./util";

class NativeDecoder extends Decoder {
	private jpegs:DataView[];

	constructor(decoderInfo:IDecoderInfo) {
		super(decoderInfo);
		this.image.rgb = true; // native img decoder outputs RGB
		this.jpegs = getJpegData(decoderInfo.data);
	}

	
	protected decode(frameNo:number):Promise<DataView> {
		
		const jpegFrameData = this.jpegs?.[frameNo];
		if (!jpegFrameData) {
			return Promise.reject(new Error("No Native JPEG image data"));
		}

		return Promise.resolve(jpegFrameData);
	}

}

export default NativeDecoder;

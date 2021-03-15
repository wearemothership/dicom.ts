import Decoder from "./Decoder";
import RLEDecoder from "./RLEDecoder";
import NativeDecoder from "./NativeDecoder";
import JPEGLosslesDecoder from "./JPEGLosslessDecoder";
import JPEGLSDecoder from "./JPEGLSDecoder";
import JPEG2000Decoder from "./JPEG2000Decoder";
import JPEGBaselineDecoder from "./JPEGBaselineDecoder";

import DCMImage from "../parser/image";
import { Codec, decodeInfoForImage } from "../image/DecoderInfo";

export { Decoder };

const hasCreateObjectURL = !!URL.createObjectURL;

export const decoderForImage = (image:DCMImage):Decoder | null => {
	const info = decodeInfoForImage(image);
	switch (info.codec) {
		case Codec.JPEG:
			if (hasCreateObjectURL) {
				/* istanbul ignore next */
				return new NativeDecoder(info);
			}
			return new JPEGBaselineDecoder(info);
		case Codec.JPEGExt:
			return new JPEGBaselineDecoder(info);
		case Codec.JPEGLS:
			return new JPEGLSDecoder(info);
		case Codec.JPEGLossless:
			return new JPEGLosslesDecoder(info);
		case Codec.JPEG2000:
			// safari support native JPEG2000 decode
			if (hasCreateObjectURL && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
				/* istanbul ignore next */
				return new NativeDecoder(info);
			}
			return new JPEG2000Decoder(info);
		case Codec.RLE:
			return new RLEDecoder(info);
		case Codec.Uncompressed:
			return new Decoder(info);
		default:
	}
	/* istanbul ignore next */
	return null;
};

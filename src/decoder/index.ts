import Decoder from "./Decoder";
import RLEDecoder from "./RLEDecoder";
import NativeDecoder from "./NativeDecoder";
import JPEGLosslesDecoder from "./JPEGLosslessDecoder";
import JPEGLSDecoder from "./JPEGLSDecoder";
import JPEG2000Decoder from "./JPEG2000Decoder";
import JPEGBaselineDecoder from "./JPEGBaselineDecoder";

import { shouldUseNativeDecoder } from "./util";

export { Decoder };

export const decoderForImage = (image:any):Decoder | null => {
	if (!image.isCompressed()) {
		return new Decoder(image);
	}
	if (shouldUseNativeDecoder(image)) {
		return new NativeDecoder(image);
	}
	if (image.isCompressedRLE()) {
		return new RLEDecoder(image);
	}
	if (image.isCompressedJPEGLossless()) {
		return new JPEGLosslesDecoder(image);
	}
	if (image.isCompressedJPEGBaseline()) {
		return new JPEGBaselineDecoder(image);
	}
	if (image.isCompressedJPEG2000()) {
		return new JPEG2000Decoder(image);
	}
	if (image.isCompressedJPEGLS()) {
		return new JPEGLSDecoder(image);
	}
	return null;
};

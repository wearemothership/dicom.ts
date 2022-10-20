import { TransferSyntax } from "../parser/constants";
import DCMImage from "../parser/image";
import { displayInfoFromDecoderInfo } from "./DisplayInfo";
import { ImageSize, Codec,IDecoderInfo } from "./Types";

export type {IDecoderInfo};

//--------------------------------------------------------
const Signed = 0x8;
export enum PixelDataType {
	Uint8 		= 0x1,
	Int8 		= 0x1 & Signed,
	Uint16 		= 0x2,
	Int16 		= 0x2 & Signed
}
/* eslint-enable no-bitwise */


//--------------------------------------------------------

export class DecoderInfo implements IDecoderInfo {
	image: DCMImage;

	size: ImageSize;

	codec: Codec;

	rgb: boolean;

	planar: boolean;

	samples: number;

	bitsAllocated: number;

	bytesAllocated: number;

	bitsStored: number;

	signed: boolean;

	littleEndian: boolean;

	/* A reference to the raw (encoded?)image rawData. */
	rawData: DataView;

	constructor(image: DCMImage) {
		this.image = image;
		if (!image.pixelData) {
			throw Error("Image has no data");
		}
		this.size = new ImageSize(image);
		switch (image.transferSyntax) {
			case TransferSyntax.CompressionJpeg:
			case TransferSyntax.CompressionJpegBaseline8bit:
				this.codec = Codec.JPEG;
				break;
			case TransferSyntax.CompressionJpegBaseline12bit:
				this.codec = Codec.JPEGExt;
				break;
			case TransferSyntax.CompressionJpegLossless:
			case TransferSyntax.CompressionJpegLosslessSel1:
				this.codec = Codec.JPEGLossless;
				break;
			case TransferSyntax.CompressionJpegLs:
			case TransferSyntax.CompressionJpegLsLossless:
				this.codec = Codec.JPEGLS;
				break;
			case TransferSyntax.CompressionJpeg2000Lossless:
			case TransferSyntax.CompressionJpeg2000:
				this.codec = Codec.JPEG2000;
				break;
			case TransferSyntax.CompressionRLE:
				this.codec = Codec.RLE;
				break;
			case TransferSyntax.CompressionDeflate:
			case TransferSyntax.ImplicitLittle:
			case TransferSyntax.ExplicitLittle:
			case TransferSyntax.ExplicitBig:
				this.codec = Codec.Uncompressed;
				break;
			default:
				this.codec = Codec.Uncompressed;
		}

		this.rgb = !(image.photometricInterpretation || "").startsWith("MONO");
		this.planar = !!image.planarConfig;
		this.samples = image.samplesPerPixel;
		this.bitsAllocated = image.bitsAllocated;
		this.bytesAllocated = Math.round(image.bitsAllocated / 8);
		this.bitsStored = image.bitsStored;
		this.signed = image.pixelRepresentation === 1;
		this.rawData = image.pixelData.value as DataView;
		this.littleEndian = image.littleEndian;
	}
}

// export const decodeInfoForImage = (image: DCMImage):IDecoderInfo => new DecoderInfo(image);

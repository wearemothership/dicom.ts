import { TransferSyntax } from "../parser/constants";
import DCMImage from "../parser/image";
import { ImageSize } from "./Types";

/* eslint-disable no-bitwise */
export enum Codec {
	Uncompressed	= 0x0,
	JPEG 			= 0x1,		// baseline
	JPEGExt			= 0x1 << 1,	// baseline 12bit (extended)
	JPEG2000 		= 0x1 << 2,
	JPEGLS 			= 0x1 << 3,
	JPEGLossless 	= 0x1 << 4,
	RLE				= 0x1 << 5,
}

const Signed = 0x8;
export enum PixelDataType {
	Uint8 		= 0x1,
	Int8 		= 0x1 & Signed,
	Uint16 		= 0x2,
	Int16 		= 0x2 & Signed
}
/* eslint-enable no-bitwise */

/**
 * Decoder input info
 */
export interface IDecoderInfo {
	image: DCMImage // orignal image data

	size: ImageSize
	codec: Codec
	rgb: boolean
	planar: boolean
	samples: number
	bitsAllocated: number
	bytesAllocated: number
	bitsStored: number
	signed: boolean
	littleEndian: boolean
	data: DataView
}

class DecoderInfo implements IDecoderInfo {
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

	data: DataView;

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
		this.data = image.pixelData.value as DataView;
		this.littleEndian = image.littleEndian;
	}
}

export const decodeInfoForImage = (image: DCMImage):IDecoderInfo => new DecoderInfo(image);

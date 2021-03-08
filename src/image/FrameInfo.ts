import { TransferSyntax } from "../parser/constants";
import Image from "../parser/image";

interface IFrameInfo {
	frameNo: number;
	width: number;
	height: number;

	bitsAllocated: number;
	bitsStored: number;
	intercept: number,
	invert: boolean,
	isRGB: boolean;
	littleEndian: boolean;
	lutData: Uint8Array | null;
	lutDescriptor: Array<number> | null;
	signed: boolean;
	slope: number,
	windowCenter: number | null;
	windowWidth: number | null;

	texture: WebGLTexture
}

interface IImageInfo {
	width: number;
	height: number;

	bitsAllocated: number;
	bitsStored: number;
	columns: number;
	dataType: number; // TODO: enum
	intercept: number,
	invert: boolean;
	isRGB: boolean;
	littleEndian: boolean;
	lutData: Uint8Array | null;
	lutDescriptor: Array<number> | null;
	photometricInterpretation: number; // TODO: enum
	pixelRepresentation: number; // TODO: enum
	rows: number;
	samplesPerPixel: number;
	slope: number,
	transferSyntax: TransferSyntax;
	windowCenter: number | null;
	windowWidth: number | null;
}

interface IFrameInfoConstructor {
	imageInfo: IImageInfo,
	frameNo: number,
	texture: WebGLTexture
}

export interface IImageLutInfo {
	nEntries: number;
	firstValue: number;
	bitsStored: number;
	data: Uint8Array | Uint16Array
}

class FrameInfo implements IFrameInfo {
	image: IImageInfo;

	frameNo: number;

	isRGB = false;

	lutData: Uint8Array | null = null;

	lutDescriptor: Array<number> | null = null;

	invert = false;

	texture: WebGLTexture;

	width: number;

	height: number;

	signed: boolean;

	bitsAllocated: number;

	bitsStored: number;

	littleEndian: boolean;

	slope: number;

	intercept: number;

	windowCenter: number | null;

	windowWidth: number | null;

	constructor(info: IFrameInfoConstructor) {
		const image = info.imageInfo;
		this.image = image;
		this.frameNo = info.frameNo;
		this.texture = info.texture;
		this.width = info.imageInfo.columns;
		this.height = info.imageInfo.rows;
		this.signed = info.imageInfo.pixelRepresentation !== 0;
		this.isRGB = image.dataType === Image.byteType.rgb; // TODO: OR native decoder
		this.bitsAllocated = image.bitsAllocated;
		this.bitsStored = image.bitsStored;
		this.littleEndian = image.littleEndian;
		this.slope = image.slope;
		this.intercept = image.intercept;
		this.windowCenter = image.windowCenter;
		this.windowWidth = image.windowWidth;
		this.lutDescriptor = image.lutDescriptor;
		this.lutData = image.lutData;
		this.invert = image.invert;
	}
}

export default FrameInfo;

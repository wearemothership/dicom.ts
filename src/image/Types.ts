
import DCMImage from "../parser/image";

export interface ISize {
	width: number,
	height: number
}
//--------------------------------------------------------
export interface IImageSizeContructor {
	width?: number,
	height?: number,
	rows?: number,
	columns?: number
}
//--------------------------------------------------------
export interface IImageSize extends ISize {
	width: number,
	height: number,
	rows: number,
	columns: number
}
//--------------------------------------------------------
export class ImageSize implements IImageSize {
	readonly width: number;

	readonly height: number;

	constructor({
		width,
		height,
		rows,
		columns
	}: IImageSizeContructor) {
		this.width = width ?? columns ?? 0;
		this.height = height ?? rows ?? 0;
	}

	get rows():number {
		return this.height;
	}

	get columns():number {
		return this.width;
	}

	get numberOfPixels(): number {
		const { width, height } = this;
		return width * height;
	}

	scale(scale: number):ImageSize {
		let { width, height } = this;
		width *= scale;
		height *= scale;
		return new ImageSize({ width, height });
	}
}


//--------------------------------------------------------
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

//--------------------------------------------------------

/**
 * Decoder input info
 */
 export interface IDecoderInfo {
	image: DCMImage // orignal image data

	size: ImageSize
	codec: Codec
	rgb: boolean
	planar: boolean
	samples: number//?
	bitsAllocated: number
	bytesAllocated: number//?
	bitsStored: number//?
	signed: boolean//?
	littleEndian: boolean//?
	data: DataView
}

//--------------------------------------------------------

/* Defining an interface for a lookup table. */
export interface IImageLutInfo {
	nEntries: number;
	firstValue: number;
	bitsStored: number;
	data: Uint8Array | Uint16Array
}


//--------------------------------------------------------
/* Defining an interface for a lookup table. */
export interface IImagePaletteInfo {
	nEntries: number;
	firstValue: number;
	bitsAllocated: number;
	r: DataView;
	g: DataView;
	b: DataView;
}

//--------------------------------------------------------
/* Defining an interface for a lookup table. */
export interface IDisplayInfo extends IDecoderInfo {

	nFrames: number

	lut: IImageLutInfo | null
	palette: IImagePaletteInfo | null

	invert: boolean

	pixelPaddingVal: number | null

	minPixVal: number | null
	maxPixVal: number | null

	windowCenter: number | null
	windowWidth: number | null

	slope: number
	intercept: number
}

//--------------------------------------------------------
/* Defining an interface for a frame. */
export interface IFrameInfo {
	frameNo: number

	imageInfo: IDisplayInfo

	pixelData: Blob

	mat4Pix2Pat: Float32Array

	texture: WebGLTexture

	getPix2MM(pixpnt:number[]): number[] ;
	
	getMM2Pix(patpnt:number[]): number[] ;

	destroy(): void
}
import { IDecoderInfo } from "./DecoderInfo";
import DCMImage from "../parser/image";
import { TagIds } from "../parser/tag";

export interface IImageLutInfo {
	nEntries: number;
	firstValue: number;
	bitsStored: number;
	data: Uint8Array | Uint16Array
}

export interface IImagePaletteInfo {
	nEntries: number;
	firstValue: number;
	bitsAllocated: number;
	r: DataView;
	g: DataView;
	b: DataView;
}

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

const lutInfoFromImage = (image: DCMImage): IImageLutInfo | null => {
	const lutDescriptor = image.getTagValue(TagIds.VoiLutDescriptor) as number[];
	if (lutDescriptor?.length !== 3) {
		return null;
	}
	const [nEntries, firstValue, bitsStored] = lutDescriptor;
	if (nEntries === 0 || nEntries >= 2 ** bitsStored - 1) {
		return null;
	}
	let ArrayType: Uint8ArrayConstructor | Uint16ArrayConstructor = Uint8Array;
	if (bitsStored > 8) {
		ArrayType = Uint16Array;
	}
	const lutDataTagValue = image.getTagValue(TagIds.VoiLutData) as Uint8Array | Uint16Array;
	if (!lutDataTagValue) {
		return null;
	}
	const data = new ArrayType(
		lutDataTagValue,
		0,
		Math.min(lutDescriptor[0] || 2 ** 16, lutDataTagValue.length)
	);

	return {
		nEntries,
		firstValue,
		bitsStored,
		data
	};
};

const paletteInfoFromImage = (info: IDecoderInfo): IImagePaletteInfo | null => {
	const { image } = info;
	const reds = image.getTagValue(TagIds.PaletteRed) as DataView;
	const greens = image.getTagValue(TagIds.PaletteGreen) as DataView;
	const blues = image.getTagValue(TagIds.PaletteBlue) as DataView;
	if ((reds?.byteLength > 0)
		&& (greens?.byteLength > 0)
		&& (blues?.byteLength > 0)) {
		const paletteInfo = image.getTagValue(TagIds.PaletteRedDescriptor) as [number, number, number];
		const [nEntries,, bitsAllocated] = paletteInfo;
		return {
			nEntries,
			bitsAllocated,
			r: reds,
			g: greens,
			b: blues
		} as IImagePaletteInfo;
	}
	return null;
};

export const displayInfoFromDecoderInfo = (info:IDecoderInfo): IDisplayInfo => {
	const { image } = info;
	let invert = image.getTagValueIndexed(TagIds.LutShape) === "inverse";
	invert = invert || image.photometricInterpretation === "MONOCHROME1";

	const displayInfo: IDisplayInfo = {
		...info,

		nFrames: image.numberOfFrames || 1,

		pixelPaddingVal: image.pixelPaddingValue,

		lut: lutInfoFromImage(info.image),
		palette: paletteInfoFromImage(info),

		minPixVal: image.imageMin,
		maxPixVal: image.imageMax,

		windowCenter: image.windowCenter,
		windowWidth: image.windowWidth,

		slope: image.dataScaleSlope || 1.0,
		intercept: image.dataScaleIntercept || 0.0,

		invert
	};
	return displayInfo;
};

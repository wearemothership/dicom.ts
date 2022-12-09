
import DCMImage from "../parser/image";
import { TagIds } from "../parser/tag";
import {IDecoderInfo, IImageLutInfo, IImagePaletteInfo,IDisplayInfo} from "./Types";


export type {IDisplayInfo};

//--------------------------------------------------------
/**
 * It takes a DICOM image and returns an object that describes the image's LUT, or null if the image
 * doesn't have a LUT
 * @param {DCMImage} image - DCMImage - the image object
 * @returns An object with the following properties:
 * nEntries: number;
 * firstValue: number;
 * bitsStored: number;
 * data: Uint8Array | Uint16Array;
 */
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


//--------------------------------------------------------
/**
 * It returns an object containing the palette information from the image, or null if the image does
 * not have a palette
 * @param {IDecoderInfo} info - IDecoderInfo
 * @returns An object with the following properties:
 * - nEntries: number
 * - bitsAllocated: number
 * - r: DataView
 * - g: DataView
 * - b: DataView
 */
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


//--------------------------------------------------------


/**
 * It takes a decoder info object and returns a display info object
 * @param {IDecoderInfo} info - The decoder info object.
 * @returns An object with the following properties:
 * 	- nFrames: number of frames
 * 	- pixelPaddingVal: pixel padding value
 * 	- lut: lut info
 * 	- palette: palette info
 * 	- minPixVal: minimum pixel value
 * 	- maxPixVal: maximum pixel value
 * 	- windowCenter: window center
 * 	- windowWidth: window
 */
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

		modulationColor: [1,1,1,1],

		invert
	};
	return displayInfo;
};

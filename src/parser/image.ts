import Tag, {
	TagIds,
	createTagIdWithTag,
} from "./tag";

import {
	TransferSyntax,
	SliceDirection,
	ByteType,
	PixelRepresentation
} from "./constants";

import DCMObject from "./dicomobj"

//------------------------------------------------------------------
enum Axis {
	R = "R",
	L = "L",
	A = "A",
	P = "P",
	F = "F",
	H = "H",
}

// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
const ObliquityThresholdCosineValue = 0.8;
const getMajorAxisFromPatientRelativeDirectionCosine = (
	x: number,
	y: number,
	z: number
): Axis | null => {
	const absX = Math.abs(x);
	const absY = Math.abs(y);
	const absZ = Math.abs(z);

	// The tests here really don't need to check the other dimensions,
	// just the threshold, since the sum of the squares should be == 1.0
	// but just in case ...
	let axis = null;
	if ((absX > ObliquityThresholdCosineValue) && (absX > absY) && (absX > absZ)) {
		const orientationX = (x < 0) ? Axis.R : Axis.L;
		axis = orientationX;
	}
	else if ((absY > ObliquityThresholdCosineValue) && (absY > absX) && (absY > absZ)) {
		const orientationY = (y < 0) ? Axis.A : Axis.P;
		axis = orientationY;
	}
	else if ((absZ > ObliquityThresholdCosineValue) && (absZ > absX) && (absZ > absY)) {
		const orientationZ = (z < 0) ? Axis.F : Axis.H;
		axis = orientationZ;
	}
	return axis;
};
//======================================================================

class DCMImage extends DCMObject {
	static skipPaletteConversion = false;

	decompressed = false;

	bytesAllocated: number | null = null;

	/**
	 * Returns the pixel data tag.
	 * @returns {Tag}
	 */
	get pixelData(): Tag {
		return this.tags[createTagIdWithTag(TagIds.PixelData)];
	}

	/**
	 * Returns the number of columns.
	 * @returns {number}
	 */
	get columns(): number {
		return this.getTagValueIndexed(TagIds.Cols) as number;
	}

	/**
	 * Returns the number of rows.
	 * @returns {number}
	 */
	get rows(): number {
		return this.getTagValueIndexed(TagIds.Rows) as number;
	}


	/**
	 * Returns the image position.
	 * @return {number[]}
	 */
	get imagePosition(): number[] {
		return this.getTagValue(TagIds.ImagePosition) as number[];
	}

	/**
	 * Returns the image axis directions as 2 vectors of 3 elements (6 items)
	 * @return {number[]}
	 */
	get imageDirections(): number[] {
		return this.getTagValue(TagIds.ImageOrientation) as number[];
	}

	/**
	 * Returns the pixel spacing.
	 * @returns {number[]}
	 */
	 get pixelSpacing(): number[] {
		return this.getTagValue(TagIds.PixelSpacing) as number[];
	}

	/**
	 * Returns the image position value by index.
	 * @param {number} sliceDir - the index
	 * @returns {number}
	 */
	getImagePositionSliceDir(sliceDir: number): number {
		const imagePos = this.imagePosition;
		if (imagePos && sliceDir >= 0) {
			return imagePos[sliceDir];
		}
		return 0;
	}

	/**
	 * Returns the slice location.
	 * @returns {number}
	 */
	get sliceLocation(): number {
		return this.getTagValueIndexed(TagIds.SliceLocation) as number;
	}

	/**
	 * Returns the slice location vector.
	 * @returns {number[]}
	 */
	get sliceLocationVector(): number[] {
		return this.getTagValue(TagIds.SliceLocationVector) as number[];
	}

	/**
	 * Returns the image number.
	 * @returns {number}
	 */
	get imageNumber(): number {
		return this.getTagValueIndexed(TagIds.ImageNum) as number;
	}

	/**
	 * Returns the temporal position.
	 * @returns {number}
	 */
	get temporalPosition(): number {
		return this.getTagValueIndexed(TagIds.TemporalPosition) as number;
	}

	/**
	 * Returns the temporal number.
	 * @returns {number}
	 */
	get temporalNumber(): number {
		return this.getTagValueIndexed(TagIds.NumberTemporalPositions) as number;
	}

	/**
	 * Returns the slice gap.
	 * @returns {number}
	 */
	get sliceGap(): number {
		return this.getTagValueIndexed(TagIds.SliceGap) as number;
	}

	/**
	 * Returns the slice thickness.
	 * @returns {number}
	 */
	get sliceThickness(): number {
		return this.getTagValueIndexed(TagIds.SliceThickness) as number;
	}

	/**
	 * Returns the image maximum.
	 * @returns {number}
	 */
	get imageMax(): number {
		return this.getTagValueIndexed(TagIds.ImageMax) as number;
	}

	/**
	 * Returns the image minimum.
	 * @returns {number}
	 */
	get imageMin(): number {
		return this.getTagValueIndexed(TagIds.ImageMin) as number;
	}

	/**
	 * Returns the rescale slope.
	 * @returns {number}
	 */
	get dataScaleSlope(): number {
		return this.getTagValueIndexed(TagIds.DataScaleSlope) as number;
	}

	/**
	 * Returns the rescale intercept.
	 * @returns {number}
	 */
	get dataScaleIntercept(): number {
		return this.getTagValueIndexed(TagIds.DataScaleIntercept) as number;
	}

	get dataScaleElscint(): number {
		let scale = this.getTagValueIndexed(TagIds.DataScaleElscint) as number || 1;

		const bandwidth = this.pixelBandwidth;
		scale = Math.sqrt(bandwidth) / (10 * scale);

		if (scale <= 0) {
			scale = 1;
		}
		return scale;
	}

	/**
	 * Returns the window width (from top level as frame data can have these values)
	 * @returns {number}
	 */
	get windowWidth(): number {
		const tagVal = this.getTopLevelTag(TagIds.WindowWidth)?.value as number[];
		return tagVal?.[0];
	}

	/**
	 * Returns the window center (from top level as frame data can have these values)
	 * @returns {number}
	 */
	get windowCenter(): number {
		const tagVal = this.getTopLevelTag(TagIds.WindowCenter)?.value as number[];
		return tagVal?.[0];
	}

	get pixelBandwidth(): number {
		return this.getTagValueIndexed(TagIds.PixelBandwidth) as number;
	}

	get seriesId() {
		const ids = [
			this.seriesDescription,
			this.seriesInstanceUID,
			this.seriesNumber,
			this.echoNumber,
			this.orientation,
		].filter((id) => id != null); // remove nulls

		const { columns, rows } = this;
		return `${ids.join(",")} (${columns} x ${rows})`;
	}

	/**
	 * Returns the image type.
	 * @returns {string[]}
	 */
	get imageType(): string[] {
		return this.getTagValue(TagIds.ImageType) as string[];
	}

	/**
	 * Returns the number of bits stored.
	 * @returns {number}
	 */
	get bitsStored(): number {
		return this.getTagValueIndexed(TagIds.BitsStored) as number;
	}

	/**
	 * Returns the number of bits allocated.
	 * @returns {number}
	 */
	get bitsAllocated(): number {
		return this.getTagValueIndexed(TagIds.BitsAllocated) as number;
	}

	/**
	 * Returns the frame time.
	 * @returns {number}
	 */
	getFrameTime(): number {
		return this.getTagValueIndexed(TagIds.FrameTime) as number;
	}

	/**
	 * Returns the acquisition matrix (e.g., "mosaic" data).
	 * @returns {number[]}
	 */
	getAcquisitionMatrix(): number[] {
		const mat:[number, number] = [0, 0];
		mat[0] = this.getTagValueIndexed(TagIds.AcquisitionMatrix) as number;

		if (this.privateDataAll === null) {
			this.privateDataAll = this.allInterpretedPrivateData;
		}

		if (this.privateDataAll?.length > 0) {
			const start = this.privateDataAll.indexOf("AcquisitionMatrixText");
			if (start !== -1) {
				const end = this.privateDataAll.indexOf("\n", start);

				if (end !== -1) {
					const str = this.privateDataAll.substring(start, end);
					const matPrivate = str.match(/\d+/g);

					if (matPrivate?.length ?? 0 >= 1) {
						mat[0] = parseFloat(matPrivate![0]);
						if (matPrivate?.length === 2) {
							mat[1] = parseFloat(matPrivate![1]);
						}
					}
				}
			}
		}

		if (mat[1] === 0) {
			[mat[1]] = mat;
		}

		return mat;
	}

	
	/**
	 * Returns true if pixel data is found.
	 * @returns {boolean}
	 */
	hasPixelData(): boolean {
		return (this.tags[createTagIdWithTag(TagIds.PixelData)] !== undefined);
	}

	/**
	 * Returns an orientation string (e.g., XYZ+--).
	 * @returns {string}
	 */
	get orientation(): string | null {
		let orientation = null;
		const dirCos = this.getTagValue(TagIds.ImageOrientation) as number[];
		let bigRow = 0;
		let bigCol = 0;

		if (dirCos?.length !== 6) {
			return null;
		}

		const spacing = this.pixelSpacing;

		if (!spacing) {
			return null;
		}

		const [rowSpacing] = spacing;
		const swapZ = true;
		let biggest = 0;
		let ctr = 0;
		for (; ctr < 3; ctr += 1) {
			if (Math.abs(dirCos[ctr]) > biggest) {
				biggest = Math.abs(dirCos[ctr]);
				bigRow = ctr;
			}
		}

		biggest = 0;
		for (; ctr < 6; ctr += 1) {
			if (Math.abs(dirCos[ctr]) > biggest) {
				biggest = Math.abs(dirCos[ctr]);
				bigCol = ctr;
			}
		}

		let orient = "";
		switch (bigRow) {
			case 0:
				orient += ("X");
				if (bigCol === 4) {
					orient += ("YZ");
				}
				else {
					orient += ("ZY");
				}
				break;
			case 1:
				orient += ("Y");
				if (bigCol === 3) {
					orient += ("XZ");
				}
				else {
					orient += ("ZX");
				}
				break;
			case 2:
				orient += ("Z");
				if (bigCol === 3) {
					orient += ("XY");
				}
				else {
					orient += ("YX");
				}
				break;
			default:
				break;
		}

		switch (bigRow) {
			case 0:
				if (dirCos[bigRow] > 0.0) {
					orient += ("-");
				}
				else {
					orient += ("+");
				}
				if (bigCol === 4) {
					if (dirCos[bigCol] > 0.0) {
						orient += ("-");
					}
					else {
						orient += ("+");
					}
				}
				else if (dirCos[bigCol] > 0.0) {
					orient += ("+");
				}
				else {
					orient += ("-");
				}
				break;
			case 1:
				if (dirCos[bigRow] > 0.0) {
					orient += ("-");
				}
				else {
					orient += ("+");
				}
				if (bigCol === 3) {
					if (dirCos[bigCol] > 0.0) {
						orient += ("-");
					}
					else {
						orient += ("+");
					}
				}
				else if (dirCos[bigCol] > 0.0) {
					orient += ("+");
				}
				else {
					orient += ("-");
				}
				break;
			case 2:
				if (dirCos[bigRow] > 0.0) {
					orient += ("+");
				}
				else {
					orient += ("-");
				}
				// Has to be X or Y so opposite senses
				if (dirCos[bigCol] > 0.0) {
					orient += ("-");
				}
				else {
					orient += ("+");
				}
				break;
			default:
				break;
		}

		if (rowSpacing === 0.0) {
			orient += ("+");
			orientation = orient;
		}
		else {
			if (swapZ) {
				switch (orient.charAt(2)) {
					case "X":
						if (rowSpacing > 0.0) {
							orient += ("-");
						}
						else {
							orient += ("+");
						}
						break;
					case "Y":
					case "Z":
						if (rowSpacing > 0.0) {
							orient += ("+");
						}
						else {
							orient += ("-");
						}
						break;
					default:
						break;
				}
			}
			else {
				switch (orient.charAt(2)) {
					case "X":
						if (rowSpacing > 0.0) {
							orient += ("+");
						}
						else {
							orient += ("-");
						}
						break;
					case "Y":
					case "Z":
						if (rowSpacing > 0.0) {
							orient += ("-");
						}
						else {
							orient += ("+");
						}
						break;
					default:
						break;
				}
			}

			orientation = orient;
		}

		return orientation;
	}

	/**
	 * Returns true if this image is "mosaic".
	 * @returns {boolean}
	 */
	isMosaic(): boolean {
		const { imageType } = this;
		let labeledAsMosaic = false;
		if (imageType !== null) {
			for (let ctr = 0; ctr < imageType.length; ctr += 1) {
				if (imageType[ctr].toUpperCase().indexOf("MOSAIC") !== -1) {
					labeledAsMosaic = true;
					break;
				}
			}
		}
		if (!labeledAsMosaic) {
			return false;
		}
		const [matHeight, matWidth] = this.getAcquisitionMatrix();
		const canReadAsMosaic = (matHeight > 0)
			&& ((matHeight < this.rows)
			|| (matWidth < this.columns));
		return canReadAsMosaic;
	}

	/**
	 * Returns true if this image uses palette colors.
	 * @returns {boolean}
	 */
	isPalette(): boolean {
		const value = this.getTagValueIndexed(TagIds.PhotometricInterpretation) as string;
		return (value != null && value.toLowerCase().indexOf("palette") !== -1);
	}

	get mosaicCols() {
		return this.columns / this.getAcquisitionMatrix()[1];
	}

	get mosaicRows() {
		return this.rows / this.getAcquisitionMatrix()[0];
	}

	isElscint() {
		const tag = this.getTag(TagIds.DataScaleElscint);
		return (tag !== undefined);
	}

	/**
	 * Returns true if this image stores compressed data.
	 * @returns {boolean}
	 */
	isCompressed(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if (transferSyntax.indexOf(TransferSyntax.CompressionJpeg) !== -1) {
				return true;
			}
			if (transferSyntax.indexOf(TransferSyntax.CompressionRLE) !== -1) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if this image stores JPEG data.
	 * @returns {boolean}
	 */
	isCompressedJPEG(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if (transferSyntax.indexOf(TransferSyntax.CompressionJpeg) !== -1) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true of this image stores lossless JPEG data.
	 * @returns {boolean}
	 */
	isCompressedJPEGLossless(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if ((transferSyntax.indexOf(TransferSyntax.CompressionJpegLossless) !== -1)
				|| (transferSyntax.indexOf(TransferSyntax.CompressionJpegLosslessSel1) !== -1)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if this image stores baseline JPEG data.
	 * @returns {boolean}
	 */
	isCompressedJPEGBaseline(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if ((transferSyntax.indexOf(TransferSyntax.CompressionJpegBaseline8bit) !== -1)
				|| (transferSyntax.indexOf(TransferSyntax.CompressionJpegBaseline12bit)
					!== -1)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if this image stores JPEG2000 data.
	 * @returns {boolean}
	 */
	isCompressedJPEG2000(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if ((transferSyntax.indexOf(TransferSyntax.CompressionJpeg2000) !== -1)
				|| (transferSyntax.indexOf(TransferSyntax.CompressionJpeg2000Lossless) !== -1)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if this image stores JPEG-LS data.
	 * @returns {boolean}
	 */
	isCompressedJPEGLS(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if ((transferSyntax.indexOf(TransferSyntax.CompressionJpegLs) !== -1)
				|| (transferSyntax.indexOf(TransferSyntax.CompressionJpegLsLossless) !== -1)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if this image stores RLE data.
	 * @returns {boolean}
	 */
	isCompressedRLE(): boolean {
		const { transferSyntax } = this;
		if (transferSyntax) {
			if (transferSyntax.indexOf(TransferSyntax.CompressionRLE) !== -1) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the number of frames.
	 * @returns {number}
	 */
	get numberOfFrames(): number {
		const value = this.getTagValueIndexed(TagIds.NumberOfFrames) as number;
		return value ?? 1;
	}

	/**
	 * Returns the number of samples per pixel.
	 * @returns {number}
	 */
	get samplesPerPixel(): number {
		const value = this.getTagValueIndexed(TagIds.SamplesPerPixel) as number;
		return value ?? 1;
	}

	getNumberOfImplicitFrames():number {
		if (this.isCompressed()) {
			return 1;
		}

		const { pixelData } = this;
		const length = pixelData.offsetEnd! - pixelData.offsetValue!;
		const size = this.columns * this.rows * Math.round(this.bitsAllocated / 8);

		return Math.floor(length / size);
	}

	/**
	 * Returns the pixel representation.
	 * @returns {PixelRepresentation}
	 */
	get pixelRepresentation(): PixelRepresentation {
		return this.getTagValueIndexed(TagIds.PixelRepresentation) as PixelRepresentation;
	}

	/**
	 * Returns the pixel padding value
	 * @returns {PixelPaddingValue}
	 */
	get pixelPaddingValue(): number {
		return this.getTagValueIndexed(TagIds.PixelPaddingValue) as number;
	}

	/**
	 * Returns the photometric interpretation.
	 * @returns {string}
	 */
	get photometricInterpretation(): string {
		return this.getTagValueIndexed(TagIds.PhotometricInterpretation) as string;
	}

	/**
	 * Returns the planar configuration.
	 * @returns {number}
	 */
	get planarConfig(): number {
		return this.getTagValueIndexed(TagIds.PlanarConfig) as number;
	}

	/**
	 * Returns all descriptive info for this image.
	 * @returns {string}
	 */
	get imageDescription(): string {
		const values = [
			this.getTagValueIndexed(TagIds.StudyDes),
			this.getTagValueIndexed(TagIds.SeriesDescription),
			this.getTagValueIndexed(TagIds.ImageComments)
		].filter((el) => el !== null);

		return values.join(" ").trim();
	}

	/**
	 * Returns the datatype (e.g., ByteType.integerUnsigned).
	 * @returns {number}
	 */
	get dataType(): ByteType {
		const dataType = this.pixelRepresentation;

		if (dataType === null) {
			return ByteType.Unkown;
		}

		const interp = this.photometricInterpretation?.trim() || null;
		if (interp
			&& ((interp.indexOf("RGB") !== -1)
				|| (interp.indexOf("YBR") !== -1)
				|| (interp.toLowerCase().indexOf("palette") !== -1)
			)) {
			return ByteType.Rgb;
		}

		if (dataType === 0) {
			return ByteType.IntegerUnsigned;
		}
		if (dataType === 1) {
			return ByteType.Integer;
		}
		return ByteType.Unkown;
	}

	// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
	get acquiredSliceDirection() {
		const dirCos = this.getTagValue(TagIds.ImageOrientation) as number[];

		if (dirCos?.length !== 6) {
			return SliceDirection.Unknown;
		}

		const rowAxis = getMajorAxisFromPatientRelativeDirectionCosine(dirCos[0], dirCos[1], dirCos[2]);
		const colAxis = getMajorAxisFromPatientRelativeDirectionCosine(dirCos[3], dirCos[4], dirCos[5]);
		if ((rowAxis !== null) && (colAxis !== null)) {
			if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "A") || (colAxis === "P"))) {
				return SliceDirection.Axial;
			}
			if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "A") || (rowAxis === "P"))) {
				return SliceDirection.Axial;
			}
			if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "H") || (colAxis === "F"))) {
				return SliceDirection.Coronal;
			}
			if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "H") || (rowAxis === "F"))) {
				return SliceDirection.Coronal;
			}
			if (((rowAxis === "A") || (rowAxis === "P")) && ((colAxis === "H") || (colAxis === "F"))) {
				return SliceDirection.Sagittal;
			}
			if (((colAxis === "A") || (colAxis === "P")) && ((rowAxis === "H") || (rowAxis === "F"))) {
				return SliceDirection.Sagittal;
			}
		}
		return SliceDirection.Oblique;
	}

}

export default DCMImage;
export { ByteType };

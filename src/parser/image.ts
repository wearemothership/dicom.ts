import Tag, {
	TagIds,
	TagValue,
	createTagId,
	createTagIdWithTag,
	TagStringID,
	TagTupleID
} from "./tag";
import {
	TransferSyntax,
	SliceDirection,
	ByteType,
	PixelRepresentation
} from "./constants";

const getSingleValueSafely = (tag: Tag | null, index: number): any => (
	(<Array<any> | undefined> tag?.value)?.[index] || null);

const getValueSafely = (tag:Tag):TagValue => (tag?.value ?? null);

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

const scalePalette = (pal: number[]):number[] => {
	const max = Math.max(...pal);
	const min = Math.min(...pal);

	if ((max > 255) || (min < 0)) {
		const slope = 255.0 / (max - min);
		const intercept = min;

		for (let ctr = 0; ctr < pal.length; ctr += 1) {
			// eslint-disable-next-line no-param-reassign
			pal[ctr] = Math.round((pal[ctr] - intercept) * slope);
		}
	}

	return pal;
};

interface IImageInfo {
	tags: Record<TagStringID, Tag>
	tagsFlat: Record<TagStringID, Tag>
	littleEndian: boolean
	index: number
}

class DCMImage implements IImageInfo {
	static skipPaletteConversion = false;

	tags: Record<TagStringID, Tag> = {};

	tagsFlat: Record<TagStringID, Tag> = {};

	littleEndian = false;

	index = -1;

	decompressed = false;

	privateDataAll: string | null = null;

	bytesAllocated: number | null = null;

	/**
	 * Returns a tag matching the specified group and element tuple
	 * @param {TagTupleID} tag - Tuple of group & elem like TagIds values
	 * @returns
	 */
	getTag(tag: TagTupleID):Tag {
		const [group, element] = tag;
		const tagId = createTagId(group, element);
		return this.tags[tagId] ?? this.tagsFlat[tagId];
	}

	/**
	 * get the value of the tag if exists
	 * @param {TagTupleID} tag tuple of group and element ids
	 * @returns the value of the tag or null if not exist
	 */
	getTagValue(tag:TagTupleID):TagValue {
		return getValueSafely(this.getTag(tag));
	}

	/**
	 * get the value of the tag if exists
	 * @param {TagTupleID} tag tuple of group and element ids
	 * @param {Number} index the position in the value
	 * @returns the value at index or null if not exist
	 */
	getTagValueIndexed(tag: TagTupleID, index:number = 0): any {
		return getSingleValueSafely(this.getTag(tag), index);
	}

	/**
	 * Returns the pixel data tag.
	 * @returns {daikon.Tag}
	 */
	get pixelData(): Tag {
		return this.tags[createTagIdWithTag(TagIds.PixelData)];
	}

	/**
	 * Returns the number of columns.
	 * @returns {number}
	 */
	get columns(): number {
		return this.getTagValueIndexed(TagIds.Cols);
	}

	/**
	 * Returns the number of rows.
	 * @returns {number}
	 */
	get rows(): number {
		return this.getTagValueIndexed(TagIds.Rows);
	}

	/**
	 * Returns the series description.
	 * @returns {string}
	 */
	get seriesDescription(): string {
		return this.getTagValueIndexed(TagIds.SeriesDescription);
	}

	/**
	 * Returns the series instance UID.
	 * @returns {string}
	 */
	get seriesInstanceUID(): string {
		return this.getTagValueIndexed(TagIds.SeriesInstanceUid);
	}

	/**
	 * Returns the series number.
	 * @returns {number}
	 */
	get seriesNumber(): number {
		return this.getTagValueIndexed(TagIds.SeriesNumber);
	}

	/**
	 * Returns the echo number.
	 * @returns {number}
	 */
	get echoNumber(): number {
		return this.getTagValueIndexed(TagIds.EchoNumber);
	}

	/**
	 * Returns the image position.
	 * @return {number[]}
	 */
	get imagePosition(): number[] {
		return this.getTagValue(TagIds.ImagePosition) as number[];
	}

	/**
	 * Returns the image axis directions
	 * @return {number[]}
	 */
	get imageDirections(): number[] {
		return this.getTagValue(TagIds.ImageOrientation) as number[];
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
	 * Returns the modality
	 * @returns {string}
	 */
	get modality(): string {
		return this.getTagValueIndexed(TagIds.Modality);
	}

	/**
	 * Returns the slice location.
	 * @returns {number}
	 */
	get sliceLocation(): number {
		return this.getTagValueIndexed(TagIds.SliceLocation);
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
		return this.getTagValueIndexed(TagIds.ImageNum);
	}

	/**
	 * Returns the temporal position.
	 * @returns {number}
	 */
	get temporalPosition(): number {
		return this.getTagValueIndexed(TagIds.TemporalPosition);
	}

	/**
	 * Returns the temporal number.
	 * @returns {number}
	 */
	get temporalNumber(): number {
		return this.getTagValueIndexed(TagIds.NumberTemporalPositions);
	}

	/**
	 * Returns the slice gap.
	 * @returns {number}
	 */
	get sliceGap(): number {
		return this.getTagValueIndexed(TagIds.SliceGap);
	}

	/**
	 * Returns the slice thickness.
	 * @returns {number}
	 */
	get sliceThickness(): number {
		return this.getTagValueIndexed(TagIds.SliceThickness);
	}

	/**
	 * Returns the image maximum.
	 * @returns {number}
	 */
	get imageMax(): number {
		return this.getTagValueIndexed(TagIds.ImageMax);
	}

	/**
	 * Returns the image minimum.
	 * @returns {number}
	 */
	get imageMin(): number {
		return this.getTagValueIndexed(TagIds.ImageMin);
	}

	/**
	 * Returns the rescale slope.
	 * @returns {number}
	 */
	get dataScaleSlope(): number {
		return this.getTagValueIndexed(TagIds.DataScaleSlope);
	}

	/**
	 * Returns the rescale intercept.
	 * @returns {number}
	 */
	get dataScaleIntercept(): number {
		return this.getTagValueIndexed(TagIds.DataScaleIntercept);
	}

	get dataScaleElscint() {
		let scale = this.getTagValueIndexed(TagIds.DataScaleElscint) || 1;

		const bandwidth = this.pixelBandwidth;
		scale = Math.sqrt(bandwidth) / (10 * scale);

		if (scale <= 0) {
			scale = 1;
		}
		return scale;
	}

	/**
	 * Returns the window width.
	 * @returns {number}
	 */
	get windowWidth(): number {
		return this.getTagValueIndexed(TagIds.WindowWidth);
	}

	/**
	 * Returns the window center.
	 * @returns {number}
	 */
	get windowCenter(): number {
		return this.getTagValueIndexed(TagIds.WindowCenter);
	}

	get pixelBandwidth() {
		return this.getTagValueIndexed(TagIds.PixelBandwidth);
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
	 * Returns the pixel spacing.
	 * @returns {number[]}
	 */
	get pixelSpacing(): number[] {
		return this.getTagValue(TagIds.PixelSpacing) as number[];
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
		return this.getTagValueIndexed(TagIds.BitsStored);
	}

	/**
	 * Returns the number of bits allocated.
	 * @returns {number}
	 */
	get bitsAllocated(): number {
		return this.getTagValueIndexed(TagIds.BitsAllocated);
	}

	/**
	 * Returns the frame time.
	 * @returns {number}
	 */
	getFrameTime(): number {
		return this.getTagValueIndexed(TagIds.FrameTime);
	}

	/**
	 * Returns the acquisition matrix (e.g., "mosaic" data).
	 * @returns {number[]}
	 */
	getAcquisitionMatrix(): number[] {
		const mat:[number, number] = [0, 0];
		mat[0] = this.getTagValueIndexed(TagIds.AcquisitionMatrix);

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
	 * Returns the TR.
	 * @returns {number}
	 */
	getTR(): number {
		return this.getTagValueIndexed(TagIds.Tr);
	}

	putTag(tag: Tag) {
		this.tags[tag.id] = tag;
		this.putFlattenedTag(this.tagsFlat, tag);
	}

	putFlattenedTag(tags: Record<TagStringID, Tag>, tag:Tag) {
		if (tag.sublist) {
			const value = tag.value! as Tag[];
			for (let ctr = 0; ctr < value.length; ctr += 1) {
				this.putFlattenedTag(tags, value[ctr]);
			}
		}
		else if (!tags[tag.id]) {
			// eslint-disable-next-line no-param-reassign
			tags[tag.id] = tag;
		}
	}

	/**
	 * Returns true if pixel data is found.
	 * @returns {boolean}
	 */
	hasPixelData(): boolean {
		return (this.tags[createTagIdWithTag(TagIds.PixelData)] !== undefined);
	}

	clearPixelData() {
		this.tags[createTagIdWithTag(TagIds.PixelData)].value = null;
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
		const value = this.getTagValueIndexed(TagIds.PhotometricInterpretation);
		return (value && value.toLowerCase().indexOf("palette") !== -1);
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
		const value = this.getTagValueIndexed(TagIds.NumberOfFrames);
		return value ?? 1;
	}

	/**
	 * Returns the number of samples per pixel.
	 * @returns {number}
	 */
	get samplesPerPixel(): number {
		const value = this.getTagValueIndexed(TagIds.SamplesPerPixel);
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
		return this.getTagValueIndexed(TagIds.PixelRepresentation);
	}

	/**
	 * Returns the photometric interpretation.
	 * @returns {string}
	 */
	get photometricInterpretation(): string {
		return this.getTagValueIndexed(TagIds.PhotometricInterpretation);
	}

	/**
	 * Returns the patient name.
	 * @returns {string}
	 */
	get patientName(): string {
		return this.getTagValueIndexed(TagIds.PatientName);
	}

	/**
	 * Returns the patient ID.
	 * @returns {string}
	 */
	get patientID(): string {
		return this.getTagValueIndexed(TagIds.PatientId);
	}

	/**
	 * Returns the study time.
	 * @returns {string}
	 */
	get studyTime(): string {
		return this.getTagValueIndexed(TagIds.StudyTime);
	}

	/**
	 * Returns the transfer syntax.
	 * @returns {string}
	 */
	get transferSyntax(): TransferSyntax {
		return this.getTagValueIndexed(TagIds.TransferSyntax);
	}

	/**
	 * Returns the study date.
	 * @returns {string}
	 */
	get studyDate(): string {
		return this.getTagValueIndexed(TagIds.StudyDate);
	}

	/**
	 * Returns the planar configuration.
	 * @returns {number}
	 */
	get planarConfig(): number {
		return this.getTagValueIndexed(TagIds.PlanarConfig);
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

	/**
	 * Returns a string of interpreted private data.
	 * @returns {string}
	 */
	get allInterpretedPrivateData(): string {
		let str = "";

		const sortedKeys = Object.keys(this.tags).sort();

		for (let ctr = 0; ctr < sortedKeys.length; ctr += 1) {
			const key = sortedKeys[ctr];
			// eslint-disable-next-line no-prototype-builtins
			if (this.tags.hasOwnProperty(key)) {
				const tag = this.tags[key];
				if (tag.hasInterpretedPrivateData()) {
					str += tag.value;
				}
			}
		}

		return str;
	}

	/**
	 * Returns a string representation of this image.
	 * @returns {string}
	 */
	toString(): string {
		let str = "";

		const sortedKeys = Object.keys(this.tags).sort();

		for (let ctr = 0; ctr < sortedKeys.length; ctr += 1) {
			const key = sortedKeys[ctr];
			const tag = this.tags[key];
			if (tag) {
				str += `${tag.toHTMLString()}<br />`;
			}
		}

		str = str.replace(/\n\s*\n/g, "\n"); // replace mutli-newlines with single newline
		str = str.replace(/(?:\r\n|\r|\n)/g, "<br />"); // replace newlines with <br>

		return str;
	}

	getPalleteValues(tagID: TagTupleID) {
		const value = getValueSafely(this.getTag(tagID)) as DataView;

		if (value?.buffer) {
			const numVals = value.buffer.byteLength / 2;
			const valsBig = [];
			const valsLittle = [];

			for (let ctr = 0; ctr < numVals; ctr += 1) {
				// eslint-disable-next-line no-bitwise
				valsBig[ctr] = (value.getUint16(ctr * 2, false) & 0xFFFF);
				// eslint-disable-next-line no-bitwise
				valsLittle[ctr] = (value.getUint16(ctr * 2, true) & 0xFFFF);
			}

			const valsBigMax = Math.max(...valsBig);
			const valsBigMin = Math.min(...valsBig);
			const valsLittleMax = Math.max(...valsLittle);
			const valsLittleMin = Math.min(...valsLittle);
			const valsBigDiff = Math.abs(valsBigMax - valsBigMin);
			const valsLittleDiff = Math.abs(valsLittleMax - valsLittleMin);

			if (valsBigDiff < valsLittleDiff) {
				return scalePalette(valsBig);
			}
			return scalePalette(valsLittle);
		}
		return null;
	}
}

export default DCMImage;
export { ByteType };

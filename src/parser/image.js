/* eslint no-use-before-define: ["error", { "classes": false }] */
import { TagIds, createTagId, createTagIdWithTag } from "./tag";
import { TransferSyntax } from "./constants";

const getSingleValueSafely = (tag, index) => (tag?.value?.[index] ?? null);

const getValueSafely = (tag) => (tag?.value ?? null);

// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
const getMajorAxisFromPatientRelativeDirectionCosine = (x, y, z) => {
	const absX = Math.abs(x);
	const absY = Math.abs(y);
	const absZ = Math.abs(z);

	// The tests here really don't need to check the other dimensions,
	// just the threshold, since the sum of the squares should be == 1.0
	// but just in case ...
	const { obliquityThresholdCosineValue } = Image;
	let axis = null;
	if ((absX > obliquityThresholdCosineValue) && (absX > absY) && (absX > absZ)) {
		const orientationX = (x < 0) ? "R" : "L";
		axis = orientationX;
	}
	else if ((absY > obliquityThresholdCosineValue) && (absY > absX) && (absY > absZ)) {
		const orientationY = (y < 0) ? "A" : "P";
		axis = orientationY;
	}
	else if ((absZ > obliquityThresholdCosineValue) && (absZ > absX) && (absZ > absY)) {
		const orientationZ = (z < 0) ? "F" : "H";
		axis = orientationZ;
	}
	return axis;
};

const scalePalette = (pal) => {
	const max = Math.max(...pal);
	const min = Math.min(...pal);

	if ((max > 255) || (min < 0)) {
		const slope = 255.0 / (max - min);
		const intercept = min;

		for (let ctr = 0; ctr < pal.length; ctr += 1) {
			// eslint-disable-next-line no-param-reassign
			pal[ctr] = parseInt(Math.round((pal[ctr] - intercept) * slope), 10);
		}
	}

	return pal;
};

class DCMImage {
	// enums
	static sliceDirection = {
		unknown: -1,
		axial: 2,
		coronal: 1,
		sagittal: 0,
		oblique: 3
	};

	static byteType = {
		unkown: 0,
		binary: 1,
		integer: 2,
		integerUnsigned: 3,
		float: 4,
		complex: 5,
		rgb: 6
	};

	static Parser;

	static obliquityThresholdCosineValue = 0.8;

	static skipPaletteConversion = false;

	constructor() {
		this.tags = {};
		this.tagsFlat = {};
		this.littleEndian = false;
		this.index = -1;
		this.decompressed = false;
		this.privateDataAll = null;
		this.convertedPalette = false;
	}

	/**
 	* Returns a tag matching the specified group and element.
	* @param { Array } tupple of
 	* 	@param {number} group
 	* 	@param {number} element
 	* @returns {daikon.Tag}
 	*/
	getTag(tag) {
		const [group = null, element = null] = tag;
		const tagId = createTagId(group, element);
		return this.tags[tagId] ?? this.tagsFlat[tagId];
	}

	/**
	 * get the value of the tag if exists
	 * @param {Array} tag tupple of group and element ids
	 * @returns the value of the tag or null if not exist
	 */
	getTagValue(tag) {
		return getValueSafely(this.getTag(tag));
	}

	/**
	 * get the value of the tag if exists
	 * @param {Array} tag tupple of group and element ids
	 * @param {Number} index the position in the value
	 * @returns the value at index or null if not exist
	 */
	getTagValueIndexed(tag, index = 0) {
		return getSingleValueSafely(this.getTag(tag), index);
	}

	/**
	 * Returns the pixel data tag.
	 * @returns {daikon.Tag}
	 */
	getPixelData() {
		return this.tags[createTagIdWithTag(TagIds.PixelData)];
	}

	getPixelDataBytes() {
		if (this.isCompressed()) {
			this.decompress();
		}

		if (this.isPalette() && !DCMImage.skipPaletteConversion) {
			console.log("converting palette!");
			this.convertPalette();
		}
		const tagId = createTagIdWithTag(TagIds.PixelData);
		const tag = this.tags[tagId];

		return tag?.value?.buffer;
	}

	/**
	 * Returns the raw pixel data.
	 * @returns {ArrayBuffer}
	 */
	getRawData() {
		return this.getPixelDataBytes();
	}

	/**
	 * Returns the number of columns.
	 * @returns {number}
	 */
	getCols() {
		return this.getTagValueIndexed(TagIds.Cols);
	}

	/**
	 * Returns the number of rows.
	 * @returns {number}
	 */
	getRows() {
		return this.getTagValueIndexed(TagIds.Rows);
	}

	/**
	 * Returns the series description.
	 * @returns {string}
	 */
	getSeriesDescription() {
		return this.getTagValueIndexed(TagIds.SeriesDescription);
	}

	/**
	 * Returns the series instance UID.
	 * @returns {string}
	 */
	getSeriesInstanceUID() {
		return this.getTagValueIndexed(TagIds.SeriesInstanceUid);
	}

	/**
	 * Returns the series number.
	 * @returns {number}
	 */
	getSeriesNumber() {
		return this.getTagValueIndexed(TagIds.SeriesNumber);
	}

	/**
	 * Returns the echo number.
	 * @returns {number}
	 */
	getEchoNumber() {
		return this.getTagValueIndexed(TagIds.EchoNumber);
	}

	/**
	 * Returns the image position.
	 * @return {number[]}
	 */
	getImagePosition() {
		return this.getTagValue(TagIds.ImagePosition);
	}

	/**
	 * Returns the image axis directions
	 * @return {number[]}
	 */
	getImageDirections() {
		return this.getTagValue(TagIds.ImageOrientation);
	}

	/**
	 * Returns the image position value by index.
	 * @param {number} sliceDir - the index
	 * @returns {number}
	 */
	getImagePositionSliceDir(sliceDir) {
		const imagePos = this.getTagValue(TagIds.ImagePosition);
		if (imagePos && sliceDir >= 0) {
			return imagePos[sliceDir];
		}
		return 0;
	}

	/**
	 * Returns the modality
	 * @returns {string}
	 */
	getModality() {
		return this.getTagValueIndexed(TagIds.Modality);
	}

	/**
	 * Returns the slice location.
	 * @returns {number}
	 */
	getSliceLocation() {
		return this.getTagValueIndexed(TagIds.SliceLocation);
	}

	/**
	 * Returns the slice location vector.
	 * @returns {number[]}
	 */
	getSliceLocationVector() {
		return this.getTagValue(TagIds.SliceLocationVector);
	}

	/**
	 * Returns the image number.
	 * @returns {number}
	 */
	getImageNumber() {
		return this.getTagValueIndexed(TagIds.ImageNum);
	}

	/**
	 * Returns the temporal position.
	 * @returns {number}
	 */
	getTemporalPosition() {
		return this.getTagValueIndexed(TagIds.TemporalPosition);
	}

	/**
	 * Returns the temporal number.
	 * @returns {number}
	 */
	getTemporalNumber() {
		return this.getTagValueIndexed(TagIds.NumberTemporalPositions);
	}

	/**
	 * Returns the slice gap.
	 * @returns {number}
	 */
	getSliceGap() {
		return this.getTagValueIndexed(TagIds.SliceGap);
	}

	/**
	 * Returns the slice thickness.
	 * @returns {number}
	 */
	getSliceThickness() {
		return this.getTagValueIndexed(TagIds.SliceThickness);
	}

	/**
	 * Returns the image maximum.
	 * @returns {number}
	 */
	getImageMax() {
		return this.getTagValueIndexed(TagIds.ImageMax);
	}

	/**
	 * Returns the image minimum.
	 * @returns {number}
	 */
	getImageMin() {
		return this.getTagValueIndexed(TagIds.ImageMin);
	}

	/**
	 * Returns the rescale slope.
	 * @returns {number}
	 */
	getDataScaleSlope() {
		return this.getTagValueIndexed(TagIds.DataScaleSlope);
	}

	/**
	 * Returns the rescale intercept.
	 * @returns {number}
	 */
	getDataScaleIntercept() {
		return this.getTagValueIndexed(TagIds.DataScaleIntercept);
	}

	getDataScaleElscint() {
		let scale = this.getTagValueIndexed(TagIds.DataScaleElscint) || 1;

		const bandwidth = this.getPixelBandwidth();
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
	getWindowWidth() {
		return this.getTagValueIndexed(TagIds.WindowWidth);
	}

	/**
	 * Returns the window center.
	 * @returns {number}
	 */
	getWindowCenter() {
		return this.getTagValueIndexed(TagIds.WindowCenter);
	}

	getPixelBandwidth() {
		return this.getTagValueIndexed(TagIds.PixelBandwidth);
	}

	getSeriesId() {
		const ids = [
			this.getSeriesDescription(),
			this.getSeriesInstanceUID(),
			this.getSeriesNumber(),
			this.getEchoNumber(),
			this.getOrientation(),
		].filter((id) => id != null); // remove nulls

		const { columns, rows } = this;
		return `${ids.join(",")} (${columns} x ${rows})`;
	}

	/**
	 * Returns the pixel spacing.
	 * @returns {number[]}
	 */
	getPixelSpacing() {
		return this.getTagValue(TagIds.PixelSpacing);
	}

	/**
	 * Returns the image type.
	 * @returns {string[]}
	 */
	getImageType() {
		return this.getTagValue(TagIds.ImageType);
	}

	/**
	 * Returns the number of bits stored.
	 * @returns {number}
	 */
	getBitsStored() {
		return this.getTagValueIndexed(TagIds.BitsStored);
	}

	/**
	 * Returns the number of bits allocated.
	 * @returns {number}
	 */
	getBitsAllocated() {
		return this.getTagValueIndexed(TagIds.BitsAllocated);
	}

	/**
	 * Returns the frame time.
	 * @returns {number}
	 */
	getFrameTime() {
		return this.getTagValueIndexed(TagIds.FrameTime);
	}

	/**
	 * Returns the acquisition matrix (e.g., "mosaic" data).
	 * @returns {number[]}
	 */
	getAcquisitionMatrix() {
		const mat = [0, 0];
		mat[0] = this.getTagValueIndexed(TagIds.AcquisitionMatrix);

		if (this.privateDataAll === null) {
			this.privateDataAll = this.getAllInterpretedPrivateData();
		}

		if (this.privateDataAll?.length > 0) {
			const start = this.privateDataAll.indexOf("AcquisitionMatrixText");
			if (start !== -1) {
				const end = this.privateDataAll.indexOf("\n", start);

				if (end !== -1) {
					const str = this.privateDataAll.substring(start, end);
					const matPrivate = str.match(/\d+/g);

					if (matPrivate?.length === 2) {
						[mat[0], mat[1]] = matPrivate;
					}
					else if (matPrivate?.length === 1) {
						[mat[0]] = matPrivate;
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
	getTR() {
		return this.getTagValueIndexed(TagIds.Tr);
	}

	putTag(tag) {
		this.tags[tag.id] = tag;
		this.putFlattenedTag(this.tagsFlat, tag);
	}

	putFlattenedTag(tags, tag) {
		if (tag.sublist) {
			for (let ctr = 0; ctr < tag.value.length; ctr += 1) {
				this.putFlattenedTag(tags, tag.value[ctr]);
			}
		}
		else if (!tags[tag.id]) {
			// eslint-disable-next-line no-param-reassign
			tags[tag.id] = tag;
		}
	}

	// TODO: remove this - upload palette to GPU!
	convertPalette() {
		const data = this.getPixelData();

		const reds = this.getPalleteValues(TagIds.PaletteRed);
		const greens = this.getPalleteValues(TagIds.PaletteGreen);
		const blues = this.getPalleteValues(TagIds.PaletteBlue);

		if ((reds?.length > 0)
			&& (greens?.length > 0)
			&& (blues?.length > 0)
			&& !this.convertedPalette) {
			const nFrames = this.getNumberOfFrames();
			const rgb = new DataView(new ArrayBuffer(this.getRows() * this.getCols() * nFrames * 3));
			const numBytes = this.bytesAllocated;
			const numElements = data.byteLength / numBytes;

			if (numBytes === 1) {
				for (let ctr = 0; ctr < numElements; ctr += 1) {
					const index = data.getUint8(ctr);
					const rVal = reds[index];
					const gVal = greens[index];
					const bVal = blues[index];
					rgb.setUint8((ctr * 3), rVal);
					rgb.setUint8((ctr * 3) + 1, gVal);
					rgb.setUint8((ctr * 3) + 2, bVal);
				}
			}
			else if (numBytes === 2) {
				for (let ctr = 0; ctr < numElements; ctr += 1) {
					const index = data.getUint16(ctr * 2);
					const rVal = reds[index];
					const gVal = greens[index];
					const bVal = blues[index];
					rgb.setUint8((ctr * 3), rVal);
					rgb.setUint8((ctr * 3) + 1, gVal);
					rgb.setUint8((ctr * 3) + 2, bVal);
				}
			}
			this.tags[createTagIdWithTag(TagIds.PixelData)].value = rgb;
			this.convertedPalette = true;
		}
	}

	/**
	 * Returns true if pixel data is found.
	 * @returns {boolean}
	 */
	hasPixelData() {
		return (this.tags[createTagIdWithTag(TagIds.PixelData)] !== undefined);
	}

	clearPixelData() {
		this.tags[createTagIdWithTag(TagIds.PixelData)].value = null;
	}

	/**
	 * Returns an orientation string (e.g., XYZ+--).
	 * @returns {string}
	 */
	getOrientation() {
		let orientation = null;
		const dirCos = this.getTagValue(TagIds.ImageOrientation);
		let bigRow = 0;
		let bigCol = 0;

		if (dirCos?.length !== 6) {
			return null;
		}

		const spacing = this.getPixelSpacing();

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
	isMosaic() {
		const imageType = this.getImageType();
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
	isPalette() {
		const value = this.getTagValueIndexed(TagIds.PhotometricInterpretation);
		return (value && value.toLowerCase().indexOf("palette") !== -1);
	}

	getMosaicCols() {
		return this.columns / this.getAcquisitionMatrix()[1];
	}

	getMosaicRows() {
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
	isCompressed() {
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
	isCompressedJPEG() {
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
	isCompressedJPEGLossless() {
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
	isCompressedJPEGBaseline() {
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
	isCompressedJPEG2000() {
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
	isCompressedJPEGLS() {
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
	isCompressedRLE() {
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
	getNumberOfFrames() {
		const value = this.getTagValueIndexed(TagIds.NumberOfFrames);
		return value ?? 1;
	}

	/**
	 * Returns the number of samples per pixel.
	 * @returns {number}
	 */
	getNumberOfSamplesPerPixel() {
		const value = this.getTagValueIndexed(TagIds.SamplesPerPixel);
		return value ?? 1;
	}

	getNumberOfImplicitFrames() {
		if (this.isCompressed()) {
			return 1;
		}

		const pixelData = this.getPixelData();
		const length = pixelData.offsetEnd - pixelData.offsetValue;
		const size = this.columns * this.rows * this.bytesAllocated;

		return parseInt(length / size, 10);
	}

	/**
	 * Returns the pixel representation.
	 * @returns {number}
	 */
	getPixelRepresentation() {
		return this.getTagValueIndexed(TagIds.PixelRepresentation);
	}

	/**
	 * Returns the photometric interpretation.
	 * @returns {string}
	 */
	getPhotometricInterpretation() {
		return this.getTagValueIndexed(TagIds.PhotometricInterpretation);
	}

	/**
	 * Returns the patient name.
	 * @returns {string}
	 */
	getPatientName() {
		return this.getTagValueIndexed(TagIds.PatientName);
	}

	/**
	 * Returns the patient ID.
	 * @returns {string}
	 */
	getPatientID() {
		return this.getTagValueIndexed(TagIds.PatientId);
	}

	/**
	 * Returns the study time.
	 * @returns {string}
	 */
	getStudyTime() {
		return this.getTagValueIndexed(TagIds.StudyTime);
	}

	/**
	 * Returns the transfer syntax.
	 * @returns {string}
	 */
	getTransferSyntax() {
		return this.getTagValueIndexed(TagIds.TransferSyntax);
	}

	/**
	 * Returns the study date.
	 * @returns {string}
	 */
	getStudyDate() {
		return this.getTagValueIndexed(TagIds.StudyDate);
	}

	/**
	 * Returns the planar configuration.
	 * @returns {number}
	 */
	getPlanarConfig() {
		return this.getTagValueIndexed(TagIds.PlanarConfig);
	}

	/**
	 * Returns all descriptive info for this image.
	 * @returns {string}
	 */
	getImageDescription() {
		const values = [
			this.getTagValueIndexed(TagIds.StudyDes),
			this.getTagValueIndexed(TagIds.SeriesDescription),
			this.getTagValueIndexed(TagIds.ImageComments)
		].filter((el) => el !== null);

		return values.join(" ").trim();
	}

	/**
	 * Returns the datatype (e.g., DCMImage.byteType.integerUnsigned).
	 * @returns {number}
	 */
	getDataType() {
		const dataType = this.pixelRepresentation;

		if (dataType === null) {
			return DCMImage.byteType.unkown;
		}

		const interp = this.photometricInterpretation?.trim() || null;
		if (interp
			&& ((interp.indexOf("RGB") !== -1)
				|| (interp.indexOf("YBR") !== -1)
				|| (interp.toLowerCase().indexOf("palette") !== -1)
			)) {
			return DCMImage.byteType.rgb;
		}

		if (dataType === 0) {
			return DCMImage.byteType.integerUnsigned;
		}
		if (dataType === 1) {
			return DCMImage.byteType.integer;
		}
		return DCMImage.byteType.unkown;
	}

	// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
	getAcquiredSliceDirection() {
		const dirCos = this.getTagValue(TagIds.ImageOrientation);

		if (dirCos?.length !== 6) {
			return DCMImage.sliceDirection.unknown;
		}

		const rowAxis = getMajorAxisFromPatientRelativeDirectionCosine(dirCos[0], dirCos[1], dirCos[2]);
		const colAxis = getMajorAxisFromPatientRelativeDirectionCosine(dirCos[3], dirCos[4], dirCos[5]);
		if ((rowAxis !== null) && (colAxis !== null)) {
			if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "A") || (colAxis === "P"))) {
				return DCMImage.sliceDirection.axial;
			}
			if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "A") || (rowAxis === "P"))) {
				return DCMImage.sliceDirection.axial;
			}
			if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "H") || (colAxis === "F"))) {
				return DCMImage.sliceDirection.coronal;
			}
			if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "H") || (rowAxis === "F"))) {
				return DCMImage.sliceDirection.coronal;
			}
			if (((rowAxis === "A") || (rowAxis === "P")) && ((colAxis === "H") || (colAxis === "F"))) {
				return DCMImage.sliceDirection.sagittal;
			}
			if (((colAxis === "A") || (colAxis === "P")) && ((rowAxis === "H") || (rowAxis === "F"))) {
				return DCMImage.sliceDirection.sagittal;
			}
		}
		return DCMImage.sliceDirection.oblique;
	}

	/**
	 * Returns a string of interpreted private data.
	 * @returns {string}
	 */
	getAllInterpretedPrivateData() {
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
	toString() {
		let str = "";

		const sortedKeys = Object.keys(this.tags).sort();

		for (let ctr = 0; ctr < sortedKeys.length; ctr += 1) {
			const key = sortedKeys[ctr];
			// eslint-disable-next-line no-prototype-builtins
			if (this.tags.hasOwnProperty(key)) {
				const tag = this.tags[key];
				str += `${tag.toHTMLString()}<br />`;
			}
		}

		str = str.replace(/\n\s*\n/g, "\n"); // replace mutli-newlines with single newline
		str = str.replace(/(?:\r\n|\r|\n)/g, "<br />"); // replace newlines with <br>

		return str;
	}

	getPalleteValues(tagID) {
		const value = getValueSafely(this.getTag(tagID));

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

	parseComplete(littleEndian) {
		this.littleEndian = littleEndian;
		this.transferSyntax = this.getTransferSyntax();
		this.pixelRepresentation = this.getPixelRepresentation();
		this.bitsAllocated = this.getBitsAllocated();
		this.bytesAllocated = parseInt(Math.ceil(this.bitsAllocated / 8), 10);
		this.bitsStored = this.getBitsStored();
		this.rows = this.getRows();
		this.columns = this.getCols();
		this.samplesPerPixel = this.getNumberOfSamplesPerPixel();
		// this needs to happen before this.getDataType
		this.photometricInterpretation = this.getPhotometricInterpretation();

		// should we invert any output
		let invert = this.getTagValueIndexed(TagIds.LutShape) === "inverse";
		invert = invert || this.photometricInterpretation === "MONOCHROME1";
		this.invert = invert;

		this.isRGB = !(this.photometricInterpretation || "").startsWith("MONO");

		this.dataType = this.getDataType();

		this.slope = this.getDataScaleSlope() || 1.0;
		this.intercept = this.getDataScaleIntercept() || 0.0;

		const lutDescriptor = this.getTagValue(TagIds.VoiLutDescriptor);
		if (lutDescriptor?.length === 3) {
			const [nEntries, firstValue, bitsStored] = lutDescriptor;
			if (!nEntries < 2 ** bitsStored - 1) {
				let ArrayType = Uint8Array;
				if (bitsStored > 8) {
					ArrayType = Uint16Array;
				}
				const lutDataTagValue = this.getTagValue(TagIds.VoiLutData);
				if (lutDataTagValue) {
					const data = new ArrayType(
						lutDataTagValue,
						0,
						Math.min(lutDescriptor[0] || 2 ** 16, lutDataTagValue.length)
					);

					this.lut = {
						nEntries,
						firstValue,
						bitsStored,
						data
					};
				}
			}
		}
		if (!this.lutData) {
			this.minPixVal = this.getImageMin();
			this.maxPixVal = this.getImageMax();

			this.windowCenter = this.getWindowCenter();
			this.windowWidth = this.getWindowWidth();
		}
	}
}

export default DCMImage;

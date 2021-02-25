import Image from "./image";
import { bind } from "./utilities";
import Parser from "./parser";
import OrderedMap from "./orderedmap";

const getMosaicOffset = (
	mosaicCols,
	mosaicColWidth,
	mosaicRowHeight,
	mosaicWidth,
	xLocVal,
	yLocVal,
	zLocVal
) => {
	let xLoc = xLocVal;
	let yLoc = yLocVal;
	const zLoc = zLocVal;

	xLoc = ((zLoc % mosaicCols) * mosaicColWidth) + xLoc;
	yLoc = (((parseInt(zLoc / mosaicCols, 10)) * mosaicRowHeight) + yLoc) * mosaicWidth;

	return (xLoc + yLoc);
};

const orderByImagePosition = (images, sliceDir) => {
	const dicomMap = new OrderedMap();
	for (let ctr = 0; ctr < images.length; ctr += 1) {
		dicomMap.put(images[ctr].getImagePositionSliceDir(sliceDir), images[ctr]);
	}
	return dicomMap.getOrderedValues();
};

const orderBySliceLocation = (images) => {
	const dicomMap = new OrderedMap();
	for (let ctr = 0; ctr < images.length; ctr += 1) {
		dicomMap.put(images[ctr].getSliceLocation(), images[ctr]);
	}
	return dicomMap.getOrderedValues();
};

const orderByImageNumber = (images) => {
	const dicomMap = new OrderedMap();
	for (let ctr = 0; ctr < images.length; ctr += 1) {
		dicomMap.put(images[ctr].getImageNumber(), images[ctr]);
	}
	return dicomMap.getOrderedValues();
};

const hasMatchingSlice = (dg, image, sliceDir, doImagePos, doSliceLoc) => {
	let matchingNum = 0;

	if (doImagePos) {
		matchingNum = image.getImagePositionSliceDir(sliceDir);
	}
	else if (doSliceLoc) {
		matchingNum = image.getSliceLocation();
	}
	else {
		matchingNum = image.getImageNumber();
	}

	for (let ctr = 0; ctr < dg.length; ctr += 1) {
		const current = dg[ctr];

		if (doImagePos) {
			const imagePos = current.getImagePositionSliceDir(sliceDir);
			if (imagePos === matchingNum) {
				return true;
			}
		}
		else if (doSliceLoc) {
			const sliceLoc = current.getSliceLocation();
			if (sliceLoc === matchingNum) {
				return true;
			}
		}
		else {
			const imageNum = current.getImageNumber();
			if (imageNum === matchingNum) {
				return true;
			}
		}
	}

	return false;
};
const orderByTime = (images, numFrames, sliceDir, hasImagePosition, hasSliceLocation) => {
	const dicomMap = new OrderedMap();
	const hasTemporalPosition = (numFrames > 1) && (images[0].getTemporalPosition() !== null);
	const hasTemporalNumber = (numFrames > 1)
	&& (images[0].getTemporalNumber() !== null)
	&& (images[0].getTemporalNumber() === numFrames);

	if (hasTemporalPosition && hasTemporalNumber) { // explicit series
		for (let ctr = 0; ctr < images.length; ctr += 1) {
			const image = images[ctr];

			const tempPos = image.getTemporalPosition();
			let dg = dicomMap.get(tempPos);
			if (!dg) {
				dg = [];
				dicomMap.put(tempPos, dg);
			}

			dg.push(image);
		}
	}
	else { // implicit series
		// order data by slice then time
		const timeBySliceMap = new OrderedMap();
		for (let ctr = 0; ctr < images.length; ctr += 1) {
			if (images[ctr] !== null) {
				let sliceMarker = ctr;
				if (hasImagePosition) {
					sliceMarker = images[ctr].getImagePositionSliceDir(sliceDir);
				}
				else if (hasSliceLocation) {
					sliceMarker = images[ctr].getSliceLocation();
				}

				let slice = timeBySliceMap.get(sliceMarker);
				if (slice === null) {
					slice = new OrderedMap();
					timeBySliceMap.put(sliceMarker, slice);
				}

				slice.put(ctr, images[ctr]);
			}
		}

		// copy into DICOM array (ordered by slice by time)
		const dicomsCopy = [];
		let dicomsCopyIndex = 0;
		const sliceIt = timeBySliceMap.iterator();
		while (sliceIt.hasNext()) {
			const slice = sliceIt.next();
			const timeIt = slice.iterator();
			while (timeIt.hasNext()) {
				dicomsCopy[dicomsCopyIndex] = timeIt.next();
				dicomsCopyIndex += 1;
			}
		}

		// groups dicoms by timepoint
		for (let ctr = 0; ctr < dicomsCopy.length; ctr += 1) {
			if (dicomsCopy[ctr] !== null) {
				let dgFound = null;
				const it = dicomMap.iterator();
				while (it.hasNext()) {
					const dg = it.next();
					if (!hasMatchingSlice(
						dg,
						dicomsCopy[ctr],
						sliceDir,
						hasImagePosition,
						hasSliceLocation
					)) {
						dgFound = dg;
						break;
					}
				}

				if (dgFound === null) {
					dgFound = [];
					dicomMap.put(dicomMap.orderedKeys.length, dgFound);
				}

				dgFound.push(dicomsCopy[ctr]);
			}
		}
	}

	return dicomMap;
};

const orderDicoms = (images, numFrames, sliceDir) => {
	const hasImagePosition = (images[0].getImagePosition() !== null);
	const hasSliceLocation = (images[0].getSliceLocation() !== null);
	const hasImageNumber = (images[0].getImageNumber() !== null);

	const timeMap = orderByTime(
		images,
		numFrames,
		sliceDir,
		hasImagePosition,
		hasSliceLocation
	);
	const timeIt = timeMap.orderedKeys;

	const imagesOrderedByTimeAndSpace = [];

	for (let ctr = 0; ctr < timeIt.length; ctr += 1) {
		const dg = timeMap.get(timeIt[ctr]);
		let ordered;
		if (hasImagePosition) {
			ordered = orderByImagePosition(dg, sliceDir);
		}
		else if (hasSliceLocation) {
			ordered = orderBySliceLocation(dg);
		}
		else if (hasImageNumber) {
			ordered = orderByImageNumber(dg);
		}
		else {
			ordered = dg;
		}

		for (let ctrIn = 0; ctrIn < ordered.length; ctrIn += 1) {
			imagesOrderedByTimeAndSpace.push(ordered[ctrIn]);
		}
	}

	for (let ctrIn = 0; ctrIn < imagesOrderedByTimeAndSpace.length; ctrIn += 1) {
		imagesOrderedByTimeAndSpace[ctrIn].index = ctrIn;
	}

	return imagesOrderedByTimeAndSpace;
};

const validatePixelDataLength = (image) => {
	const length = image.getPixelDataBytes().byteLength;
	const sliceLength = image.columns * image.rows;
	// pixel data length should be divisible by slice size,
	// if not, try to figure out correct pixel data length
	if ((length % sliceLength) === 0) {
		return length;
	}
	return sliceLength
		* image.getNumberOfFrames()
		* image.samplesPerPixel
		* image.bytesAllocated;
};

/**
 * The Series constructor.
 * @property {daikon.Image[]} images
 * @type {Function}
 */
class Series {
	static parserError = null;

	/**
	 * True to keep original order of images, ignoring metadata-based ordering.
	 * @type {boolean}
	 */
	static useExplicitOrdering = false;

	/**
	 * A hint to software to use this explicit distance (mm) between
	 * slices (see Series.useExplicitOrdering)
	 * @type {number}
	 */
	static useExplicitSpacing = 0;

	constructor() {
		this.images = [];
		this.imagesOriginalOrder = null;
		this.isMosaic = false;
		this.isElscint = false;
		this.isCompressed = false;
		this.numberOfFrames = 0;
		this.numberOfFramesInFile = 0;
		this.isMultiFrame = false;
		this.isMultiFrameVolume = false;
		this.isMultiFrameTimeseries = false;
		this.isImplicitTimeseries = false;
		this.sliceSense = false;
		this.sliceDir = Image.sliceDirection.unknown;
		this.error = null;
	}

	getOrder() {
		const order = [];
		for (let ctr = 0; ctr < this.imagesOriginalOrder.length; ctr += 1) {
			order[ctr] = this.imagesOriginalOrder[ctr].index;
		}
		return order;
	}

	/**
	 * Returns the series ID.
	 * @returns {string}
	 */
	toString() {
		return this.images[0].getSeriesId();
	}

	/**
	 * Returns a nice name for the series.
	 * @returns {string|null}
	 */
	getName() {
		const des = this.images[0].getSeriesDescription();
		const uid = this.images[0].getSeriesInstanceUID();
		if (des !== null) {
			return des;
		}
		if (uid !== null) {
			return uid;
		}
		return null;
	}

	/**
	 * Adds an image to the series.
	 * @param {daikon.Image} image
	 */
	addImage(image) {
		this.images.push(image);
	}

	/**
	 * Returns true if the specified image is part of the series
	 * (or if no images are yet part of the series).
	 * @param {daikon.Image} image
	 * @returns {boolean}
	 */
	matchesSeries(image) {
		if (this.images.length === 0) {
			return true;
		}
		return (this.images[0].getSeriesId() === image.getSeriesId());
	}

	/**
	 * Orders and organizes the images in this series.
	 */
	buildSeries() {
		this.isMosaic = this.images[0].isMosaic();
		this.isElscint = this.images[0].isElscint();
		this.isCompressed = this.images[0].isCompressed();
		// check for multi-frame
		this.numberOfFrames = this.images[0].getNumberOfFrames();
		this.numberOfFramesInFile = this.images[0].getNumberOfImplicitFrames();
		this.isMultiFrame = (this.numberOfFrames > 1) || (this.isMosaic && (this.images[0].length > 1));
		this.isMultiFrameVolume = false;
		this.isMultiFrameTimeseries = false;
		this.isImplicitTimeseries = false;
		if (this.isMultiFrame) {
			const hasFrameTime = (this.images[0].getFrameTime() > 0);
			if (this.isMosaic) {
				this.isMultiFrameTimeseries = true;
			}
			else if (hasFrameTime) {
				this.isMultiFrameTimeseries = true;
			}
			else if (this.numberOfFramesInFile > 1) {
				this.isMultiFrameTimeseries = true;
				this.numberOfFrames = this.images.length;
			}
			else {
				this.isMultiFrameVolume = true;
			}
		}

		if (!this.isMosaic && (this.numberOfFrames <= 1)) { // check for implicit frame count
			let imagePos = (this.images[0].getImagePosition() || []);
			const sliceLoc = imagePos.toString();
			this.numberOfFrames = 0;
			for (let ctr = 0; ctr < this.images.length; ctr += 1) {
				imagePos = (this.images[ctr].getImagePosition() || []);
				if (imagePos.toString() === sliceLoc) {
					this.numberOfFrames += 1;
				}
			}
			if (this.numberOfFrames > 1) {
				this.isImplicitTimeseries = true;
			}
		}
		this.sliceDir = this.images[0].getAcquiredSliceDirection();
		let orderedImages;
		if (Series.useExplicitOrdering) {
			orderedImages = this.images.slice();
		}
		else {
			orderedImages = orderDicoms(this.images, this.numberOfFrames, this.sliceDir);
		}
		const sliceLocationFirst = orderedImages[0].getImagePositionSliceDir(this.sliceDir);
		const sliceLocationLast = orderedImages[orderedImages.length - 1]
			.getImagePositionSliceDir(this.sliceDir);
		const sliceLocDiff = sliceLocationLast - sliceLocationFirst;

		if (Series.useExplicitOrdering) {
			this.sliceSense = false;
		}
		else if (this.isMosaic) {
			this.sliceSense = true;
		}
		else if (this.isMultiFrame) {
			const sliceLocations = orderedImages[0].getSliceLocationVector();
			if (sliceLocations !== null) {
				const orientation = orderedImages[0].getOrientation();
				if (orientation.charAt(2) === "Z") {
					this.sliceSense = (sliceLocations[0] - sliceLocations[sliceLocations.length - 1]) < 0;
				}
				else {
					this.sliceSense = (sliceLocations[0] - sliceLocations[sliceLocations.length - 1]) > 0;
				}
			}
			else {
				this.sliceSense = sliceLocationFirst >= 0;
			}
		}
		/*
		* "The direction of the axes is defined fully by the patient's orientation.
		* The x-axis is increasing to the left hand side of the patient. The
		* y-axis is increasing to the posterior side of the patient.
		* The z-axis is increasing toward the head of the patient."
		*/
		else if ((this.sliceDir === Image.sliceDirection.sagittal)
			|| (this.sliceDir === Image.sliceDirection.coronal)) {
			if (sliceLocDiff > 0) {
				this.sliceSense = false;
			}
			else {
				this.sliceSense = true;
			}
		}
		else if (sliceLocDiff > 0) {
			this.sliceSense = true;
		}
		else {
			this.sliceSense = false;
		}
		this.imagesOriginalOrder = this.images;
		this.images = orderedImages;
	}

	/**
	 * Concatenates image data (asynchronously).
	 * @param {object} progressMeter -- the object must have a drawProgress(percent, label)
	 * 									function [e.g., drawProgress(.5, "Loading...")]
	 * @param {Function} onFinishedImageRead -- callback
	 */
	concatenateImageData(progressMeter, onFinishedImageRead) {
		let data;
		if (this.isMosaic) {
			data = this.getMosaicData(this.images[0], this.images[0].getPixelDataBytes());
		}
		else {
			data = this.images[0].getPixelDataBytes();
		}
		const length = validatePixelDataLength(this.images[0]);
		this.images[0].clearPixelData();
		const buffer = new Uint8Array(new ArrayBuffer(length * this.images.length));
		buffer.set(new Uint8Array(data, 0, length), 0);
		setTimeout(bind(this, () => (
			this.concatenateNextImageData(buffer, length, progressMeter, 1, onFinishedImageRead)
		)), 0);
	}

	concatenateNextImageData(buffer, frameSize, progressMeter, index, onFinishedImageRead) {
		if (index >= this.images.length) {
			progressMeter?.drawProgress(1, "Reading DICOM Images");
			onFinishedImageRead(buffer.buffer);
		}
		else {
			let data;
			progressMeter?.drawProgress(index / this.images.length, "Reading DICOM Images");
			if (this.isMosaic) {
				data = this.getMosaicData(this.images[index], this.images[index].getPixelDataBytes());
			}
			else {
				data = this.images[index].getPixelDataBytes();
			}
			const length = this.validatePixelDataLength(this.images[index]);
			this.images[index].clearPixelData();
			buffer.set(new Uint8Array(data, 0, length), (frameSize * index));
			setTimeout(bind(this, () => (
				this.concatenateNextImageData(
					buffer,
					frameSize,
					progressMeter,
					index + 1,
					onFinishedImageRead
				))), 0);
		}
	}

	getMosaicData(image, data) {
		const [image0] = this.images;

		const mosaicWidth = image0.columns;
		const mosaicHeight = image0.rows;
		const mosaicRows = image0.getMosaicRows();
		const mosaicCols = image0.getMosaicCols();

		const numBytes = image0.bytesAllocated;
		const numSlices = mosaicWidth * mosaicHeight;
		const numRows = parseInt(mosaicHeight / mosaicRows, 10);
		const numCols = parseInt(mosaicWidth / mosaicCols, 10);

		const mosaicRowHeight = parseInt(mosaicHeight / mosaicRows, 10);
		const mosaicColWidth = parseInt(mosaicWidth / mosaicCols, 10);

		const buffer = new Uint8Array(new ArrayBuffer(numSlices * numRows * numCols * numBytes));
		const dataTyped = new Uint8Array(data);
		let index = 0;
		for (let ctrS = 0; ctrS < numSlices; ctrS += 1) {
			for (let ctrR = 0; ctrR < numRows; ctrR += 1) {
				for (let ctrC = 0; ctrC < numCols; ctrC += 1) {
					const offset = getMosaicOffset(
						mosaicCols,
						mosaicColWidth,
						mosaicRowHeight,
						mosaicWidth,
						ctrC,
						ctrR,
						ctrS
					);
					for (let ctr = 0; ctr < numBytes; ctr += 1) {
						buffer[index] = dataTyped[(offset * numBytes) + ctr];
						index += 1;
					}
				}
			}
		}
		return buffer.buffer;
	}
}

/**
 * Parses the DICOM header and return an image object.
 * @param {DataView} data
 * @returns {daikon.Image|null}
 */
export const parseImage = (data) => {
	const parser = new Parser();
	const image = parser.parse(data);

	if (parser.hasError()) {
		Series.parserError = parser.error;
		return null;
	}

	if (parser.inflated) {
		image.inflated = parser.inflated;
	}

	return image;
};

export default Series;

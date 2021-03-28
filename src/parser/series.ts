import Parser from "./parser";
import OrderedMap from "./orderedmap";
import DCMImage from "./image";
import { SliceDirection } from "./constants";

type Images = DCMImage[];

const getMosaicOffset = (
	mosaicCols: number,
	mosaicColWidth: number,
	mosaicRowHeight: number,
	mosaicWidth: number,
	xLocVal: number,
	yLocVal:number,
	zLocVal:number
):number => {
	let xLoc = xLocVal;
	let yLoc = yLocVal;
	const zLoc = zLocVal;

	xLoc = ((zLoc % mosaicCols) * mosaicColWidth) + xLoc;
	yLoc = (((Math.floor(zLoc / mosaicCols)) * mosaicRowHeight) + yLoc) * mosaicWidth;

	return (xLoc + yLoc);
};

const orderByImagePosition = (images: Images, sliceDir: number): Images => {
	const dicomMap = new OrderedMap<number, any>();
	for (let ctr = 0; ctr < images.length; ctr += 1) {
		dicomMap.put(images[ctr].getImagePositionSliceDir(sliceDir), images[ctr]);
	}
	return dicomMap.getOrderedValues();
};

const orderBySliceLocation = (images: Images): Images => {
	const dicomMap = new OrderedMap<number, DCMImage>();
	for (let ctr = 0; ctr < images.length; ctr += 1) {
		dicomMap.put(images[ctr].sliceLocation, images[ctr]);
	}
	return dicomMap.getOrderedValues();
};

const orderByImageNumber = (images: Images): Images => {
	const dicomMap = new OrderedMap<number, DCMImage>();
	for (let ctr = 0; ctr < images.length; ctr += 1) {
		dicomMap.put(images[ctr].imageNumber, images[ctr]);
	}
	return dicomMap.getOrderedValues();
};

const hasMatchingSlice = (
	dg: Images,
	image: DCMImage,
	sliceDir: number,
	doImagePos: boolean,
	doSliceLoc: boolean
): boolean => {
	let matchingNum = 0;

	if (doImagePos) {
		matchingNum = image.getImagePositionSliceDir(sliceDir);
	}
	else if (doSliceLoc) {
		matchingNum = image.sliceLocation;
	}
	else {
		matchingNum = image.imageNumber;
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
			const sliceLoc = current.sliceLocation;
			if (sliceLoc === matchingNum) {
				return true;
			}
		}
		else {
			const imageNum = current.imageNumber;
			if (imageNum === matchingNum) {
				return true;
			}
		}
	}

	return false;
};

const orderByTime = (
	images: Images,
	numFrames:number,
	sliceDir: number,
	hasImagePosition: boolean,
	hasSliceLocation: boolean
): OrderedMap<number, Images> => {
	const dicomMap = new OrderedMap<number, Images>();
	const hasTemporalPosition = (numFrames > 1) && (images[0].temporalPosition !== null);
	const hasTemporalNumber = (numFrames > 1)
	&& (images[0].temporalNumber !== null)
	&& (images[0].temporalNumber === numFrames);
	if (hasTemporalPosition && hasTemporalNumber) { // explicit series
		for (let ctr = 0; ctr < images.length; ctr += 1) {
			const image = images[ctr];

			const tempPos = image.temporalPosition;
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
		const timeBySliceMap = new OrderedMap<number, OrderedMap<number, DCMImage>>();
		for (let ctr = 0; ctr < images.length; ctr += 1) {
			if (images[ctr] !== null) {
				let sliceMarker = ctr;
				if (hasImagePosition) {
					sliceMarker = images[ctr].getImagePositionSliceDir(sliceDir);
				}
				else if (hasSliceLocation) {
					sliceMarker = images[ctr].sliceLocation;
				}

				let slice = timeBySliceMap.get(sliceMarker);
				if (slice === null) {
					slice = new OrderedMap<number, DCMImage>();
					timeBySliceMap.put(sliceMarker, slice);
				}

				(slice as OrderedMap<number, DCMImage>).put(ctr, images[ctr]);
			}
		}

		// copy into DICOM array (ordered by slice by time)
		const dicomsCopy: DCMImage[] = [];
		let dicomsCopyIndex = 0;
		const sliceIt = timeBySliceMap.iterator();
		while (sliceIt.hasNext()) {
			const slice = sliceIt.next();
			const timeIt = slice!.iterator();
			while (timeIt.hasNext()) {
				dicomsCopy[dicomsCopyIndex] = timeIt.next()!;
				dicomsCopyIndex += 1;
			}
		}

		// groups dicoms by timepoint
		for (let ctr = 0; ctr < dicomsCopy.length; ctr += 1) {
			if (dicomsCopy[ctr] !== null) {
				let dgFound: Images | undefined;
				const it = dicomMap.iterator();
				while (it.hasNext()) {
					const dg = it.next();
					if (!hasMatchingSlice(
						dg!,
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

				dgFound!.push(dicomsCopy[ctr]);
			}
		}
	}

	return dicomMap;
};

const orderDicoms = (
	images: Images,
	numFrames: number,
	sliceDir: number
): Images => {
	const hasImagePosition = (images[0].imagePosition !== null);
	const hasSliceLocation = (images[0].sliceLocation !== null);
	const hasImageNumber = (images[0].imageNumber !== null);

	const timeMap = orderByTime(
		images,
		numFrames,
		sliceDir,
		hasImagePosition,
		hasSliceLocation
	);
	const timeIt = timeMap.orderedKeys;

	const imagesOrderedByTimeAndSpace:Images = [];

	for (let ctr = 0; ctr < timeIt.length; ctr += 1) {
		const dg = timeMap.get(timeIt[ctr])!;
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

/**
 * The Series constructor.
 * @property {DCMImage[]} images
 * @type {Function}
 */
class Series {
	static parserError: Error | null = null;

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
	static useExplicitSpacing: number = 0;

	images:Images = [];

	imagesOriginalOrder: Images | null = null;

	isMosaic: boolean = false;

	isElscint: boolean = false;

	isCompressed: boolean = false;

	numberOfFrames: number = 0;

	numberOfFramesInFile: number = 0;

	isMultiFrame: boolean = false;

	isMultiFrameVolume: boolean = false;

	isMultiFrameTimeseries: boolean = false;

	isImplicitTimeseries: boolean = false;

	sliceSense = false;

	sliceDir = SliceDirection.Unknown;

	error: Error | null = null;

	getOrder():number[] {
		const order = [];
		for (let ctr = 0; ctr < this.imagesOriginalOrder!.length; ctr += 1) {
			order[ctr] = this.imagesOriginalOrder![ctr].index;
		}
		return order;
	}

	/**
	 * Returns the series ID.
	 * @returns {string}
	 */
	toString():string {
		return this.images[0].seriesId;
	}

	/**
	 * Returns a nice name for the series.
	 * @returns {string|null}
	 */
	getName(): string | null {
		const des = this.images[0].seriesDescription;
		const uid = this.images[0].seriesInstanceUID;
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
	 * @param {DCMImage} image
	 */
	addImage(image: DCMImage) {
		this.images.push(image);
	}

	/**
	 * Returns true if the specified image is part of the series
	 * (or if no images are yet part of the series).
	 * @param {DCMImage} image
	 * @returns {boolean}
	 */
	matchesSeries(image:any): boolean {
		if (this.images.length === 0) {
			return true;
		}
		return (this.images[0].seriesId === image.seriesId);
	}

	/**
	 * Orders and organizes the images in this series.
	 */
	buildSeries() {
		const [image0] = this.images;
		this.isMosaic = image0.isMosaic();
		this.isElscint = image0.isElscint();
		this.isCompressed = image0.isCompressed();
		// check for multi-frame
		this.numberOfFrames = image0.numberOfFrames;
		this.numberOfFramesInFile = image0.getNumberOfImplicitFrames();
		this.isMultiFrame = (this.numberOfFrames > 1)
			|| (this.isMosaic && (image0.mosaicCols * image0.mosaicRows > 1));
		this.isMultiFrameVolume = false;
		this.isMultiFrameTimeseries = false;
		this.isImplicitTimeseries = false;
		if (this.isMultiFrame) {
			const hasFrameTime = (image0.getFrameTime() > 0);
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
			let imagePos = (image0.imagePosition || []);
			const sliceLoc = imagePos.toString();
			this.numberOfFrames = 0;
			for (let ctr = 0; ctr < this.images.length; ctr += 1) {
				imagePos = (this.images[ctr].imagePosition || []);
				if (imagePos.toString() === sliceLoc) {
					this.numberOfFrames += 1;
				}
			}
			if (this.numberOfFrames > 1) {
				this.isImplicitTimeseries = true;
			}
		}
		this.sliceDir = image0.acquiredSliceDirection;
		let orderedImages: DCMImage[];
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
			const sliceLocations = orderedImages[0].sliceLocationVector;
			if (sliceLocations !== null) {
				const { orientation } = orderedImages[0];
				if (orientation?.charAt(2) === "Z") {
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
		else if ((this.sliceDir === SliceDirection.Sagittal)
			|| (this.sliceDir === SliceDirection.Coronal)) {
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

	getMosaicData(image: DCMImage, data:Uint16Array | Uint8Array): ArrayBuffer {
		const [image0] = this.images;

		const mosaicWidth = image0.columns;
		const mosaicHeight = image0.rows;
		const { mosaicRows, mosaicCols } = image0;

		const numBytes = image0.bytesAllocated || 1;
		const numSlices = mosaicWidth * mosaicHeight;
		const numRows = Math.floor(mosaicHeight / mosaicRows);
		const numCols = Math.floor(mosaicWidth / mosaicCols);

		const mosaicRowHeight = Math.floor(mosaicHeight / mosaicRows);
		const mosaicColWidth = Math.floor(mosaicWidth / mosaicCols);

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
 * @returns {DCMImage|null}
 */
export const parseImage = (data: DataView): DCMImage | null => {
	const parser = new Parser();
	const image = parser.parse(data);

	if (parser.hasError()) {
		Series.parserError = parser.error as Error;
		return null;
	}

	if (parser.inflated) {
		image.inflated = parser.inflated;
	}

	return image;
};

export default Series;

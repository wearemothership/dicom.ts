import * as Utils from "./utilities";
import Dictionary from "./dictionary";
import Siemens from "./siemens";
import { Charset } from "./constants";

const PRIVATE_DATA_READERS = [Siemens];

export const TagIds: Record<string, TagTupleID> = {
	// metadata
	TransferSyntax: [0x0002, 0x0010],
	MetaLength: [0x0002, 0x0000],

	// sublists
	SublistItem: [0xFFFE, 0xE000],
	SublistItemDelim: [0xFFFE, 0xE00D],
	SequenceDelim: [0xFFFE, 0xE0DD],

	// image dims
	Rows: [0x0028, 0x0010],
	Cols: [0x0028, 0x0011],
	AcquisitionMatrix: [0x0018, 0x1310],
	NumberOfFrames: [0x0028, 0x0008],
	NumberTemporalPositions: [0x0020, 0x0105],

	// voxel dims
	PixelSpacing: [0x0028, 0x0030],
	SliceThickness: [0x0018, 0x0050],
	SliceGap: [0x0018, 0x0088],
	Tr: [0x0018, 0x0080],
	FrameTime: [0x0018, 0x1063],

	// datatype
	BitsAllocated: [0x0028, 0x0100],
	BitsStored: [0x0028, 0x0101],
	PixelRepresentation: [0x0028, 0x0103],
	HighBit: [0x0028, 0x0102],
	PhotometricInterpretation: [0x0028, 0x0004],
	SamplesPerPixel: [0x0028, 0x0002],
	PlanarConfig: [0x0028, 0x0006],
	PaletteRed: [0x0028, 0x1201],
	PaletteGreen: [0x0028, 0x1202],
	PaletteBlue: [0x0028, 0x1203],

	// data scale
	DataScaleSlope: [0x0028, 0x1053],
	DataScaleIntercept: [0x0028, 0x1052],
	DataScaleElscint: [0x0207, 0x101f],
	PixelBandwidth: [0x0018, 0x0095],

	// LUT
	VoiLutSequence: [0x0028, 0x3010],
	VoiLutDescriptor: [0x0028, 0x3002],
	// VoiLutExplanation: [0x0028, 0x3003],
	VoiLutData: [0x0028, 0x3006],

	// range
	ImageMin: [0x0028, 0x0106],
	ImageMax: [0x0028, 0x0107],
	WindowCenter: [0x0028, 0x1050],
	WindowWidth: [0x0028, 0x1051],

	// descriptors
	Charset: [0x0008, 0x0005],
	PatientName: [0x0010, 0x0010],
	PatientId: [0x0010, 0x0020],
	StudyDate: [0x0008, 0x0020],
	StudyTime: [0x0008, 0x0030],
	StudyDes: [0x0008, 0x1030],
	ImageType: [0x0008, 0x0008],
	ImageComments: [0x0020, 0x4000],
	SequenceName: [0x0018, 0x0024],
	Modality: [0x0008, 0x0060],

	// session ID
	FrameOfRefUid: [0x0020, 0x0052],

	// study ID
	StudyUid: [0x0020, 0x000d],

	// volume ID
	SeriesDescription: [0x0008, 0x103e],
	SeriesInstanceUid: [0x0020, 0x000e],
	SeriesNumber: [0x0020, 0x0011],
	EchoNumber: [0x0018, 0x0086],
	TemporalPosition: [0x0020, 0x0100],

	// slice ID
	ImageNum: [0x0020, 0x0013],
	SliceLocation: [0x0020, 0x1041],

	// orientation
	ImageOrientation: [0x0020, 0x0037],
	ImagePosition: [0x0020, 0x0032],
	SliceLocationVector: [0x0018, 0x2005],

	// LUT shape
	LutShape: [0x2050, 0x0020],

	// pixel data
	PixelData: [0x7fe0, 0x0010],
};

/**
 * Create an ID string based on the specified group and element
 * @param {number} group
 * @param {number} element
 * @returns {string}
 */
export const createTagId = (group:number, element:number):TagStringID => {
	const groupStr = Utils.dec2hex(group);
	const elemStr = Utils.dec2hex(element);
	return groupStr + elemStr;
};

interface ITagKey {
	group: number;
	element: number;
}

export type TagTupleID = [number, number];

export type TagStringID = string;

export type TagValue =
	Tag[]
	| ArrayBuffer
	| Uint8Array
	| Uint16Array
	| DataView
	| string
	| string[]
	| number[]
	| number
	| Date[]
	| null;

export type TagSingleValue = string | number | Date | null;

interface ITagContstuctor extends ITagKey {
	vr?: string | null
	value?: TagValue
	offsetStart?: number | null
	offsetValue?: number | null
	offsetEnd?: number | null
	littleEndian: boolean,
	charset?: Charset
}

const VRMaxLength = {
	AE: 16,
	AS: 4,
	AT: 4,
	CS: 16,
	DA: 8,
	DS: 16,
	DT: 26,
	FL: 4,
	FD: 8,
	IS: 12,
	LO: 64,
	LT: 10240,
	OB: -1,
	OD: -1,
	OF: -1,
	OW: -1,
	PN: 64 * 5,
	SH: 16,
	SL: 4,
	SS: 2,
	ST: 1024,
	TM: 16,
	UI: 64,
	UL: 4,
	UN: -1,
	US: 2,
	UT: -1
};

/**
 * Create an ID string based on the specified group and element
 * @param {Array} tupple with
 * 		@param {number} group
 * 		@param {number} element
 * @returns {string}
 */
export const createTagIdWithTag = ([group, element]: TagTupleID):string => {
	const groupStr = Utils.dec2hex(group);
	const elemStr = Utils.dec2hex(element);
	return groupStr + elemStr;
};

const getUnsignedInteger16 = (rawData: DataView, littleEndian: boolean):Array<number> => {
	const data = [];
	const mul = rawData.byteLength / 2;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getUint16(ctr * 2, littleEndian);
	}

	return data;
};

const getSignedInteger16 = (rawData: DataView, littleEndian: boolean):Array<number> => {
	const data = [];
	const mul = rawData.byteLength / 2;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getInt16(ctr * 2, littleEndian);
	}

	return data;
};

const getFloat32 = (rawData: DataView, littleEndian: boolean):Array<number> => {
	const data = [];
	const mul = rawData.byteLength / 4;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getFloat32(ctr * 4, littleEndian);
	}

	return data;
};

const getSignedInteger32 = (rawData: DataView, littleEndian: boolean):Array<number> => {
	const data = [];
	const mul = rawData.byteLength / 4;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getInt32(ctr * 4, littleEndian);
	}

	return data;
};

const getUnsignedInteger32 = (rawData: DataView, littleEndian: boolean):Array<number> => {
	const data = [];
	const mul = rawData.byteLength / 4;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getUint32(ctr * 4, littleEndian);
	}

	return data;
};

const getFloat64 = (rawData: DataView, littleEndian: boolean):Array<number> => {
	if (rawData.byteLength < 8) {
		return [0];
	}

	const data = [];
	const mul = rawData.byteLength / 8;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getFloat64(ctr * 8, littleEndian);
	}

	return data;
};

const getDoubleElscint = (rawData: DataView, littleEndian: boolean) => {
	const data = Array(8);
	if (littleEndian) {
		for (let ctr = 0; ctr < 8; ctr += 1) {
			data[ctr] = rawData.getUint8(ctr);
		}
	}
	else {
		for (let ctr = 0; ctr < 8; ctr += 1) {
			data[ctr] = rawData.getUint8(7 - ctr);
		}
	}

	const reordered = [
		data[3],
		data[2],
		data[1],
		data[0],
		data[7],
		data[6],
		data[5],
		data[4]
	];

	return [Utils.bytesToDouble(reordered)];
};

const getFixedLengthStringValue = (
	rawData: DataView,
	maxLength: number,
	charset?: string,
	vr?: string
):string[] => {
	const mul = Math.floor(rawData.byteLength / maxLength);
	const data = Array(mul);
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = Utils.getStringAt(rawData, ctr * maxLength, maxLength, charset, vr);
	}
	return data;
};

const getStringValue = (rawData: DataView, charset?: Charset, vr?: string) => {
	const data = Utils.getStringAt(rawData, 0, rawData.byteLength, charset, vr).split("\\");

	for (let ctr = 0; ctr < data.length; ctr += 1) {
		data[ctr] = data[ctr].trim();
	}

	return data;
};

const getSingleStringValue = (
	rawData: DataView,
	maxLength: number = 0,
	charset?: Charset,
	vr?: string
):[string] => {
	const len = Math.min(rawData.byteLength, maxLength);
	return [Utils.getStringAt(rawData, 0, len, charset, vr).trim()];
};

const getDateStringValue = (rawData: DataView): TagValue => {
	const dotFormat = (getSingleStringValue(rawData)[0].indexOf(".") !== -1);
	const stringData = getFixedLengthStringValue(rawData, dotFormat ? 10 : VRMaxLength.DA);
	let parts = null;
	const data:TagValue = [];

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		if (dotFormat) {
			parts = stringData[ctr].split(".");
			if (parts.length === 3) {
				data[ctr] = new Date(Utils.safeParseInt(parts[0]),
					Utils.safeParseInt(parts[1]) - 1,
					Utils.safeParseInt(parts[2]));
			}
			else {
				data[ctr] = new Date();
			}
		}
		else if (stringData[ctr].length === 8) {
			data[ctr] = new Date(Utils.safeParseInt(stringData[ctr].substring(0, 4)),
				Utils.safeParseInt(stringData[ctr].substring(4, 6)) - 1,
				Utils.safeParseInt(stringData[ctr].substring(6, 8)));
		}
		else {
			data[ctr] = Date.parse(stringData[ctr]);
		}

		if (!Utils.isValidDate(data[ctr])) {
			data[ctr] = stringData[ctr];
		}
	}

	return data;
};

const getDateTimeStringValue = (rawData: DataView): TagValue => {
	const stringData = getStringValue(rawData);
	const data:TagValue = [];
	let year = 0;
	let month = 0;
	let date = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		const str = stringData[ctr];
		const strLen = str.length;
		if (strLen >= 4) {
			year = parseInt(str.substring(0, 4), 10); // required

			if (strLen >= 6) {
				month = Utils.safeParseInt(str.substring(4, 6)) - 1;
			}

			if (strLen >= 8) {
				date = Utils.safeParseInt(str.substring(6, 8));
			}

			if (strLen >= 10) {
				hours = Utils.safeParseInt(str.substring(8, 10));
			}

			if (strLen >= 12) {
				minutes = Utils.safeParseInt(str.substring(10, 12));
			}

			if (strLen >= 14) {
				seconds = Utils.safeParseInt(str.substring(12, 14));
			}

			data[ctr] = new Date(year, month, date, hours, minutes, seconds);
		}
		else {
			data[ctr] = Date.parse(str);
		}

		if (!Utils.isValidDate(data[ctr])) {
			data[ctr] = str;
		}
	}

	return data;
};

const getTimeStringValue = (rawData: DataView, ms: boolean = false) => {
	const stringData = getStringValue(rawData);
	const data = [];

	if (ms) {
		let parts = null;
		let hours = 0;
		let minutes = 0;
		let seconds = 0;

		for (let ctr = 0; ctr < stringData.length; ctr += 1) {
			if (stringData[ctr].indexOf(":") !== -1) {
				parts = stringData[ctr].split(":");
				hours = Utils.safeParseInt(parts[0]);

				if (parts.length > 1) {
					minutes = Utils.safeParseInt(parts[1]);
				}

				if (parts.length > 2) {
					seconds = Utils.safeParseFloat(parts[2]);
				}
			}
			else {
				if (stringData[ctr].length >= 2) {
					hours = Utils.safeParseInt(stringData[ctr].substring(0, 2));
				}

				if (stringData[ctr].length >= 4) {
					minutes = Utils.safeParseInt(stringData[ctr].substring(2, 4));
				}

				if (stringData[ctr].length >= 6) {
					seconds = Utils.safeParseFloat(stringData[ctr].substring(4));
				}
			}

			data[ctr] = Math.round((hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000));
		}

		return data;
	}

	return stringData;
};

const getDoubleStringValue = (rawData: DataView) => {
	const stringData = getStringValue(rawData);
	const data = [];

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		data[ctr] = parseFloat(stringData[ctr]);
	}

	return data;
};

const getIntegerStringValue = (rawData: DataView) => {
	const stringData = getStringValue(rawData);
	const data = [];

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		data[ctr] = parseInt(stringData[ctr], 10);
	}

	return data;
};

const getPersonNameStringValue = (
	rawData: DataView,
	charset: Charset,
	vr: string
):string[] => {
	const stringData = getStringValue(rawData, charset, vr);
	const data = Array(stringData.length);

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		data[ctr] = stringData[ctr].replace("^", " ");
	}

	return data;
};

const convertPrivateValue = (
	group: number,
	element: number,
	rawData: DataView
): DataView | string => {
	let privReader;

	for (let ctr = 0; ctr < PRIVATE_DATA_READERS.length; ctr += 1) {
		privReader = new PRIVATE_DATA_READERS[ctr](rawData.buffer);
		if (privReader.canRead(group, element)) {
			return privReader.readHeader();
		}
	}

	return rawData;
};

const convertValue = (
	vr: string,
	rawData: DataView,
	littleEndian: boolean,
	charset: Charset
): TagValue => {
	let data: TagValue = null;
	// http://dicom.nema.org/dicom/2013/output/chtml/part05/sect_6.2.html
	switch (vr) {
		case "AE":
			data = getSingleStringValue(rawData, VRMaxLength.AE);
			break;
		case "AS":
			data = getFixedLengthStringValue(rawData, VRMaxLength.AS);
			break;
		case "AT":
			data = getUnsignedInteger16(rawData, littleEndian);
			break;
		case "CS":
			data = getStringValue(rawData);
			break;
		case "DA":
			data = getDateStringValue(rawData);
			break;
		case "DS":
			data = getDoubleStringValue(rawData);
			break;
		case "DT":
			data = getDateTimeStringValue(rawData);
			break;
		case "FL":
			data = getFloat32(rawData, littleEndian);
			break;
		case "FD":
			data = getFloat64(rawData, littleEndian);
			break;
		case "FE":
			data = getDoubleElscint(rawData, littleEndian);
			break;
		case "IS":
			data = getIntegerStringValue(rawData);
			break;
		case "LO":
			data = getStringValue(rawData, charset, vr);
			break;
		case "LT":
			data = getSingleStringValue(rawData, VRMaxLength.AT);
			break;
		case "OB":
		case "OD":
		case "OF":
		case "OW":
			data = rawData;
			break;
		case "PN":
			data = getPersonNameStringValue(rawData, charset, vr);
			break;
		case "SH":
			data = getStringValue(rawData, charset, vr);
			break;
		case "SL":
			data = getSignedInteger32(rawData, littleEndian);
			break;
		case "SQ":
			data = null;
			break;
		case "SS":
			data = getSignedInteger16(rawData, littleEndian);
			break;
		case "ST":
			data = getSingleStringValue(rawData, VRMaxLength.ST);
			break;
		case "TM":
			data = getTimeStringValue(rawData);
			break;
		case "UI":
			data = getStringValue(rawData);
			break;
		case "UL":
			data = getUnsignedInteger32(rawData, littleEndian);
			break;
		case "UN":
			data = rawData;
			break;
		case "US":
			data = getUnsignedInteger16(rawData, littleEndian);
			break;
		case "UT":
			data = getSingleStringValue(rawData, Number.MAX_SAFE_INTEGER, charset, vr);
			break;
		default:
	}

	return data;
};

class Tag implements ITagKey {
	static isEqual({ group, element }: ITagKey, tagId: TagTupleID) {
		return group === tagId[0] && element === tagId[1];
	}

	id: TagStringID

	group: number

	element: number

	vr: string | null

	value: TagValue

	offsetStart: number | null

	offsetValue: number | null

	offsetEnd: number | null

	sublist: boolean

	preformatted: boolean

	/**
	 * The Tag constuctor.
	 * @property {number} group
	 * @property {number} element
	 * @property {string} vr
	 * @property {number} offsetStart
	 * @property {number} offsetValue
	 * @property {number} offsetEnd
	 * @property {boolean} sublist - true if this tag is a sublist
	 * @property {number|number[]|string|string[]|object} value
	 * @type {Function}
	 */
	constructor({
		group,
		element,
		vr = null,
		value = null,
		offsetStart = null,
		offsetValue = null,
		offsetEnd = null,
		littleEndian = true,
		charset = null
	}: ITagContstuctor) {
		this.group = group;
		this.element = element;
		this.vr = vr;
		this.offsetStart = offsetStart;
		this.offsetValue = offsetValue;
		this.offsetEnd = offsetEnd;
		this.sublist = false;
		this.preformatted = false;
		this.id = createTagId(group, element);

		if (value instanceof Array) {
			this.value = value;
			this.sublist = true;
		}
		else if (value !== null) {
			const dv = new DataView(value as Uint8Array);
			this.value = convertValue(vr!, dv, littleEndian, charset);

			if ((this.value === dv) && this.isPrivateData()) {
				this.value = convertPrivateValue(group, element, dv);
				this.preformatted = (this.value !== dv);
			}
		}
		else {
			this.value = null;
		}
	}

	/**
	 * Returns true if this is the transform syntax tag.
	 * @returns {boolean}
	 */
	is([group, element]: TagTupleID):boolean {
		return ((this.group === group) && (this.element === element));
	}

	/**
	 * Returns true if this tag contains private data.
	 * @returns {boolean}
	 */
	isPrivateData():boolean {
		/* eslint-disable no-bitwise */
		return ((this.group & 1) === 1);
	}

	/**
	 * Returns true if this tag contains private data that can be read.
	 * @returns {boolean}
	 */
	hasInterpretedPrivateData(): boolean {
		return this.isPrivateData() && Utils.isString(this.value);
	}

	/**
	 * Returns a string representation of this tag.
	 * @param {number} [level] - the indentation level
	 * @param {boolean} [html]
	 * @returns {string}
	 */
	toString(level: number = 0, html: boolean = false): string {
		let valueStr = "";
		const groupStr = Utils.dec2hex(this.group);
		const elemStr = Utils.dec2hex(this.element);
		let tagStr = `(${groupStr},${elemStr})`;
		let des = "";
		let padding;

		padding = "";
		for (let ctr = 0; ctr < level; ctr += 1) {
			if (html) {
				padding += "&nbsp;&nbsp;";
			}
			else {
				padding += "  ";
			}
		}

		if (this.sublist) {
			const value = <Array<Tag>> this.value;
			for (let ctr = 0; ctr < value!.length; ctr += 1) {
				const tag = value[ctr];
				valueStr += `\n${(tag.toString(level + 1, html))}`;
			}
		}
		else if (this.vr === "SQ" || this.is(TagIds.PixelData) || !this.value) {
			valueStr = "";
		}
		else if (html && this.preformatted) {
			valueStr = `[<pre>${this.value}</pre>]`;
		}
		else {
			valueStr = `[${this.value}]`;
		}

		if (this.is(TagIds.SublistItem)) {
			tagStr = "Sequence Item";
		}
		else if (this.is(TagIds.SublistItemDelim)) {
			tagStr = "Sequence Item Delimiter";
		}
		else if (this.is(TagIds.SequenceDelim)) {
			tagStr = "Sequence Delimiter";
		}
		else if (this.is(TagIds.PixelData)) {
			tagStr = "Pixel Data";
		}
		else {
			des = Utils.convertCamcelCaseToTitleCase(Dictionary.getDescription(this.group, this.element));
		}

		if (html) {
			return `${padding}<span style='color:#B5CBD3'>${tagStr}</span>&nbsp;&nbsp;&nbsp;${des}&nbsp;&nbsp;&nbsp;${valueStr}`;
		}
		return `${padding} ${tagStr} ${des} ${valueStr}`;
	}

	/**
	 * Returns an HTML string representation of this tag.
	 * @param {number} level - the indentation level
	 * @returns {string}
	 */
	toHTMLString(level: number = 0): string {
		return this.toString(level, true);
	}

	// for test, ignore any ptotocol changes etc
	toObject(): any {
		const {
			id,
			group,
			element,
			vr,
			value,
			offsetStart,
			offsetValue,
			offsetEnd,
			sublist,
			preformatted
		} = this;

		return {
			id,
			group,
			element,
			vr,
			value,
			offsetStart,
			offsetValue,
			offsetEnd,
			sublist,
			preformatted
		};
	}
}

export default Tag;

/* eslint-disable no-use-before-define */
import * as Utils from "./utilities";
import Dictionary from "./dictionary";
import Siemens from "./siemens";

const PRIVATE_DATA_READERS = [Siemens];

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
class Tag {
	static isEqual({ group, element }, tagId) {
		return group === tagId[0] && element === tagId[1];
	}

	constructor({
		group,
		element,
		vr = null,
		value = null,
		offsetStart = null,
		offsetValue = null,
		offsetEnd = null,
		littleEndian = null,
		charset = null
	}) {
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
			const dv = new DataView(value);
			this.value = convertValue(vr, dv, littleEndian, charset);

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
	is([group, element]) {
		return ((this.group === group) && (this.element === element));
	}

	/**
	 * Returns true if this tag contains private data.
	 * @returns {boolean}
	 */
	isPrivateData() {
		/* eslint-disable no-bitwise */
		return ((this.group & 1) === 1);
	}

	/**
	 * Returns true if this tag contains private data that can be read.
	 * @returns {boolean}
	 */
	hasInterpretedPrivateData() {
		return this.isPrivateData() && Utils.isString(this.value);
	}

	/**
	 * Returns a string representation of this tag.
	 * @param {number} [level] - the indentation level
	 * @param {boolean} [html]
	 * @returns {string}
	 */
	toString(level, html) {
		let valueStr = "";
		const groupStr = Utils.dec2hex(this.group);
		const elemStr = Utils.dec2hex(this.element);
		let tagStr = `(${groupStr},${elemStr})`;
		let des = "";
		let padding;

		if (level === undefined) {
			// eslint-disable-next-line no-param-reassign
			level = 0;
		}

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
			for (let ctr = 0; ctr < this.value.length; ctr += 1) {
				valueStr += `\n${(this.value[ctr].toString(level + 1, html))}`;
			}
		}
		else if (this.vr === "SQ" || this.is(TagId.PixelData) || !this.value) {
			valueStr = "";
		}
		else if (html && this.preformatted) {
			valueStr = `[<pre>${this.value}</pre>]`;
		}
		else {
			valueStr = `[${this.value}]`;
		}

		if (this.is(TagId.SublistItem)) {
			tagStr = "Sequence Item";
		}
		else if (this.is(TagId.SublistItemDelim)) {
			tagStr = "Sequence Item Delimiter";
		}
		else if (this.is(TagId.SequenceDelim)) {
			tagStr = "Sequence Delimiter";
		}
		else if (this.is(TagId.PixelData)) {
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
	toHTMLString(level) {
		return this.toString(level, true);
	}
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

// metadata
Tag.TAG_TRANSFER_SYNTAX = [0x0002, 0x0010];
Tag.TAG_META_LENGTH = [0x0002, 0x0000];

// sublists
Tag.TAG_SUBLIST_ITEM = [0xFFFE, 0xE000];
Tag.TAG_SUBLIST_ITEM_DELIM = [0xFFFE, 0xE00D];
Tag.TAG_SUBLIST_SEQ_DELIM = [0xFFFE, 0xE0DD];

// image dims
Tag.TAG_ROWS = [0x0028, 0x0010];
Tag.TAG_COLS = [0x0028, 0x0011];
Tag.TAG_ACQUISITION_MATRIX = [0x0018, 0x1310];
Tag.TAG_NUMBER_OF_FRAMES = [0x0028, 0x0008];
Tag.TAG_NUMBER_TEMPORAL_POSITIONS = [0x0020, 0x0105];

// voxel dims
Tag.TAG_PIXEL_SPACING = [0x0028, 0x0030];
Tag.TAG_SLICE_THICKNESS = [0x0018, 0x0050];
Tag.TAG_SLICE_GAP = [0x0018, 0x0088];
Tag.TAG_TR = [0x0018, 0x0080];
Tag.TAG_FRAME_TIME = [0x0018, 0x1063];

// datatype
Tag.TAG_BITS_ALLOCATED = [0x0028, 0x0100];
Tag.TAG_BITS_STORED = [0x0028, 0x0101];
Tag.TAG_PIXEL_REPRESENTATION = [0x0028, 0x0103];
Tag.TAG_HIGH_BIT = [0x0028, 0x0102];
Tag.TAG_PHOTOMETRIC_INTERPRETATION = [0x0028, 0x0004];
Tag.TAG_SAMPLES_PER_PIXEL = [0x0028, 0x0002];
Tag.TAG_PLANAR_CONFIG = [0x0028, 0x0006];
Tag.TAG_PALETTE_RED = [0x0028, 0x1201];
Tag.TAG_PALETTE_GREEN = [0x0028, 0x1202];
Tag.TAG_PALETTE_BLUE = [0x0028, 0x1203];

// data scale
Tag.TAG_DATA_SCALE_SLOPE = [0x0028, 0x1053];
Tag.TAG_DATA_SCALE_INTERCEPT = [0x0028, 0x1052];
Tag.TAG_DATA_SCALE_ELSCINT = [0x0207, 0x101F];
Tag.TAG_PIXEL_BANDWIDTH = [0x0018, 0x0095];

// LUT
Tag.TAG_VOI_LUT_SEQUENCE = [0x0028, 0x3010];
Tag.TAG_VOI_LUT_DESCRIPTOR = [0x0028, 0x3002];
// Tag.TAG_VOI_LUT_EXPLANATION = [0x0028, 0x3003];
Tag.TAG_VOI_LUT_DATA = [0x0028, 0x3006];

// range
Tag.TAG_IMAGE_MIN = [0x0028, 0x0106];
Tag.TAG_IMAGE_MAX = [0x0028, 0x0107];
Tag.TAG_WINDOW_CENTER = [0x0028, 0x1050];
Tag.TAG_WINDOW_WIDTH = [0x0028, 0x1051];

// descriptors
Tag.TAG_SPECIFIC_CHAR_SET = [0x0008, 0x0005];
Tag.TAG_PATIENT_NAME = [0x0010, 0x0010];
Tag.TAG_PATIENT_ID = [0x0010, 0x0020];
Tag.TAG_STUDY_DATE = [0x0008, 0x0020];
Tag.TAG_STUDY_TIME = [0x0008, 0x0030];
Tag.TAG_STUDY_DES = [0x0008, 0x1030];
Tag.TAG_IMAGE_TYPE = [0x0008, 0x0008];
Tag.TAG_IMAGE_COMMENTS = [0x0020, 0x4000];
Tag.TAG_SEQUENCE_NAME = [0x0018, 0x0024];
Tag.TAG_MODALITY = [0x0008, 0x0060];

// session ID
Tag.TAG_FRAME_OF_REF_UID = [0x0020, 0x0052];

// study ID
Tag.TAG_STUDY_UID = [0x0020, 0x000D];

// volume ID
Tag.TAG_SERIES_DESCRIPTION = [0x0008, 0x103E];
Tag.TAG_SERIES_INSTANCE_UID = [0x0020, 0x000E];
Tag.TAG_SERIES_NUMBER = [0x0020, 0x0011];
Tag.TAG_ECHO_NUMBER = [0x0018, 0x0086];
Tag.TAG_TEMPORAL_POSITION = [0x0020, 0x0100];

// slice ID
Tag.TAG_IMAGE_NUM = [0x0020, 0x0013];
Tag.TAG_SLICE_LOCATION = [0x0020, 0x1041];

// orientation
Tag.TAG_IMAGE_ORIENTATION = [0x0020, 0x0037];
Tag.TAG_IMAGE_POSITION = [0x0020, 0x0032];
Tag.TAG_SLICE_LOCATION_VECTOR = [0x0018, 0x2005];

// LUT shape
Tag.TAG_LUT_SHAPE = [0x2050, 0x0020];

// pixel data
Tag.TAG_PIXEL_DATA = [0x7FE0, 0x0010];

/**
 * Create an ID string based on the specified group and element
 * @param {number} group
 * @param {number} element
 * @returns {string}
 */
export const createTagId = (group, element) => {
	const groupStr = Utils.dec2hex(group);
	const elemStr = Utils.dec2hex(element);
	return groupStr + elemStr;
};

/**
 * Create an ID string based on the specified group and element
 * @param {Array} tupple with
 * 		@param {number} group
 * 		@param {number} element
 * @returns {string}
 */
export const createTagIdWithTag = ([group, element]) => {
	const groupStr = Utils.dec2hex(group);
	const elemStr = Utils.dec2hex(element);
	return groupStr + elemStr;
};

const getUnsignedInteger16 = (rawData, littleEndian) => {
	const data = [];
	const mul = rawData.byteLength / 2;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getUint16(ctr * 2, littleEndian);
	}

	return data;
};

const getSignedInteger16 = (rawData, littleEndian) => {
	const data = [];
	const mul = rawData.byteLength / 2;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getInt16(ctr * 2, littleEndian);
	}

	return data;
};

const getFloat32 = (rawData, littleEndian) => {
	const data = [];
	const mul = rawData.byteLength / 4;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getFloat32(ctr * 4, littleEndian);
	}

	return data;
};

const getSignedInteger32 = (rawData, littleEndian) => {
	const data = [];
	const mul = rawData.byteLength / 4;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getInt32(ctr * 4, littleEndian);
	}

	return data;
};

const getUnsignedInteger32 = (rawData, littleEndian) => {
	const data = [];
	const mul = rawData.byteLength / 4;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getUint32(ctr * 4, littleEndian);
	}

	return data;
};

const getFloat64 = (rawData, littleEndian) => {
	if (rawData.byteLength < 8) {
		return 0;
	}

	const data = [];
	const mul = rawData.byteLength / 8;
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = rawData.getFloat64(ctr * 8, littleEndian);
	}

	return data;
};

const getDoubleElscint = (rawData) => {
	const data = [];

	for (let ctr = 0; ctr < 8; ctr += 1) {
		data[ctr] = rawData.getUint8(ctr);
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

const getFixedLengthStringValue = (rawData, maxLength, charset, vr) => {
	const mul = Math.floor(rawData.byteLength / maxLength);
	const data = [];
	for (let ctr = 0; ctr < mul; ctr += 1) {
		data[ctr] = Utils.getStringAt(rawData, ctr * maxLength, maxLength, charset, vr);
	}
	return data;
};

const getStringValue = (rawData, charset, vr) => {
	const data = Utils.getStringAt(rawData, 0, rawData.byteLength, charset, vr).split("\\");

	for (let ctr = 0; ctr < data.length; ctr += 1) {
		data[ctr] = data[ctr].trim();
	}

	return data;
};

const getDateStringValue = (rawData) => {
	const dotFormat = (getSingleStringValue(rawData)[0].indexOf(".") !== -1);
	const stringData = getFixedLengthStringValue(rawData, dotFormat ? 10 : VRMaxLength.DA);
	let parts = null;
	const data = [];

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

const getDateTimeStringValue = (rawData) => {
	const stringData = getStringValue(rawData);
	const data = [];
	let year = null;
	let month = null;
	let date = null;
	let hours = null;
	let minutes = null;
	let seconds = null;

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

const getTimeStringValue = (rawData, ms) => {
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

const getDoubleStringValue = (rawData) => {
	const stringData = getStringValue(rawData);
	const data = [];

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		data[ctr] = parseFloat(stringData[ctr]);
	}

	return data;
};

const getIntegerStringValue = (rawData) => {
	const stringData = getStringValue(rawData);
	const data = [];

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		data[ctr] = parseInt(stringData[ctr], 10);
	}

	return data;
};

const getSingleStringValue = (rawData, maxLength, charset, vr) => {
	const len = Math.min(rawData.byteLength, maxLength || 0);
	return [Utils.getStringAt(rawData, 0, len, charset, vr).trim()];
};

const getPersonNameStringValue = (rawData, charset, vr) => {
	const stringData = getStringValue(rawData, charset, vr);
	const data = [];

	for (let ctr = 0; ctr < stringData.length; ctr += 1) {
		data[ctr] = stringData[ctr].replace("^", " ");
	}

	return data;
};

const convertPrivateValue = (group, element, rawData) => {
	let privReader;

	for (let ctr = 0; ctr < PRIVATE_DATA_READERS.length; ctr += 1) {
		privReader = new PRIVATE_DATA_READERS[ctr](rawData.buffer);
		if (privReader.canRead(group, element)) {
			return privReader.readHeader();
		}
	}

	return rawData;
};

const convertValue = (vr, rawData, littleEndian, charset) => {
	let data = null;
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

export const TagId = {
	Charset: Tag.TAG_SPECIFIC_CHAR_SET,
	PixelData: Tag.TAG_PIXEL_DATA,
	SublistItem: Tag.TAG_SUBLIST_ITEM,
	SublistItemDelim: Tag.TAG_SUBLIST_ITEM_DELIM,
	SequenceDelim: Tag.TAG_SUBLIST_SEQ_DELIM,
	MetaLength: Tag.TAG_META_LENGTH,
	TransferSyntax: Tag.TAG_TRANSFER_SYNTAX,
};

export default Tag;

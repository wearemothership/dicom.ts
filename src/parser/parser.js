/* eslint no-use-before-define: ["error", { "classes": false }] */
import pako from "pako";

import DCMImage from "./image";
import Tag, { TagId } from "./tag";
import * as Utils from "./utilities";
import Dictionary from "./dictionary";
import { TransferSyntax } from "./constants";

/**
 * Returns true if the DICOM magic cookie is found.
 * @param {DataView} data
 * @returns {boolean}
 */
const isMagicCookieFound = (data) => {
	const offset = Parser.MAGIC_COOKIE_OFFSET;
	const magicCookieLength = Parser.MAGIC_COOKIE.length;
	for (let ctr = 0; ctr < magicCookieLength; ctr += 1) {
		if (data.getUint8(offset + ctr) !== Parser.MAGIC_COOKIE[ctr]) {
			return false;
		}
	}
	return true;
};

const findFirstTagOffset = (data) => {
	const magicCookieLength = Parser.MAGIC_COOKIE.length;
	if (isMagicCookieFound(data)) {
		return Parser.MAGIC_COOKIE_OFFSET + magicCookieLength;
	}

	const searchOffsetMax = Parser.MAGIC_COOKIE_OFFSET * 5;
	let found = false;
	let offset = 0;

	for (let ctr = 0; ctr < searchOffsetMax; ctr += 1) {
		const ch = data.getUint8(ctr);
		if (ch === Parser.MAGIC_COOKIE[0]) {
			found = true;
			for (let ctrIn = 1; ctrIn < magicCookieLength; ctrIn += 1) {
				if (data.getUint8(ctr + ctrIn) !== Parser.MAGIC_COOKIE[ctrIn]) {
					found = false;
				}
			}

			if (found) {
				offset = ctr + magicCookieLength;
				break;
			}
		}
	}
	return offset;
};

class Parser {
	/**
	 * Global property to output string representation of tags as they are parsed.
	 * @type {boolean}
	 */
	static verbose = false;

	static MAGIC_COOKIE_OFFSET = 128;

	static MAGIC_COOKIE = [68, 73, 67, 77];

	static VRS = ["AE", "AS", "AT", "CS", "DA", "DS", "DT", "FL", "FD", "IS", "LO", "LT", "OB", "OD", "OF", "OW", "PN", "SH", "SL", "SS", "ST", "TM", "UI", "UL", "UN", "US", "UT"];

	static DATA_VRS = ["OB", "OW", "OF", "SQ", "UT", "UN"];

	static RAW_DATA_VRS = ["OB", "OD", "OF", "OW", "UN"];

	static UNDEFINED_LENGTH = 0xFFFFFFFF;

	constructor() {
		this.littleEndian = true;
		this.explicit = true;
		this.metaFound = false;
		this.metaFinished = false;
		this.metaFinishedOffset = -1;
		this.needsDeflate = false;
		this.inflated = null;
		this.encapsulation = false;
		this.level = 0;
		this.error = null;
	}

	/**
	 * Parses this data and returns an image object.
	 * @param {DataView} data
	 * @returns {Image|null}
	 */
	parse(dataIn) {
		let image = null;
		let data = dataIn;
		try {
			image = new DCMImage();
			const offset = findFirstTagOffset(data);
			let tag = this.getNextTag(data, offset);

			while (tag !== null) {
				if (Parser.verbose) {
					console.log(tag.toString());
				}

				image.putTag(tag);

				if (tag.is(TagId.PixelData)) {
					break;
				}

				if (this.needsDeflate && (tag.offsetEnd >= this.metaFinishedOffset)) {
					this.needsDeflate = false;
					const copyMeta = data.buffer.slice(0, tag.offsetEnd);
					const copyDeflated = data.buffer.slice(tag.offsetEnd);
					this.inflated = Utils.concatArrayBuffers(copyMeta, pako.inflateRaw(copyDeflated));
					data = new DataView(this.inflated);
				}
				tag = this.getNextTag(data, tag.offsetEnd);
			}
		}
		catch (err) {
			this.error = err;
		}

		if (image !== null) {
			// set cached tags
			image.parseComplete(this.littleEndian);
		}

		return image;
	}

	parseEncapsulated(data) {
		this.encapsulation = true;
		const tags = [];
		try {
			let tag = this.getNextTag(data, 0);
			while (tag !== null) {
				if (tag.is(TagId.SublistItem)) {
					tags.push(tag);
				}

				if (Parser.verbose) {
					console.log(tag.toString());
				}

				tag = this.getNextTag(data, tag.offsetEnd);
			}
		}
		catch (err) {
			this.error = err;
		}
		return tags;
	}

	testForValidTag(data) {
		let tag = null;
		try {
			const offset = findFirstTagOffset(data);
			tag = this.getNextTag(data, offset, false);
		}
		catch (err) {
			this.error = err;
		}
		return tag;
	}

	getNextTag(data, offsetStart, testForTag) {
		let group = 0;
		let value = null;
		let offset = offsetStart;
		let length = 0;
		let little = true;
		let vr = null;

		if (offset >= data.byteLength) {
			return null;
		}

		if (this.metaFinished) {
			little = this.littleEndian;
			group = data.getUint16(offset, little);
		}
		else {
			group = data.getUint16(offset, true);
			if (((this.metaFinishedOffset !== -1)
				&& (offset >= this.metaFinishedOffset))
				|| (group !== 0x0002)) {
				this.metaFinished = true;
				little = this.littleEndian;
				group = data.getUint16(offset, little);
			}
		}

		if (!this.metaFound && (group === 0x0002)) {
			this.metaFound = true;
		}

		offset += 2;

		const element = data.getUint16(offset, little);
		offset += 2;
		if (this.explicit || !this.metaFinished) {
			vr = Utils.getStringAt(data, offset, 2);

			if (!this.metaFound && this.metaFinished && (Parser.VRS.indexOf(vr) === -1)) {
				vr = Dictionary.getVR(group, element);
				length = data.getUint32(offset, little);
				offset += 4;
				this.explicit = false;
			}
			else {
				offset += 2;

				if (Parser.DATA_VRS.indexOf(vr) !== -1) {
					offset += 2; // skip two empty bytes

					length = data.getUint32(offset, little);
					offset += 4;
				}
				else {
					length = data.getUint16(offset, little);
					offset += 2;
				}
			}
		}
		else {
			vr = Dictionary.getVR(group, element);
			length = data.getUint32(offset, little);

			if (length === Parser.UNDEFINED_LENGTH) {
				vr = "SQ";
			}

			offset += 4;
		}

		const offsetValue = offset;

		const isPixelData = Tag.isEqual({ group, element }, TagId.PixelData);

		if ((vr === "SQ") || (!isPixelData && !this.encapsulation && (Parser.DATA_VRS.indexOf(vr) !== -1))) {
			value = this.parseSublist(data, offset, length, vr !== "SQ");

			if (length === Parser.UNDEFINED_LENGTH) {
				length = value[value.length - 1].offsetEnd - offset;
			}
		}
		else if ((length > 0) && !testForTag) {
			if (length === Parser.UNDEFINED_LENGTH) {
				if (isPixelData) {
					length = (data.byteLength - offset);
				}
			}

			value = data.buffer.slice(offset, offset + length);
		}

		offset += length;
		const tag = new Tag({
			group,
			element,
			vr,
			value,
			offsetStart,
			offsetValue,
			offsetEnd: offset,
			littleEndian: this.littleEndian,
			charset: this.charset
		});

		if (tag.value) {
			if (tag.is(TagId.TransferSyntax)) {
				const [val] = tag.value;
				this.explicit = true;
				this.littleEndian = true;
				if (val === TransferSyntax.implicitLittle) {
					this.explicit = false;
				}
				else if (val === TransferSyntax.explicitBig) {
					this.littleEndian = false;
				}
				else if (val === TransferSyntax.compressionDeflate) {
					this.needsDeflate = true;
				}
			}
			else if (tag.is(TagId.MetaLength)) {
				this.metaFinishedOffset = tag.value[0] + offset;
			}
			else if (tag.is(TagId.Charset)) {
				let charset = tag.value;
				if (charset.length === 2) {
					charset = `${charset[0] || "ISO 2022 IR 6"}\\${charset[1]}`;
				}
				else if (charset.length === 1) {
					[charset] = charset;
				}
				this.charset = charset;
			}
		}
		return tag;
	}

	parseSublist(data, offsetStart, length, raw) {
		const tags = [];
		let offset = offsetStart;
		const offsetEnd = offsetStart + length;
		this.level += 1;

		if (length === Parser.UNDEFINED_LENGTH) {
			let sublistItem = this.parseSublistItem(data, offset, raw);

			while (!sublistItem.is(TagId.SequenceDelim)) {
				tags.push(sublistItem);
				offset = sublistItem.offsetEnd;
				sublistItem = this.parseSublistItem(data, offset, raw);
			}

			tags.push(sublistItem);
		}
		else {
			while (offset < offsetEnd) {
				const sublistItem = this.parseSublistItem(data, offset, raw);
				tags.push(sublistItem);
				offset = sublistItem.offsetEnd;
			}
		}

		this.level -= 1;

		return tags;
	}

	parseSublistItem(data, offsetStart, raw) {
		let offset = offsetStart;
		let value = null;
		const tags = [];

		const group = data.getUint16(offset, this.littleEndian);
		offset += 2;

		const element = data.getUint16(offset, this.littleEndian);
		offset += 2;

		const length = data.getUint32(offset, this.littleEndian);
		offset += 4;

		const offsetValue = offset;

		if (length === Parser.UNDEFINED_LENGTH) {
			let tag = this.getNextTag(data, offset);

			while (!tag.is(TagId.SublistItemDelim)) {
				tags.push(tag);
				offset = tag.offsetEnd;
				tag = this.getNextTag(data, offset);
			}

			tags.push(tag);
			offset = tag.offsetEnd;
		}
		else if (raw) {
			value = data.buffer.slice(offset, offset + length);
			offset += length;
		}
		else {
			const offsetEnd = offset + length;

			while (offset < offsetEnd) {
				const tag = this.getNextTag(data, offset);
				tags.push(tag);
				offset = tag.offsetEnd;
			}
		}

		const sublistItemTag = new Tag({
			group,
			element,
			value: value ?? tags,
			offsetStart,
			offsetValue,
			offsetEnd: offset,
			littleEndian: this.littleEndian
		});
		return sublistItemTag;
	}

	hasError() {
		return (this.error !== null);
	}
}
// give Image access to parser
Image.Parser = Parser;

export default Parser;

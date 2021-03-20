/* eslint no-use-before-define: ["error", { "classes": false }] */
// @ts-ignore
import pako from "pako";
// @ts-ignore
import DCMImage from "./image";
// @ts-ignore
import Tag, { TagIds } from "./tag";

import * as Utils from "./utilities";
// @ts-ignore
import Dictionary from "./dictionary";

import { Charset, DefaultCharset, TransferSyntax } from "./constants";

const MAGIC_COOKIE_OFFSET = 128;
const MAGIC_COOKIE = [68, 73, 67, 77];

/**
 * Returns true if the DICOM magic cookie is found.
 * @param {DataView} data
 * @returns {boolean}
 */
const isMagicCookieFound = (data: DataView): boolean => {
	const offset = MAGIC_COOKIE_OFFSET;
	const magicCookieLength = MAGIC_COOKIE.length;
	for (let ctr = 0; ctr < magicCookieLength; ctr += 1) {
		if (data.getUint8(offset + ctr) !== MAGIC_COOKIE[ctr]) {
			return false;
		}
	}
	return true;
};

const findFirstTagOffset = (data: DataView): number => {
	const magicCookieLength = MAGIC_COOKIE.length;
	if (isMagicCookieFound(data)) {
		return MAGIC_COOKIE_OFFSET + magicCookieLength;
	}

	const searchOffsetMax = MAGIC_COOKIE_OFFSET * 5;
	let found = false;
	let offset = 0;

	for (let ctr = 0; ctr < searchOffsetMax; ctr += 1) {
		const ch = data.getUint8(ctr);
		if (ch === MAGIC_COOKIE[0]) {
			found = true;
			for (let ctrIn = 1; ctrIn < magicCookieLength; ctrIn += 1) {
				if (data.getUint8(ctr + ctrIn) !== MAGIC_COOKIE[ctrIn]) {
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

interface IParserPublic {
	littleEndian:boolean;
	explicit:boolean;
	error?: Error | null;
	charset?:Charset;
}

/**
 * Parser class
 */
class Parser implements IParserPublic {
	/**
	 * Global property to output string representation of tags as they are parsed.
	 * @type {boolean}
	 */
	static verbose:boolean = false;

	static VRS = ["AE", "AS", "AT", "CS", "DA", "DS", "DT", "FL", "FD", "IS", "LO", "LT", "OB", "OD", "OF", "OW", "PN", "SH", "SL", "SS", "ST", "TM", "UI", "UL", "UN", "US", "UT"];

	static DATA_VRS = ["OB", "OW", "OF", "SQ", "UT", "UN"];

	static RAW_DATA_VRS = ["OB", "OD", "OF", "OW", "UN"];

	static UNDEFINED_LENGTH = 0xFFFFFFFF;

	littleEndian = true;

	explicit = true;

	metaFound = false;

	metaFinished = false;

	metaFinishedOffset= -1;

	needsDeflate = false;

	inflated: ArrayBuffer | null = null;

	encapsulation = false;

	level = 0;

	error: Error | null = null;

	charset?:Charset = null;

	/**
	 * Parses this data and returns an image object.
	 * @param {DataView} data
	 * @returns {Image|null}
	 */
	parse(dataIn: DataView):any {
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

				if (tag.is(TagIds.PixelData)) {
					break;
				}

				if (this.needsDeflate && (tag.offsetEnd >= this.metaFinishedOffset)) {
					this.needsDeflate = false;
					const copyMeta = data.buffer.slice(0, tag.offsetEnd);
					const copyDeflated = data.buffer.slice(tag.offsetEnd);
					this.inflated = Utils.concatArrayBuffers(
						copyMeta,
						<ArrayBuffer> pako.inflateRaw(copyDeflated)
					);
					data = new DataView(this.inflated!);
				}
				tag = this.getNextTag(data, tag.offsetEnd);
			}
		}
		catch (err) {
			this.error = (<Error> err);
		}

		if (image !== null) {
			// set cached tags
			image.littleEndian = this.littleEndian;
		}

		return image;
	}

	parseEncapsulated(data: DataView): Tag[] {
		this.encapsulation = true;
		const tags: Tag[] = [];
		try {
			let tag = this.getNextTag(data, 0);
			while (tag !== null) {
				if (tag.is(TagIds.SublistItem)) {
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

	testForValidTag(data: DataView):any {
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

	getNextTag(data: DataView, offsetStart: number, testForTag:boolean = false):any {
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
			//  Utils.getStringAt(data, offset, 2);
			vr = String.fromCharCode(data.getUint8(offset))
				+ String.fromCharCode(data.getUint8(offset + 1));

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

		const isPixelData = Tag.isEqual({ group, element }, TagIds.PixelData);

		if ((vr === "SQ") || ((this.level > 0) && (Parser.DATA_VRS.indexOf(vr) !== -1))) {
			value = this.parseSublist(data, offset, length, vr !== "SQ");

			if (length === Parser.UNDEFINED_LENGTH) {
				const tag = value[value.length - 1] as Tag;
				length = tag.offsetEnd! - offset;
			}
		}
		else if ((length > 0) && !testForTag) {
			if (length === Parser.UNDEFINED_LENGTH) {
				if (isPixelData) {
					length = (data.byteLength - offset);
				}
			}

			if (length > 0) {
				value = new DataView(data.buffer, data.byteOffset + offset, length);
			}
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
			littleEndian: little,
			charset: this.charset
		});

		if (tag.hasValue()) {
			if (tag.is(TagIds.TransferSyntax)) {
				const [val] = tag.value as [string];
				this.explicit = true;
				this.littleEndian = true;
				if (val === TransferSyntax.ImplicitLittle) {
					this.explicit = false;
				}
				else if (val === TransferSyntax.ExplicitBig) {
					this.littleEndian = false;
				}
				else if (val === TransferSyntax.CompressionDeflate) {
					this.needsDeflate = true;
				}
			}
			else if (tag.is(TagIds.MetaLength)) {
				const [val] = tag.value as [number];
				this.metaFinishedOffset = val + offset;
			}
			else if (tag.is(TagIds.Charset)) {
				const charsetValue = tag.value as string[];
				let charset:Charset = DefaultCharset;
				if (charsetValue.length === 2) {
					charset = `${charsetValue[0] || DefaultCharset}\\${charsetValue[1]}`;
				}
				else if (charsetValue.length === 1) {
					[charset] = charsetValue;
				}
				this.charset = charset;
			}
		}
		return tag;
	}

	parseSublist(data: DataView, offsetStart:number, length:number, raw:boolean): Array<Tag> {
		const tags = [];
		let offset = offsetStart;
		const offsetEnd = offsetStart + length;
		this.level += 1;

		if (length === Parser.UNDEFINED_LENGTH) {
			let sublistItem = this.parseSublistItem(data, offset, raw);

			while (!sublistItem.is(TagIds.SequenceDelim)) {
				tags.push(sublistItem);
				offset = sublistItem.offsetEnd || 0;
				sublistItem = this.parseSublistItem(data, offset, raw);
			}

			tags.push(sublistItem);
		}
		else {
			while (offset < offsetEnd) {
				const sublistItem = this.parseSublistItem(data, offset, raw);
				tags.push(sublistItem);
				offset = sublistItem.offsetEnd || 0;
			}
		}

		this.level -= 1;

		return tags;
	}

	parseSublistItem(data:DataView, offsetStart:number, raw:boolean): Tag {
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

			while (!tag.is(TagIds.SublistItemDelim)) {
				tags.push(tag);
				offset = tag.offsetEnd;
				tag = this.getNextTag(data, offset);
			}

			tags.push(tag);
			offset = tag.offsetEnd;
		}
		else if (raw) {
			value = new DataView(data.buffer, offset + data.byteOffset, length);
			offset += length;
		}
		else {
			const offsetEnd = offset + length;
			let tag;
			while (offset < offsetEnd) {
				tag = this.getNextTag(data, offset);
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

export default Parser;

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
	ByteType,
} from "./constants";

const getSingleValueSafely = (tag: Tag | null, index: number): any => (
	(<Array<any> | undefined> tag?.value)?.[index] || null);

const getValueSafely = (tag:Tag):TagValue => (tag?.value ?? null);
//=======================================================================================

interface IDicomObjInfo {
	tags: Record<TagStringID, Tag>
	tagsFlat: Record<TagStringID, Tag>
	littleEndian: boolean
	index: number
}


//=======================================================================================
/* It's a class that holds a bunch of tags, defining a generic Dicom object */
class DCMObject implements IDicomObjInfo {

	tags: Record<TagStringID, Tag> = {};

	tagsFlat: Record<TagStringID, Tag> = {};

	littleEndian = false;

	index = -1;

	privateDataAll: string | null = null;

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
	 * Returns a tag matching the specified group and element tuple ignoring tagsFlat
	 * @param {TagTupleID} tag - Tuple of group & elem like TagIds values
	 * @returns
	 */
	getTopLevelTag(tag: TagTupleID):Tag {
		const [group, element] = tag;
		const tagId = createTagId(group, element);
		return this.tags[tagId];
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
	getTagValueIndexed(tag: TagTupleID, index:number = 0): TagValue {
		return getSingleValueSafely(this.getTag(tag), index);
	}

	/**
	 * Returns the series description.
	 * @returns {string}
	 */
	get seriesDescription(): string {
		return this.getTagValueIndexed(TagIds.SeriesDescription) as string;
	}

	/**
	 * Returns the series instance UID.
	 * @returns {string}
	 */
	get seriesInstanceUID(): string {
		return this.getTagValueIndexed(TagIds.SeriesInstanceUid) as string;
	}

	/**
	 * Returns the series number.
	 * @returns {number}
	 */
	get seriesNumber(): number {
		return this.getTagValueIndexed(TagIds.SeriesNumber) as number;
	}

	/**
	 * Returns the echo number.
	 * @returns {number}
	 */
	get echoNumber(): number {
		return this.getTagValueIndexed(TagIds.EchoNumber) as number;
	}


	/**
	 * Returns the modality
	 * @returns {string}
	 */
	get modality(): string {
		return this.getTagValueIndexed(TagIds.Modality) as string;
	}

	// get seriesId() {
	// 	const ids = [
	// 		this.seriesDescription,
	// 		this.seriesInstanceUID,
	// 		this.seriesNumber,
	// 		this.echoNumber,
	// 		this.orientation,
	// 	].filter((id) => id != null); // remove nulls

	// 	const { columns, rows } = this;
	// 	return `${ids.join(",")} (${columns} x ${rows})`;
	// }

	/**
	 * Returns the TR.
	 * @returns {number}
	 */
	getTR(): number {
		return this.getTagValueIndexed(TagIds.Tr) as number;
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
	 * Returns the patient name.
	 * @returns {string}
	 */
	get patientName(): string {
		return this.getTagValueIndexed(TagIds.PatientName) as string;
	}

	/**
	 * Returns the patient ID.
	 * @returns {string}
	 */
	get patientID(): string {
		return this.getTagValueIndexed(TagIds.PatientId) as string;
	}

	/**
	 * Returns the study time.
	 * @returns {string}
	 */
	get studyTime(): string {
		return this.getTagValueIndexed(TagIds.StudyTime) as string;
	}

	/**
	 * Returns the transfer syntax.
	 * @returns {string}
	 */
	get transferSyntax(): TransferSyntax {
		return this.getTagValueIndexed(TagIds.TransferSyntax) as TransferSyntax;
	}

	/**
	 * Sets the tranfer syntax - so we can override it
	 */
	set transferSyntax(syntax: TransferSyntax) {
		this.getTag(TagIds.TransferSyntax).convertedValue = syntax;
	}

	/**
	 * Returns the study date.
	 * @returns {string}
	 */
	get studyDate(): string {
		return this.getTagValueIndexed(TagIds.StudyDate) as string;
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
}


export default DCMObject;
export { ByteType };

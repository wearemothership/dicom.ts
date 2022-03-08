import * as Utils from "./utilities";

const CSA2_MAGIC_NUMBER = [83, 86, 49, 48];
const NAME_LENGTH = 64;
const ELEMENT_CSA1 = 0x1010;
const ELEMENT_CSA2 = 0x1020;
const GROUP_CSA = 0x029;

export interface IPrivateDataReader {
	readHeader(): string
	readHeaderAtOffset(offset:number):string
	readTag(offset:number):number
	readString(offset:number, length:number):string
	readItem(offset:number):number
	canRead(group: number, element: number): boolean
}

/**
 * The Siemens constructor.
 * @params {ArrayBuffer} buffer
 * @type {Function}
 */
class Siemens implements IPrivateDataReader {
	output: string;

	data: DataView;

	constructor(buffer: ArrayBuffer) {
		this.output = "";
		this.data = new DataView(buffer, 0);
	}

	/**
 * Reads the Siemens header.  (See http://nipy.org/nibabel/dicom/siemens_csa.html)
 * @returns {string}
 */
	readHeader(): string {
		let match;

		try {
			if (this.data.byteLength > CSA2_MAGIC_NUMBER.length) {
				match = true;
				const { data } = this;
				for (let ctr = 0; ctr < CSA2_MAGIC_NUMBER.length; ctr += 1) {
					match = match && (data.getUint8(ctr) === CSA2_MAGIC_NUMBER[ctr]);
				}

				if (match) {
					this.readHeaderAtOffset(CSA2_MAGIC_NUMBER.length + 4);
				}
				else {
					this.readHeaderAtOffset(0);
				}
			}
		}
		catch (error) {
			console.log(error);
		}

		return this.output;
	}

	readHeaderAtOffset(offset:number):string {
		this.output += "\n";

		const numTags = Utils.swap32(this.data.getUint32(offset));

		if ((numTags < 1) || (numTags > 128)) {
			return this.output;
		}

		let newOffset = offset + 4;

		newOffset += 4; // unused

		for (let ctr = 0; ctr < numTags; ctr += 1) {
			newOffset = this.readTag(newOffset);

			if (offset === -1) {
				break;
			}
		}

		return this.output;
	}

	readTag(offset:number):number {
		const name = this.readString(offset, NAME_LENGTH);

		let newOffset = offset + NAME_LENGTH;
		newOffset += 4; // vm
		newOffset += 4;
		newOffset += 4; // syngodt

		const numItems = Utils.swap32(this.data.getUint32(offset));
		newOffset += 4;
		newOffset += 4; // unused

		this.output += (`    ${name}=`);

		for (let ctr = 0; ctr < numItems; ctr += 1) {
			newOffset = this.readItem(newOffset);
			if (newOffset === -1) {
				break;
			}
			else if ((newOffset % 4) !== 0) {
				newOffset += (4 - (newOffset % 4));
			}
		}
		this.output += ("\n");
		return offset;
	}

	readString(offset:number, length:number):string {
		let str = "";

		for (let ctr = 0; ctr < length; ctr += 1) {
			const char2 = this.data.getUint8(offset + ctr);

			if (char2 === 0) {
				break;
			}

			str += String.fromCharCode(char2);
		}
		return str;
	}

	readItem(offset:number):number {
		const itemLength = Utils.swap32(this.data.getUint32(offset));

		if ((offset + itemLength) > this.data.byteLength) {
			return -1;
		}

		const newOffset = offset + 16;

		if (itemLength > 0) {
			this.output += `${this.readString(newOffset, itemLength)} `;
		}

		return newOffset + itemLength;
	}

	/**
	 * Returns true if the specified group and element indicate this tag can be read.
	 * @param {number} group
	 * @param {number} element
	 * @returns {boolean}
	 */
	// eslint-disable-next-line class-methods-use-this
	canRead = (group: number, element: number): boolean => (
		(group === GROUP_CSA)
		&& ((element === ELEMENT_CSA1)
		|| (element === ELEMENT_CSA2))
	);
}

export default Siemens;

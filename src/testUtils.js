import crypto from "crypto";
// eslint-disable-next-line import/no-extraneous-dependencies
// import { createObjectURL, revokeObjectURL } from "blob-util";

import util from "util";

// eslint-disable-next-line no-undef
if (globalThis.window && !window.TextDecoder) {
	window.TextDecoder = util.TextDecoder;
}

const classReplacer = (key, value) => (value?.toObject?.() ?? value);

export const toJSONString = (object) => JSON.stringify(object, classReplacer);

export const shaFromJSON = (input) => crypto.createHash("sha1")
	.update(JSON.stringify(input, classReplacer))
	.digest("hex");

export const shaFromBuffer = (input) => crypto.createHash("sha1")
	.update(input)
	.digest("hex");

// if (!window.URL.createObjectURL) {
// 	window.URL.createObjectURL = createObjectURL;
// 	window.URL.revokeObjectURL = revokeObjectURL;
// }

export const anotherUsefullExport = true;

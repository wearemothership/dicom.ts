import crypto from "crypto";
// eslint-disable-next-line import/no-extraneous-dependencies
// import { createObjectURL, revokeObjectURL } from "blob-util";

export const shaFromJSON = (input) => crypto.createHash("sha1")
	.update(JSON.stringify(input))
	.digest("hex");

export const shaFromBuffer = (input) => crypto.createHash("sha1")
	.update(input)
	.digest("hex");

// if (!window.URL.createObjectURL) {
// 	window.URL.createObjectURL = createObjectURL;
// 	window.URL.revokeObjectURL = revokeObjectURL;
// }

export const anotherUsefullExport = true;

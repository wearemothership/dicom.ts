import crypto from "crypto";

export const shaFromJSON = (input) => crypto.createHash("sha1")
	.update(JSON.stringify(input))
	.digest("hex");

export const shaFromBuffer = (input) => crypto.createHash("sha1")
	.update(input)
	.digest("hex");

export const anotherUsefullExport = true;

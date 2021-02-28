import fs from "fs";
import { DICOMCanvas, FileInput, dicomjs } from ".";
import { createCanvas, loadImage } from "canvas";

describe("DICOMCanvas", () => {
	it("is truthy", () => {
		expect(DICOMCanvas).toBeTruthy();
	});
});

describe("FileInput", () => {
	it("is truthy", () => {
		expect(FileInput).toBeTruthy();
	});
});

describe("dicom.js", () => {
	it("decodes RLE files OK", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		// const canvas = createCanvas(512, 512);
		// await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
	});
});

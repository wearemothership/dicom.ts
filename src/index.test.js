import fs from "fs";
import {
	createCanvas,
	WebGLRenderingContext,
	WebGLActiveInfo,
	WebGLFramebuffer,
	WebGLBuffer,
	WebGLDrawingBufferWrapper,
	WebGLProgram,
	WebGLRenderbuffer,
	WebGLShader,
	WebGLShaderPrecisionFormat,
	WebGLTexture,
	WebGLUniformLocation
} from "node-canvas-webgl";
import { shaFromBuffer } from "./testUtils";

import { DICOMCanvas, FileInput, dicomjs } from ".";

// need to be global (as they would be in browser) for twgl to get them!
window.WebGLRenderingContext = WebGLRenderingContext;
window.WebGLActiveInfo = WebGLActiveInfo;
window.WebGLFramebuffer = WebGLFramebuffer;
window.WebGLBuffer = WebGLBuffer;
window.WebGLDrawingBufferWrapper = WebGLDrawingBufferWrapper;
window.WebGLProgram = WebGLProgram;
window.WebGLRenderbuffer = WebGLRenderbuffer;
window.WebGLShader = WebGLShader;
window.WebGLShaderPrecisionFormat = WebGLShaderPrecisionFormat;
window.WebGLTexture = WebGLTexture;
window.WebGLUniformLocation = WebGLUniformLocation;

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
	it("renders OK - RLE decode and 'contrastify' greyscale render", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("4687e84e04162daeb5f68843d1879d42b0fa6e0b");
	});

	it("renders OK - RLE decode and greyscale window render", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT2_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("d24e65e2ae675b6173dad8d4b3182f0b7a6201a4");
	});

	it("renders OK - RLE decode and RGB render", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/VL6_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("60388cc0984e94d685f985ee0e343224056afb26");
	});

	it("renders OK - greyscale with LUT descriptor", async () => {
		const data = fs.readFileSync("./test/vpop-pro.com/greyscale-with-lut.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("7ebf07de7d6db444188249c3e592be8250b20098");
	});
});

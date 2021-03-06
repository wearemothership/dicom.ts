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
	it("Renders with: RLE decode and 'contrastify' greyscale render", async () => {
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

	it("Renders with: RLE decode and greyscale window render", async () => {
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

	it("Renders with: RLE decode and RGB render", async () => {
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

	it("Renders with: uncompressed greyscale with LUT descriptor", async () => {
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

	it("Renders with: jpeg lossless", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_jpeg/IMAGES/JPLL/MR2_JPLL");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("e438e4c5a39aa15f41ead566a4fcd16ad17da94f");
	});

	it("Renders with: jpeg baseline 8bit (native decoder?)", async () => {
		const data = fs.readFileSync("./test/vpop-pro.com/jpeg-baseline.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		expect(shaFromBuffer(buffer)).toEqual("0740edb1140d933966d64754e1b9d0d01db6541c");
	});

	it("Renders with: jpeg baseline", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_jpeg/IMAGES/JPLY/MR1_JPLY");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("b195815c49a9f281746f8b377dcfa5f0c04fc3d8");
	});

	it("Renders with: jpeg LS", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_jpegls/IMAGES/JLSL/XA1_JLSL");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("83f8d3c0d12794591f23fa859b1121ee18e2fdc6");
	});

	it("Renders with: jpeg2000", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_j2k/IMAGES/J2KI/US1_J2KI");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 1);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("943302fe91302fd9ede3bb5f31b466bb403ed403");
	});
});

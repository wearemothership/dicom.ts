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
import { shaFromBuffer, shaFromJSON } from "./testUtils";

import * as dicomjs from ".";

const { DICOMCanvas, FileInput } = dicomjs;

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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);

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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		// await dicomjs.render(image, canvas, 1);
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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		expect(shaFromBuffer(buffer)).toEqual("0740edb1140d933966d64754e1b9d0d01db6541c");
	});

	it("Renders with: jpeg baseline", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_jpeg/IMAGES/JPLY/MR1_JPLY");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
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
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("83f8d3c0d12794591f23fa859b1121ee18e2fdc6");
	});

	it("Renders with: jpeg2000 lossy", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_j2k/IMAGES/J2KI/US1_J2KI");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("c03ac6dfd8cb9811d20ad0f80dd14546bfad7b86");
	});

	// issues

	it("Renders with: jpeg2000 lossless", async () => {
		const data = fs.readFileSync("./test/vpop-pro.com/jpeg-2000-lossless.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("dba60ea49c4f78556451be507ff08e1a25cfabd5");
	});

	it("Renders all frames ok, reuses program", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/multiframe/DISCIMG/IMAGES/BRMULTI");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		expect(image).toBeTruthy();
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		let sha = "";
		for (let i = 0; i < image.numberOfFrames; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await renderer.render(image, i);

			const buffer = canvas.toBuffer("image/png");
			// fs.writeFileSync(`./image${i}.png`, buffer);
			sha = shaFromJSON(sha + buffer);
		}
		expect(sha).toEqual("bb5df5c6d918959e35702f112bd5353609332bdf");
	});

	it("Resizes ok", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 0.5);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("447cba5c0bc8cc659978f94ab69e591833fa47cc");
	});

	it("Renders with palette conversion", async () => {
		const data = fs.readFileSync("./test/current-issues/US-PAL-8-10x-echo.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("c688ed677deb5d13b55314f3e22cd4e85354d2c2");
	});

	it("Renders RGB with planar configuration", async () => {
		const data = fs.readFileSync("./test/current-issues/US-RGB-8-epicard.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("f8bce5cca7c5c3f5258c524f43a037480763e167");
	});

	it("Fails gracefully when no pixel data", async () => {
		// this image fails on horos and cornerstone too, no data after parse...
		const data = fs.readFileSync("./test/medical.nema.org/multiframe/DISCIMG/IMAGES/BRFSSPC1");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		let error = null;
		try {
			await dicomjs.render(image, canvas);
		}
		catch (e) {
			error = e;
		}

		expect(image).toBeTruthy();
		expect(error.message).toEqual("Image has no data");
	});
});

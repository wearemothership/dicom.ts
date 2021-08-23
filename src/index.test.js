/* eslint-disable import/first */
import fs from "fs";
import fetch from "node-fetch";

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

// eslint-disable-next-line no-undef
if (!globalThis.fetch) {
	// eslint-disable-next-line no-undef
	globalThis.fetch = fetch;
}

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logImageTags = (image) => {
	let str = "";
	Object.keys(image.tags).forEach((key) => {
		str += image.tags[key].toString();
		str += "\n";
	});
	console.log(str);
};

describe("dicom.ts", () => {
	it("Renders with: RLE decode and 'contrastify' greyscale render", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		// let str = "";
		// Object.keys(image.tags).forEach((key) => {
		// 	str += image.tags[key].toString();
		// 	str += "\n";
		// });
		// console.log(str);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("5aa04e5e3284c640a2f16448e0a11a7a371ef23a");
	});

	it("Renders with: RLE decode and greyscale window render", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT2_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		// logImageTags(image);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("c8feb95390b3df788eb7fe227afb92e5febfb04e");
	});

	it("Renders with: RLE decode and RGB render", async () => {
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/VL6_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		// logImageTags(image);
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
		fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("07c8030befd36cd9b865c925535f6a8fe589807c");
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
		expect(shaFromBuffer(buffer)).toEqual("d4e46bed71c91bbaafd0fb796ac90e81b5294d7d");
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
		// fs.writeFileSync("./image.png", buffer);
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
		expect(shaFromBuffer(buffer)).toEqual("7aaa0be4c1ce96dc328f409ad32f219610ca2ccb");
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
		expect(shaFromBuffer(buffer)).toEqual("470d10cb08f88ecb07857892c0e58f89b9b69d28");
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
		expect(shaFromBuffer(buffer)).toEqual("f79e6eca4c29f6ad4cb152c9f2c532fbe9078c63");
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
		expect(sha).toEqual("498a9871b098ff8781187513a5a40d00e8c344dc");
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
		expect(shaFromBuffer(buffer)).toEqual("e0b8b46923d56477a32b226273bb51bfa6dc7c53");
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
		expect(shaFromBuffer(buffer)).toEqual("fa93934a7ca2b9f88cd9c14a80898aa5ed4ce70e");
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

	it("Renders with min/max pixel (no window) values", async () => {
		// this image fails on horos and cornerstone too, no data after parse...
		const data = fs.readFileSync("./test/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/NM1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("d1d0bd3240ce6861e79405498ec8716b1269beb3");
	});

	it("Renders with no transfer syntax, planar & palette size ratio", async () => {
		// this image fails on horos and cornerstone too, no data after parse...
		const data = fs.readFileSync("./test/current-issues/OT-PAL-8-face.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new dicomjs.Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(shaFromBuffer(buffer)).toEqual("add430b59b054ac6a7fd53e7ccbf103aa4fb844a");
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

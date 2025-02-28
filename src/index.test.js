/**
 * @jest-environment jsdom
 */

/* eslint-disable import/first */
/* eslint-disable no-undef */

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
import { toMatchImageSnapshot } from "jest-image-snapshot";
import util from "util";
import dicomjs, { Renderer } from ".";

const fs = require("node:fs");

// eslint-disable-next-line no-undef
if (globalThis.window && !window.TextDecoder) {
	window.TextDecoder = util.TextDecoder;
}

expect.extend({ toMatchImageSnapshot });

// /* eslint-disable */
// if (!globalThis.fetch) {
// 	globalThis.fetch = fetch;
// }

// need to be global (as they would be in browser) for twgl to get them!
if (globalThis.window) {
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
}
else {
	globalThis.WebGLRenderingContext = WebGLRenderingContext;
	globalThis.WebGLActiveInfo = WebGLActiveInfo;
	globalThis.WebGLFramebuffer = WebGLFramebuffer;
	globalThis.WebGLBuffer = WebGLBuffer;
	globalThis.WebGLDrawingBufferWrapper = WebGLDrawingBufferWrapper;
	globalThis.WebGLProgram = WebGLProgram;
	globalThis.WebGLRenderbuffer = WebGLRenderbuffer;
	globalThis.WebGLShader = WebGLShader;
	globalThis.WebGLShaderPrecisionFormat = WebGLShaderPrecisionFormat;
	globalThis.WebGLTexture = WebGLTexture;
	globalThis.WebGLUniformLocation = WebGLUniformLocation;
}
/* eslint-enable */

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
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT1_RLE");
		const image = dicomjs.parseImage(new Uint8Array(data).buffer); // use array buffer
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
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
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: RLE decode and greyscale window render", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT2_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView); // use DataView
		// logImageTags(image);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: RLE decode and RGB render", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/VL6_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		// logImageTags(image);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: uncompressed greyscale with LUT descriptor", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/vpop-pro.com/greyscale-with-lut.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: jpeg lossless", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_jpeg/IMAGES/JPLL/MR2_JPLL");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: jpeg baseline 8bit (native decoder?)", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/vpop-pro.com/jpeg-baseline.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: jpeg baseline", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_jpeg/IMAGES/JPLY/MR1_JPLY");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: jpeg LS", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_jpegls/IMAGES/JLSL/XA1_JLSL");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with: jpeg2000 lossy", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_j2k/IMAGES/J2KI/US1_J2KI");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	// issues

	it("Renders with: jpeg2000 lossless", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/vpop-pro.com/jpeg-2000-lossless.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders all frames ok, reuses program", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/multiframe/DISCIMG/IMAGES/BRMULTI");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		expect(image).toBeTruthy();
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		for (let i = 0; i < image.numberOfFrames; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await renderer.render(image, i);

			const buffer = canvas.toBuffer("image/png");
			// fs.writeFileSync(`./image${i}.png`, buffer);
			expect(buffer).toMatchImageSnapshot();
		}
	});

	it("Resizes ok", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/CT1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas, 0.5);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with palette conversion", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/dicom-ts-issues/US-PAL-8-10x-echo.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders buffer size issue #19", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/dicom-ts-issues/parse-issue-19.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders RGB with planar configuration", async () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/dicom-ts-issues/US-RGB-8-epicard.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		await dicomjs.render(image, canvas);

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with min/max pixel (no window) values", async () => {
		// this image fails on horos and cornerstone too, no data after parse...
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/compsamples_rle_20040210/IMAGES/RLE/NM1_RLE");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Renders with no transfer syntax, planar & palette size ratio", async () => {
		// this image fails on horos and cornerstone too, no data after parse...
		const data = fs.readFileSync("./node_modules/dicom-test-files/dicom-ts-issues/OT-PAL-8-face.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		await renderer.render(image, 0);
		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});

	it("Fails gracefully when no pixel data", async () => {
		// this image fails on horos and cornerstone too, no data after parse...
		const data = fs.readFileSync("./node_modules/dicom-test-files/medical.nema.org/multiframe/DISCIMG/IMAGES/BRFSSPC1");
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
		expect(error.message).toBe("Image has no data");
	});

	// issues:
	it("Renders issue #20 wrong transfer syntax in file", async () => {
		// this image fails on horos too, no data after parse...
		const data = fs.readFileSync("./node_modules/dicom-test-files/dicom-ts-issues/20-wrong-transfer-syntax.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = dicomjs.parseImage(dataView);
		const canvas = createCanvas(512, 512);
		const renderer = new Renderer(canvas);
		let error = null;
		try {
			// expect this to fail
			await renderer.render(image, 0);
			expect(false).toBeTruthy();
		}
		catch (e) {
			error = e;
			// for some reason, DCMTK movescu -> Orthanc -> storescp uncompresses,
			// but doesnt update the transfer syntax tag...should it?
			image.transferSyntax = dicomjs.TransferSyntax.ImplicitLittle;
			renderer.image = null; // make sure we re-attempt creating decoder
			await renderer.render(image, 0);
		}
		expect(error.message).toBe("No JPEG-LS image data");

		expect(image).toBeTruthy();
		const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync("./image.png", buffer);
		expect(buffer).toMatchImageSnapshot();
	});
});

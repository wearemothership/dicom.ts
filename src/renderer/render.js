// /* eslint-disable */
import * as twgl from "twgl.js";
import raw from "raw.macro";
import { Tag } from "../parser";
import { glslUnpackWordString, createTexture } from "./util";

let vertexShader = raw("./vertex.glsl");
let minMaxShader = raw("./minMax.glsl");
let contrastifyShader = raw("./contrastify.glsl");
let greyscaleShader = raw("./greyscale.glsl");
let greyscaleLUTShader = raw("./greyscaleLUT.glsl");
let colorShader = raw("./color.glsl");

const loadShader = async (shader) => fetch(`${process.env.PUBLIC_URL}/glsl/${shader}`)
	.then((response) => response.text());

let contrastify;
let greyscaleRender;
let greyscaleLUTRender;
let colorRender;

const shouldInvert = (image) => {
	let invert = image.getTagValueIndexed(Tag.TAG_LUT_SHAPE) === "INVERSE";
	invert = invert || image.photometricInterpretation === "MONOCHROME1";
	return invert;
};

const render = async (image, canvasIn, scale = 1.0) => {
	const canvas = canvasIn;
	const width = image.columns;
	const height = image.rows;

	const outputWidth = width * scale;
	const outputHeight = height * scale;

	canvas.width = outputWidth;
	canvas.height = outputHeight;

	const slope = image.getDataScaleSlope() || 1.0;
	const intercept = image.getDataScaleIntercept() || 0.0;

	const minPixVal = image.getImageMin();
	const maxPixVal = image.getImageMax();

	let windowCenter = image.getWindowCenter();
	let windowWidth = image.getWindowWidth();

	if (!vertexShader) {
		vertexShader = await loadShader("vertex.glsl");
		minMaxShader = await loadShader("minMax.glsl");
		contrastifyShader = await loadShader("contrastify.glsl");
		greyscaleShader = await loadShader("greyscale.glsl");
		greyscaleLUTShader = await loadShader("greyscaleLUT.glsl");
		colorShader = await loadShader("color.glsl");
	}

	const gl = canvas.getContext("webgl");

	let lutDescriptor = image.getTagValue(Tag.TAG_VOI_LUT_DESCRIPTOR);
	lutDescriptor = lutDescriptor && lutDescriptor.slice(0, 3);

	const invert = shouldInvert(image);

	const inColor = !(image.photometricInterpretation || "").startsWith("MONO");
	if (inColor) {
		// console.log("color image");
		// we only cope with RGB8 images (or images that are decomressed to that, e.g. jpeg
		// TODO:
		// - RGB color palettes
		// - do we need to slope / intercept?
		return colorRender({
			gl,
			image,
			width,
			height,
			invert,
			outputWidth,
			outputHeight
		});
	}

	if (windowWidth || maxPixVal) {
		if (maxPixVal && !windowWidth) {
			windowWidth = maxPixVal - minPixVal;
			windowCenter = windowWidth / 2.0;
		}
		return greyscaleRender({
			gl,
			image,
			windowWidth,
			windowCenter,
			slope,
			intercept,
			invert,
			width,
			height,
			outputWidth,
			outputHeight
		});
	}

	if (lutDescriptor) {
		const firstInputValue = lutDescriptor[1];

		let ArrayType = Uint8Array;
		if (lutDescriptor[2] > 8) {
			ArrayType = Uint16Array;
		}
		const lutDataTagValue = image.getTagValue(Tag.TAG_VOI_LUT_DATA);
		const lutData = new ArrayType(
			lutDataTagValue,
			0,
			Math.min(lutDescriptor[0] || 2 ** 16, lutDataTagValue.length)
		);
		return greyscaleLUTRender({
			gl,
			image,
			lutData,
			firstInputValue,
			invert,
			width,
			height,
			outputWidth,
			outputHeight
		});
	}
	// we have no range to work with
	// find the minMax in gpu
	return contrastify({
		gl,
		image,
		width,
		height,
		slope,
		intercept,
		invert,
		outputWidth,
		outputHeight
	});
};

contrastify = async ({
	gl,
	image,
	width,
	height,
	slope,
	intercept,
	invert,
	outputWidth,
	outputHeight
}) => {
	const ext = gl.getExtension("WEBGL_draw_buffers");
	if (!ext) {
		throw new Error("sample requires WEBGL_draw_buffers");
	}

	const cellSize = 16;

	const getWordString = glslUnpackWordString(image, false);

	const minMaxFragString = minMaxShader.replace("$(cellSize)", cellSize).replace("$(word)", getWordString);
	const minMaxProgramInfo = twgl.createProgramInfo(gl, [vertexShader, minMaxFragString]);
	const contrastProgramInfo = twgl.createProgramInfo(gl, [vertexShader, contrastifyShader.replace("$(word)", getWordString)]);

	const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

	const srcTex = await createTexture({
		gl,
		image,
		width,
		height
	});

	const framebuffers = [];
	let w = width;
	let h = height;

	while (w > 1 || h > 1) {
		// | 0 like floor but Infinity/NaN are zero'd
		// eslint-disable-next-line no-bitwise
		w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
		// eslint-disable-next-line no-bitwise
		h = Math.max(1, (h + cellSize - 1) / cellSize | 0);

		// creates a framebuffer and creates and attaches 2 RGBA/UNSIGNED textures
		const fbi = twgl.createFramebufferInfo(gl, [
			{
				format: gl.RGBA,
				min: gl.NEAREST,
				mag: gl.NEAREST,
				wrap: gl.CLAMP_TO_EDGE
			},
			{
				format: gl.RGBA,
				min: gl.NEAREST,
				mag: gl.NEAREST,
				wrap: gl.CLAMP_TO_EDGE
			},
		], w, h);
		// WebGl2
		// gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
		ext.drawBuffersWEBGL([ext.COLOR_ATTACHMENT0_WEBGL, ext.COLOR_ATTACHMENT1_WEBGL]);
		framebuffers.push(fbi);
	}

	// need separate FBs to read the output
	const lastFBI = framebuffers[framebuffers.length - 1];
	const uniforms = {
		u_srcResolution: [width, height],
		u_minTexture: srcTex,
		u_maxTexture: srcTex,
	};

	gl.useProgram(minMaxProgramInfo.program);
	twgl.setBuffersAndAttributes(gl, minMaxProgramInfo, unitQuadBufferInfo);

	w = width;
	h = height;
	framebuffers.forEach((fbi) => {
		// | 0 like floor but Infinity/NaN are zero'd
		// eslint-disable-next-line no-bitwise
		w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
		// eslint-disable-next-line no-bitwise
		h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
		uniforms.u_dstResolution = [w, h];
		twgl.bindFramebufferInfo(gl, fbi);
		twgl.setUniforms(minMaxProgramInfo, uniforms);
		twgl.drawBufferInfo(gl, unitQuadBufferInfo);

		[uniforms.u_minTexture, uniforms.u_maxTexture] = fbi.attachments;
		uniforms.u_srcResolution = [w, h];
	});

	// Read min/max pixel onto CPU - slow but might be useful
	// const minFBI = twgl.createFramebufferInfo(gl, [
	// 	{ attachment: lastFBI.attachments[0] }
	// ], 1, 1);
	// const maxFBI = twgl.createFramebufferInfo(gl, [
	// 	{ attachment: lastFBI.attachments[1] }
	// ], 1, 1);

	// const minVals = new Uint8Array(4);
	// const maxVals = new Uint8Array(4);

	// twgl.bindFramebufferInfo(gl, minFBI);
	// gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, minVals);
	// console.log("min: ", minVals[0], minVals[1], minVals[2], minVals[3]);
	// twgl.bindFramebufferInfo(gl, maxFBI);
	// gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, maxVals);
	// console.log("max: ", maxVals[0], maxVals[1], maxVals[2], maxVals[3]);

	twgl.bindFramebufferInfo(gl, null);

	gl.useProgram(contrastProgramInfo.program);

	// twgl.setBuffersAndAttributes(gl, contrastProgramInfo, unitQuadBufferInfo);
	const signed = image.pixelRepresentation;
	let interceptRatio = intercept;
	if (signed && intercept < 0) {
		interceptRatio /= (2 ** (image.bitsStored - 1));
	}
	else {
		interceptRatio /= (2 ** (image.bitsStored));
	}

	twgl.setUniforms(contrastProgramInfo, {
		u_resolution: [outputWidth, outputHeight],
		u_texture: srcTex,
		u_invert: invert,
		u_minColor: lastFBI.attachments[0],
		u_maxColor: lastFBI.attachments[1],
		u_slope: slope,
		u_intercept: interceptRatio
	});
	twgl.drawBufferInfo(gl, unitQuadBufferInfo);
	// cleanup on next runloop
	setTimeout(() => {
		framebuffers.forEach((fbi) => {
			const { attachment, framebuffer } = fbi;
			gl.deleteFramebuffer(framebuffer);
			if (attachment instanceof WebGLRenderbuffer) {
				gl.deleteRenderbuffer(attachment);
			}
			else {
				gl.deleteTexture(attachment);
			}
		});
		gl.deleteTexture(srcTex);
		gl.deleteProgram(contrastProgramInfo.program);
		gl.deleteProgram(minMaxProgramInfo.program);
	}, 0);
};

greyscaleRender = async ({
	gl,
	image,
	windowWidth,
	windowCenter,
	slope,
	intercept,
	invert,
	width,
	height,
	outputWidth,
	outputHeight
}) => {
	const getWordString = glslUnpackWordString(image);

	const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleShader.replace("$(word)", getWordString)]);
	const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

	twgl.bindFramebufferInfo(gl, null);

	gl.useProgram(programInfo.program);
	twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

	const srcTex = await createTexture({
		gl,
		image,
		width,
		height
	});

	twgl.setUniforms(programInfo, {
		u_resolution: [outputWidth, outputHeight],
		u_texture: srcTex,
		u_invert: invert,
		u_winWidth: windowWidth,
		u_winCenter: windowCenter,
		u_slope: slope,
		u_intercept: intercept
	});
	twgl.drawBufferInfo(gl, unitQuadBufferInfo);
	// cleanup on next runloop
	setTimeout(() => {
		gl.deleteTexture(srcTex);
		gl.deleteProgram(programInfo.program);
	}, 0);
};

greyscaleLUTRender = async ({
	gl,
	image,
	lutData,
	firstInputValue,
	invert,
	width,
	height,
	outputWidth,
	outputHeight
}) => {
	const getWordString = glslUnpackWordString(image);

	let format = gl.LUMINANCE_ALPHA;
	let internalFormat = gl.LUMINANCE_ALPHA;
	if (image.bitsAllocated <= 8) {
		format = gl.LUMINANCE;
		internalFormat = gl.LUMINANCE;
	}

	const programInfo = twgl.createProgramInfo(gl, [vertexShader, greyscaleLUTShader.replace("$(word)", getWordString)]);
	const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

	twgl.bindFramebufferInfo(gl, null);

	gl.useProgram(programInfo.program);
	twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

	const srcTex = await createTexture({
		gl,
		image,
		width,
		height
	});

	// 1D tex
	const lutTex = twgl.createTexture(gl, {
		src: new Uint8Array(new Uint16Array(lutData).buffer),
		width: lutData.length,
		height: 1,
		format,
		internalFormat,
		type: gl.UNSIGNED_BYTE,
		min: gl.NEAREST,
		mag: gl.NEAREST,
		wrap: gl.CLAMP_TO_EDGE,
	});

	twgl.setUniforms(programInfo, {
		u_resolution: [outputWidth, outputHeight],
		u_texture: srcTex,
		u_lutTexture: lutTex,
		u_lutWidth: lutData.length,
		u_firstInputValue: firstInputValue,
		u_invert: invert,
		u_maxValue: 2 ** image.bitsStored
	});
	twgl.drawBufferInfo(gl, unitQuadBufferInfo);
	// cleanup on next runloop
	setTimeout(() => {
		gl.deleteTexture(srcTex);
		gl.deleteTexture(lutTex);
		gl.deleteProgram(programInfo.program);
	}, 0);
};

colorRender = async ({
	gl,
	image,
	width,
	height,
	invert,
	outputWidth,
	outputHeight
}) => {
	const programInfo = twgl.createProgramInfo(gl, [vertexShader, colorShader]);
	const unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

	twgl.bindFramebufferInfo(gl, null);

	gl.useProgram(programInfo.program);
	twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

	const srcTex = await createTexture({
		gl,
		image,
		width,
		height
	});

	twgl.setUniforms(programInfo, {
		u_resolution: [outputWidth, outputHeight],
		u_texture: srcTex,
		u_invert: invert,
		// u_slope: slope,
		// u_intercept: intercept
	});
	twgl.drawBufferInfo(gl, unitQuadBufferInfo);
	// cleanup on next runloop
	setTimeout(() => {
		gl.deleteTexture(srcTex);
		gl.deleteProgram(programInfo.program);
	}, 0);
};

export default render;

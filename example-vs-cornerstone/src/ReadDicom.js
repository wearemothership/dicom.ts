import * as dicomjs from "dicom.ts";

let renderer = null;
let lastCanvas = null;

export const GPUJSInit = (canvas) => {
	if (canvas !== lastCanvas) {
		lastCanvas = canvas;
		renderer?.destroy();
		// hold on to the renderer, or 2nd render can be slow.
		renderer = new dicomjs.Renderer(canvas);

		// prime with some of the example image programs
		// jpeg-baseline.dcm is a jpeg so rgb data - use default color progaam
		renderer.primeColor({});

		// greyscale-windowed.dcm & jpeg-2000-lossless.dcm
		renderer.primeGreyscale({
			bitsAllocated: 16,
			bitsStored: 16,
			signed: false,
			littleEndian: true,
			hasLut: false,
			hasPixelPaddingValue: false,
			invert: false,
			knownWindow: true,
		});

		// greyscale-with-lut.dcm
		renderer.primeGreyscale({
			bitsAllocated: 16,
			bitsStored: 12,
			signed: false,
			littleEndian: true,
			hasLut: true,
			hasPixelPaddingValue: false,
			invert: true,
			knownWindow: false,
		});
	}
};

export const GPUJSClear = (/* buf */) => {
	renderer.clear();
};

export const GPUJSDecode = async (buf) => {
	const data = new DataView(buf);
	const imageSeries = new dicomjs.Series();
	// this will print tags to console - slooow
	// dicomjs.Parser.verbose = true;
	const image = dicomjs.parseImage(data);
	imageSeries.addImage(image);
	// now build the whole series in the correct way
	imageSeries.buildSeries();
	// extract the series' pixels as a 3D Frame Object
	const frameSets = [];
	frameSets.push(await imageSeries.getFrames());
	// imageSeries.getFrames().then((framesObj) => {
	// 	frameSets.push(framesObj);
	// });
	renderer.outputSize = [0, 0, renderer.canvas.width, renderer.canvas.height];
	renderer.setFrameSets(frameSets)
		.then(() => {
			renderer.slicingDirection = dicomjs.SliceDirection.Axial;
			renderer.cutIndex = [256, 256, 0];
			renderer.render();
		});
};

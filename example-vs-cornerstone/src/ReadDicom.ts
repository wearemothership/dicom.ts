import dicomjs, { Renderer } from "dicom.ts";

let renderer: Renderer | null = null;
let lastCanvas: HTMLCanvasElement | HTMLDivElement | null = null;

export const GPUJSInit = (canvas: HTMLCanvasElement | HTMLDivElement | null): void => {
	if (canvas !== lastCanvas) {	
		lastCanvas = canvas;
		renderer?.destroy();
		// hold on to the renderer, or 2nd render can be slow.
		renderer = new Renderer(canvas as HTMLCanvasElement);

		// prime with some of the example image programs
		// jpeg-baseline.dcm is a jpeg so rgb data - use default color progaam
		renderer.primeColor({ bitsAllocated: 8 });

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

export const GPUJSClear = (/* buf */): void => {
	renderer?.clear();
};

export const GPUJSDecode = (buf: ArrayBuffer) => {
	const data = new DataView(buf);
	// this will print tags to console - slooow
	// dicomjs.Parser.verbose = true;
	const image = dicomjs.parseImage(data);
	if (!image) {
		throw new Error("Failed to parse DICOM image");
	}
	if (!renderer) {
		throw new Error("Renderer not initialized");
	}
	renderer.outputSize = { width: image.columns, height: image.rows };
	return renderer.render(image, 0);
};

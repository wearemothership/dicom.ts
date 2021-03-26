
import * as dicomjs from "dicom.js"

let renderer = null;
let lastCanvas = null;

export const GPUJSInit = (canvas) => {
	if (canvas !== lastCanvas) {
		lastCanvas = canvas;
		renderer?.destroy();
		// hold on to the renderer, or 2nd render can be slow.
		renderer = new dicomjs.Renderer(canvas);
	}
}


export const GPUJSDecode = (buf) => {
	const data = new DataView(buf);
	// this will print tags to console - slooow
	// dicomjs.Parser.verbose = true;
	const image = dicomjs.parseImage(data);

	return renderer.render(image, 0);
};

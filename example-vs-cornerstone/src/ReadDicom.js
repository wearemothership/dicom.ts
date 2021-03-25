
import * as dicomjs from "dicom.js"

let renderer = null;
let lastCanvas = null;

export const GPUJSDecode = (buf, canvas) => {
	const data = new DataView(buf);
	// this will print tags to console - slooow
	// dicomjs.Parser.verbose = true;
	const image = dicomjs.parseImage(data);
	if (canvas !== lastCanvas) {
		lastCanvas = canvas;
		renderer?.destroy();
		// hold on to the renderer, or 2nd render can be slow.
		renderer = new dicomjs.Renderer(canvas);
	}
	return renderer.render(image, 0);
};

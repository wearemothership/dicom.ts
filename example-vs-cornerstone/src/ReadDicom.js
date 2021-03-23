// /* eslint-disable */
import * as dicomjs from "dicom.js"

export const GPUJSDecode = (buf, canvas) => {
	const data = new DataView(buf);
	// dicomjs.Parser.verbose = true;
	const image = dicomjs.parseImage(data);
	// const w = image.getCols();
	// const h = image.getRows();
	// const scale = Math.min(1, Math.min(4096 / w, 4096 / h));
	// const scale = 1.0;
	const renderer = new dicomjs.Renderer(canvas);
	return renderer.render(image, 0);
};

import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as cornerstoneFileImageLoader from "cornerstone-file-image-loader";
import * as dicomParser from "dicom-parser";

cornerstoneFileImageLoader.external.cornerstone = cornerstone;
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export const CornerstoneInit = (/* div */) => {
	// cornerstone.enable(div);
};

export const CornerstoneClear = (div) => {
	cornerstone.disable(div);
};

export const CornerstoneDecode = (buffer, div) => new Promise((resolve, reject) => {
	if (!buffer) {
		return reject(Error("No file!"));
	}
	// cornerstone.disable(div); // reset size...better way of doing this?
	cornerstone.enable(div);

	const onRendered = () => {
		div.removeEventListener("cornerstoneimagerendered", onRendered);
		resolve();
	};

	div.addEventListener("cornerstoneimagerendered", onRendered);

	const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(buffer);
	return cornerstone.loadImage(imageId).then((image) => {
		const [canvas] = div.children;
		canvas.width = image.columns;
		canvas.height = image.rows;
		return cornerstone.displayImage(div, image);
	}).catch(reject);
});

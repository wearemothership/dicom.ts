import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as cornerstoneFileImageLoader from "cornerstone-file-image-loader";
import * as dicomParser from "dicom-parser";

cornerstoneFileImageLoader.external.cornerstone = cornerstone;
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export const CornerstoneInit = (/* div: HTMLDivElement */): void => {
	// cornerstone.enable(div);
};

export const CornerstoneClear = (div: HTMLDivElement | HTMLCanvasElement | null): void => {
	cornerstone.disable(div);
};

export const CornerstoneDecode = (buffer: ArrayBuffer, div: HTMLDivElement | HTMLCanvasElement | null): Promise<void> => new Promise((resolve, reject) => {
	if (!buffer) {
		reject(Error("No file!"));
	}
	// cornerstone.disable(div); // reset size...better way of doing this?
	cornerstone.enable(div);

	const onRendered = (): void => {
		div?.removeEventListener("cornerstoneimagerendered", onRendered);
		resolve();
	};

	div?.addEventListener("cornerstoneimagerendered", onRendered);

	const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(buffer);
	cornerstone.loadImage(imageId).then((image: unknown) => {
		if (!image || typeof image !== 'object' || !('columns' in image) || !('rows' in image)) {
			throw new Error('Invalid image object');
		}
		const [canvas] = div?.children as HTMLCollectionOf<HTMLCanvasElement>;
		canvas.width = image.columns as number;
		canvas.height = image.rows as number;
		return cornerstone.displayImage(div, image);
	}).catch(reject);
});

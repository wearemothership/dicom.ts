import Renderer from "./renderer/Renderer";
import {
	Parser,
	Series,
	parseImage,
	DCMImage
} from "./parser";
import DICOMCanvas from "./components/DICOMCanvas";
import FileInput from "./components/FileInput";
import { ImageSize } from "./image/Types";

const render = async (
	image: DCMImage,
	canvas: HTMLCanvasElement,
	scale: number = 1.0
): Promise<void> => {
	if (!image) {
		return Promise.reject(Series.parserError);
	}
	const renderer = new Renderer(canvas);

	const outSize = new ImageSize(image).scale(scale);
	renderer.outputSize = outSize;
	setTimeout(() => {
		renderer.destroy();
	});
	await renderer.render(image, 0);
	renderer.destroy();
	return Promise.resolve();
};

export {
	parseImage,
	render,
	Renderer,
	Parser,
	// parserError: Series.parserError,
	DICOMCanvas,
	FileInput
};

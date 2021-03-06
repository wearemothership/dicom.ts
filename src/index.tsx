// @ts-ignore
import Renderer from "./renderer";
// @ts-ignore
import { Parser, Series, parseImage } from "./parser";
// @ts-ignore
import DICOMCanvas from "./components/DICOMCanvas";
// @ts-ignore
import FileInput from "./components/FileInput";

export const dicomjs = {
	Renderer,
	render: Renderer.render,
	Parser,
	parseImage,
	parserError: Series.parserError
};

export {
	DICOMCanvas,
	FileInput
};

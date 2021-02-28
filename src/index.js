import Renderer from "./renderer";
import { Parser, Series, parseImage } from "./parser";
import DICOMCanvas from "./components/DICOMCanvas";
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

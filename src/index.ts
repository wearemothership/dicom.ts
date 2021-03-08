import Renderer from "./renderer/Renderer";
import { Parser, Series, parseImage } from "./parser";
import DICOMCanvas from "./components/DICOMCanvas";
import FileInput from "./components/FileInput";

export const dicomjs = {
	Renderer,
	Parser,
	parseImage,
	parserError: Series.parserError
};

export {
	DICOMCanvas,
	FileInput
};

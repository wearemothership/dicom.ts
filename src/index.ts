import Renderer, { render } from "./renderer/Renderer";
import {
	Parser,
	parseImage,
} from "./parser";
import DICOMCanvas from "./components/DICOMCanvas";
import FileInput from "./components/FileInput";
import DICOMJSRenderer from "./components/DICOMJSRenderer";

export {
	parseImage,
	render,
	Renderer,
	Parser,
	// parserError: Series.parserError,
	DICOMCanvas,
	FileInput,
	DICOMJSRenderer
};

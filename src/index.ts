import Renderer, { render } from "./renderer/Renderer";
import {
	TransferSyntax,
	Parser,
	parseImage,
} from "./parser";

const dicomts = {
	TransferSyntax,
	parseImage,
	render,
	Renderer,
	Parser
};

export default dicomts;

export {
	Renderer,
	Parser
};

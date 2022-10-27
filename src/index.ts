

import { DCMImage } from "./parser";
import Series from "./image/series";

import ImageRenderer  from "./renderer/Renderer";
import {IFrameInfo} from "./image/Types";

import {
	TransferSyntax,
	Parser,
	parseImage,
} from "./parser";

export {
	TransferSyntax,
	parseImage,
	ImageRenderer,
	Parser,
	Series,
	DCMImage
};
 export type { IFrameInfo };
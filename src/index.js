import React from "react";
import styles from "./styles.module.css";

import Renderer from "./renderer";
import { Parser, Series, parseImage } from "./parser";
import { DICOMCanvas, DICOMDiv } from "./components/DICOMCanvas";
import FileInput from "./components/FileInput";

export const dicomjs = {
	Renderer,
	render: Renderer.render,
	Parser,
	parseImage,
	parserError: Series.parserError
};

export const ExampleComponent = ({ text }) => (
	<div className={styles.test}>
		Example Component:
		{text}
	</div>
);

export {
	DICOMCanvas,
	DICOMDiv,
	FileInput
};

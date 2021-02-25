/* eslint-disable */
import "./App.css";
import { DICOMCanvas, DICOMDiv, FileInput } from "dicom.js";
import React, { useEffect, useState, useRef } from "react";
import readFile, { CPUDecode, NewDecode } from "./ReadDicom";
import CornerstoneDecode from "./CornerstoneDecoder";
import { addExtensionsToContext } from "twgl.js";

const renderQ = [];

const Renderer = ({
	renderMethod,
	fileBuffer,
	children
}) => {
	const [renderTime, setRenderTime] = useState(null);
	const canvasRef = useRef();
	useEffect(() => {
		if (fileBuffer) {
			renderQ.push(() => {
				const startTime = new Date();
				renderMethod(fileBuffer, canvasRef.current).then(() => {
					setRenderTime(new Date() - startTime);
					renderQ.shift();
					if (renderQ.length) {
						renderQ[0]();
					}
				});
			});
			if (renderQ.length === 1) {
				renderQ[0]();
			}
		}
		return	() => {};
	}, [fileBuffer, renderMethod]);

	return (
		<>
			{
				React.Children.map(
					children,
					(element) => React.cloneElement(
						element,
						{ renderTime, canvasRef }
					)
				)
			}
		</>
	);
};

const CPURenderer = ({ fileBuffer, children }) => (
	<Renderer renderMethod={CPUDecode} fileBuffer={fileBuffer}>
		{children}
	</Renderer>
);

const GPURenderer = ({ fileBuffer, children }) => (
	<Renderer renderMethod={NewDecode} fileBuffer={fileBuffer}>
		{children}
	</Renderer>
);

const CornerstoneRenderer = ({ fileBuffer, file, children }) => (
	<Renderer renderMethod={CornerstoneDecode} fileBuffer={fileBuffer} file={file}>
		{ children }
	</Renderer>
);

function App() {
	const [fileBuffer, setFileBuffer] = useState(null);
	const fileSelected = (f) => {
		readFile(f).then((buff) => {
			setFileBuffer(buff);
		});

	};
	return (
		<div className="App">
			<header className="App-header">
				Select file:
				<FileInput onFileSelected={fileSelected} />
				{/* <div style={{ display: "flex" }}>
					<CPURenderer fileBuffer={fileBuffer}>
						<DICOMCanvas heading="No GPU" />
					</CPURenderer>

				</div> */}
				<div style={{ height: "50px" }} />
				<div style={{ display: "flex" }}>
					<GPURenderer fileBuffer={fileBuffer}>
						<DICOMCanvas heading="dicom.js" />
					</GPURenderer>
					<CornerstoneRenderer fileBuffer={fileBuffer}>
						<DICOMDiv heading="Cornerstone.js" />
					</CornerstoneRenderer>
				</div>
			</header>
		</div>
	);
}

export default App;

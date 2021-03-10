/* eslint-disable */
import "./App.css";
import cornerstone from "cornerstone-core";
import { DICOMCanvas, FileInput } from "dicom.js";
import React, { useEffect, useState, useRef } from "react";
import { GPUJSDecode } from "./ReadDicom";
import CornerstoneDecode from "./CornerstoneDecoder";
import { addExtensionsToContext } from "twgl.js";

const renderQ = [];


const DICOMDiv = ({
	heading,
	id,
	renderTime,
	canvasRef,
	width = 512,
	height = 512
}) => {
	useEffect(() => {
		const last = canvasRef.current;
		if (canvasRef.current) {
			cornerstone.enable(canvasRef.current);
		}
		return () => {
			cornerstone.disable(last);
		};
	}, [canvasRef]);

	return (
		<div style={{ display: "inline-block" }}>
			<div>{heading}</div>
			<div
				ref={canvasRef}
				id={id}
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			/>
			<div>{ (renderTime && `${renderTime}ms`) || ""}</div>
		</div>
	);
};

const DICOMWrapper = ({
	heading = "",
	id,
	renderTime = null,
	canvasRef,
	width = 512,
	height = 512
}) => (
	(
		<div style={{ display: "inline-block" }}>
			<div>{heading}</div>
			<DICOMCanvas heading={heading} id={id} canvasRef={canvasRef} width={width} height={height} />
			<div>{ (renderTime && `${renderTime}ms`) || ""}</div>
		</div>
	)
);

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

const GPURenderer = ({ fileBuffer, children }) => (
	<Renderer renderMethod={GPUJSDecode} fileBuffer={fileBuffer}>
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
	const fileSelected = (buff) => {
		setFileBuffer(buff);
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
						<DICOMWrapper heading="dicom.js" />
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

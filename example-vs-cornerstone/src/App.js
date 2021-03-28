/* eslint-disable */
import "./App.css";
import cornerstone from "cornerstone-core";
import { DICOMCanvas, FileInput } from "./components";
import { Flex } from "./components/Flex";
import React, { useEffect, useState, useRef } from "react";
import { GPUJSClear, GPUJSDecode, GPUJSInit } from "./ReadDicom";
import { CornerstoneClear, CornerstoneDecode, CornerstoneInit } from "./CornerstoneDecoder";
import { addExtensionsToContext } from "twgl.js";

const renderQ = [];

const Status = ({
	renderTime,
	renderState

}) => {
	if (!renderState) {
		return <div />;
	}
	if (renderState === "complete") {
		return <div>{ (renderTime && `${renderTime}ms`) || "loading..."}</div>;
	}
	if (renderState === "error") {
		return "error";
	}
	if (renderState === "waiting") {
		return "waiting..."
	}
	else {
		return "loading...";
	}
}

const DICOMDiv = ({
	heading,
	id,
	renderTime,
	renderState,
	canvasRef,
	width = 300,
	height = 300
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
		<Flex
			flex="1"
		>
			<h4>{heading}</h4>
			<div
				ref={canvasRef}
				id={id}
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			/>
			<Status renderTime={renderTime} renderState={renderState}/>
		</Flex>
	);
};

const DICOMWrapper = ({
	heading = "",
	id,
	renderTime = null,
	renderState = null,
	canvasRef,
	width = 300,
	height = 300
}) => (
	(
		<Flex
			flex="1"
			margin="0 0 2em 0"
		>
			<h4>{heading}</h4>
			<div
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			>
				<DICOMCanvas id={id} canvasRef={canvasRef} width={width} height={height} />
			</div>
			<Status renderTime={renderTime} renderState={renderState}/>
		</Flex>
	)
);

const Renderer = ({
	initMethod,
	clearMethod,
	renderMethod,
	fileBuffer,
	children
}) => {
	const [renderTime, setRenderTime] = useState(null);
	const [renderState, setRenderState] = useState(null);
	const canvasRef = useRef();
	useEffect(() => {
		if (fileBuffer) {
			clearMethod(canvasRef.current);
			setRenderState("waiting");
			renderQ.push(() => {
				setRenderTime(null);
				setRenderState("loading");
				const startTime = new Date();
				renderMethod(fileBuffer, canvasRef.current).then(() => {
					setRenderTime(new Date() - startTime);
					setRenderState("complete");
					renderQ.shift();
					if (renderQ.length) {
						renderQ[0]();
					}
				})
				.catch((e) => {
					setRenderState("error");
					console.error(e);
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
	}, [fileBuffer, renderMethod, clearMethod]);

	useEffect(() => {
		initMethod?.(canvasRef.current)
		return () => {};
	}, [canvasRef && canvasRef.current])

	return (
		<>
			{
				React.Children.map(
					children,
					(element) => React.cloneElement(
						element,
						{ renderTime, canvasRef, renderState }
					)
				)
			}
		</>
	);
};

const GPURenderer = ({ fileBuffer, children }) => (
	<Renderer renderMethod={GPUJSDecode} fileBuffer={fileBuffer} initMethod={GPUJSInit} clearMethod={GPUJSClear}>
		{children}
	</Renderer>
);

const CornerstoneRenderer = ({ fileBuffer, file, children }) => (
	<Renderer
		renderMethod={CornerstoneDecode}
		fileBuffer={fileBuffer}
		file={file}
		initMethod={CornerstoneInit} clearMethod={CornerstoneClear}
	>
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
			<section>
				<Flex>
					<h1>dicom.js</h1>
					A small, super-fast javascript DICOM renderer.
				</Flex>
			</section>

			<section>
				<Flex>
					<FileInput onFileSelected={fileSelected} />
					{/* <div style={{ display: "flex" }}>
						<CPURenderer fileBuffer={fileBuffer}>
							<DICOMCanvas heading="No GPU" />
						</CPURenderer>
					</div> */}
				</Flex>
			</section>

			<section>
				<Flex
					flexDirection="row"
					flexWrap="wrap"
					justifyContent="center"
					width="100%"
				>
					<GPURenderer fileBuffer={fileBuffer}>
						<DICOMWrapper heading="dicom.js" />
					</GPURenderer>
					<CornerstoneRenderer fileBuffer={fileBuffer}>
						<DICOMDiv heading="Cornerstone.js" />
					</CornerstoneRenderer>
				</Flex>
			</section>

		</div>
	);
}

export default App;

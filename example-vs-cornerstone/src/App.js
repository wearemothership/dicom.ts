/* eslint-disable */
import "./App.css";
import cornerstone from "cornerstone-core";
import { DICOMCanvas, FileInput } from "./components";
import { Flex } from "./components/Flex";
import React, { useEffect, useState, useRef } from "react";
import { GPUJSDecode, GPUJSInit } from "./ReadDicom";
import { CornerstoneDecode, CornerstoneInit } from "./CornerstoneDecoder";
import { addExtensionsToContext } from "twgl.js";
import CopyIcon from './copyIcon.png';

const renderQ = [];



const DICOMDiv = ({
	heading,
	id,
	renderTime,
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
			margin="0 0 0 20px"
		>
			<h4>{heading}</h4>
			<div className="canvas-container">
			<div
				ref={canvasRef}
				id={id}
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			/>
			</div>
			<div>{ (renderTime && `${renderTime}ms`) || ""}</div>
		</Flex>
	);
};

const DICOMWrapper = ({
	heading = "",
	id,
	renderTime = null,
	canvasRef,
	width = 300,
	height = 300
}) => (
	(
		<Flex
			flex="1"
		>
			<h4>{heading}</h4>
			<div className="canvas-container">
				<DICOMCanvas id={id} canvasRef={canvasRef} width={width} height={height} />
			</div>
			<div>{ (renderTime && `${renderTime}ms`) || ""}</div>
		</Flex>
	)
);

const Renderer = ({
	initMethod,
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
				})
				.catch((e) => {
					console.error(e);
				});
			});
			if (renderQ.length === 1) {
				renderQ[0]();
			}
		}
		return	() => {};
	}, [fileBuffer, renderMethod]);

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
						{ renderTime, canvasRef }
					)
				)
			}
		</>
	);
};

const GPURenderer = ({ fileBuffer, children }) => (
	<Renderer renderMethod={GPUJSDecode} fileBuffer={fileBuffer} initMethod={GPUJSInit}>
		{children}
	</Renderer>
);

const CornerstoneRenderer = ({ fileBuffer, file, children }) => (
	<Renderer renderMethod={CornerstoneDecode} fileBuffer={fileBuffer} file={file} initMethod={CornerstoneInit}>
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
					<p>A small, super-fast javascript DICOM renderer.</p>
					<Flex flexDirection="row">
						<button a href="https://github.com/wearemothership/dicom.js" className="yellow">View on Github</button>
						<button className="blue"><img src={CopyIcon}></img>npm install --save dicom.js</button>
					</Flex>
				</Flex>
			</section>

			<section>
				<Flex
					flexDirection="row"
					alignItems="center"
					flexWrap="wrap"
				>
					<button id="example1" className="selected">jpeg-baseline.dcm</button>
					<button id="example2" className="">jpeg-2000-lossless.dcm</button>
					<button id="example3" className="">greyscale-with-lut.dcm</button>
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
					alignItems="center"
					flexWrap="wrap"
				>
					<small>dicom.js v cornerstone.js comparison: &nbsp;</small>
					<button id="on" className="">On</button>
					<button id="off" className="selected">Off</button>
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
					{/* <CornerstoneRenderer fileBuffer={fileBuffer}>
						<DICOMDiv heading="Cornerstone.js" />
					</CornerstoneRenderer> */}
				</Flex>
			</section>

			<section>
				<Flex
					flexDirection="row"
					alignItems="center"
					flexWrap="wrap"
				>
					<small><a href="https://wearemothership.com">Made by Mothership</a></small>
				</Flex>
			</section>

		</div>
	);
}

export default App;

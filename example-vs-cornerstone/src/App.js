/* eslint-disable */
import "./App.css";
import cornerstone from "cornerstone-core";
import { DICOMCanvas, FileInput } from "./components";
import { Flex } from "./components/Flex";
import React, { useEffect, useState, useRef, } from "react";
import {
	HashRouter as Router,
	Switch,
	Route,
	Link,
	useHistory,
	createBrowserHistory
  } from "react-router-dom";
import { GPUJSClear, GPUJSDecode, GPUJSInit } from "./ReadDicom";
import { CornerstoneClear, CornerstoneDecode, CornerstoneInit } from "./CornerstoneDecoder";
import { addExtensionsToContext } from "twgl.js";
import { GoClippy, GoMarkGithub, GoDashboard, GoSync, GoAlert, GoFileMedia } from "react-icons/go";

const renderQ = [];

const baseUrl = "/dicom.js"

const Status = ({
	renderTime,
	renderState

}) => {
	if (!renderState) {
		return <div />;
	}
	if (renderState === "complete") {
		return <div>{ (renderTime && `<GoDashboard /> ${renderTime}ms`) || "<GoSync /> loading..."}</div>;
	}
	if (renderState === "error") {
		return "<GoAlert /> error";
	}
	if (renderState === "waiting") {
		return "<GoSync /> waiting..."
	}
	else {
		return "<GoSync /> loading...";
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
			margin="0 0 0 20px"
		>
			<h4>{heading}</h4>
			<div
				className="canvas-container"
				ref={canvasRef}
				id={id}
				// style={{height: `${height}px` }}
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
		>
			<h4>{heading}</h4>
			<div className="canvas-container">
				<DICOMCanvas id={id} canvasRef={canvasRef} width={width} height={height} />
			</div>
			<Status renderTime={renderTime} renderState={renderState} />
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

const ExampleFileButton = ({fileName, selectedFile, loadFile}) => {
	const url = `static/${fileName}`;
	const selected = fileName === selectedFile;
	return <button onClick={() => loadFile(fileName)} className={selected ? "selected" : ""}><GoFileMedia /> {fileName}</button>
}

const Example = (props) => {
	const history = useHistory();
	const [fileBuffer, setFileBuffer] = useState(null);
	const [fileName, setFileName] = useState(null);
	const [copied, setCopied] = useState(false);
	const { cornerstone } = props;
	const copyText = () => {
		navigator.clipboard.writeText("npm install --save dicom.js");
		setCopied(true);
		setTimeout(() => {
			setCopied(false);
		}, 2000);
	}
	const fileSelected = (buff) => {
		setFileBuffer(buff);
	};

	const loadFile = (file) => {
		setFileName(file);
		fetch(`${baseUrl}/static/${file}`).then((response) => response.arrayBuffer().then(setFileBuffer));
	}

	return (
	<div className="App">
		<section>
			<Flex>
				<h1>dicom.js</h1>
				<p>A small, super-fast javascript DICOM renderer.</p>
				<Flex
					flexDirection="row"
					alignItems="center"
				>
					<button onClick={() =>  window.location.href="https://github.com/wearemothership/dicom.js"} className="yellow"><GoMarkGithub /> View on Github</button>
					<button className="blue"  onClick={copyText}><GoClippy /> npm install --save dicom.js</button>
					{copied && <small>Copied…</small>}
				</Flex>
			</Flex>
		</section>

		<section>
			<Flex
				flexDirection="row"
				alignItems="center"
				flexWrap="wrap"
			>
				<div className="buttons">
					<ExampleFileButton fileName="jpeg-baseline.dcm" selectedFile={fileName} loadFile={loadFile}/>
					<ExampleFileButton fileName="jpeg-2000-lossless.dcm" selectedFile={fileName} loadFile={loadFile}/>
					<ExampleFileButton fileName="greyscale-with-lut.dcm" selectedFile={fileName} loadFile={loadFile}/>
				</div>
				<FileInput onFileSelected={fileSelected} />
			</Flex>
		</section>

		<section>
			<Flex
				flexDirection="row"
				alignItems="center"
				flexWrap="wrap"
			>
				<small>dicom.js v cornerstone.js comparison: &nbsp;</small>
				<div className="buttons">
					<button id="on" onClick={() => {history.push("/vs-cornerstone")}} className={cornerstone ? "selected" : ""}>On</button>
					<button id="off" onClick={() => {history.push("/")}} className={cornerstone ? "" : "selected"}>Off</button>
				</div>
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

				{cornerstone && <CornerstoneRenderer fileBuffer={fileBuffer}>
					<DICOMDiv heading="Cornerstone.js" />
				</CornerstoneRenderer>}
			</Flex>
		</section>

		<section>
			<Flex
				flexDirection="row"
				alignItems="center"
				flexWrap="wrap"
			>
				<Link to={"https://wearemothership.com"} onClick={ () => window.location.href="https://wearemothership.com" }><small>Made by Mothership</small></Link>
			</Flex>
		</section>

	</div>);
}

function App() {
	return (
		<Router>
			<Switch>
          		<Route path="/vs-cornerstone" children={<Example cornerstone={true}/>} />
				<Route component={Example} />
			</Switch>
		</Router>
	);
}

export default App;

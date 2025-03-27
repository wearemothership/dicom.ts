/* eslint-disable */
import "./App.css";
import cornerstone from "cornerstone-core";
import DICOMCanvas from "./components/DICOMCanvas";
import FileInput from "./components/FileInput";
import Flex from "./components/Flex";
import React, { useEffect, useState, useRef, ReactElement } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate
} from "react-router-dom";
import { GPUJSClear, GPUJSDecode, GPUJSInit } from "./ReadDicom";
import { CornerstoneClear, CornerstoneDecode, CornerstoneInit } from "./CornerstoneDecoder";
import { FaGithub } from "react-icons/fa";
import { MdSpeed } from "react-icons/md";
import { GoRepo, GoSync, GoAlert, GoFileMedia } from "react-icons/go";
import { createRoot } from 'react-dom/client';

const renderQ: (() => void)[] = [];

interface StatusProps {
  renderTime: number | null;
  renderState: string | null;
}

interface DICOMDivProps {
  heading?: string;
  id?: string;
  renderTime?: number | null;
  renderState?: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | HTMLDivElement>;
  width?: number;
  height?: number;
}

interface DICOMWrapperProps extends DICOMDivProps {}

interface RendererProps {
  initMethod?: (element: HTMLCanvasElement | HTMLDivElement | null) => void;
  clearMethod: (element: HTMLCanvasElement | HTMLDivElement | null) => void;
  renderMethod: (buffer: ArrayBuffer, element: HTMLCanvasElement | HTMLDivElement | null) => Promise<void>;
  fileBuffer: ArrayBuffer | null | undefined;
  children: ReactElement | ReactElement[];
}

interface GPURendererProps {
  fileBuffer: ArrayBuffer | null | undefined;
  children: ReactElement | ReactElement[];
}

interface CornerstoneRendererProps extends GPURendererProps {
  file?: File;
}

interface ExampleFileButtonProps {
  fileName: string;
  selectedFile: string | null;
  loadFile: (fileName: string) => void;
}

interface ExampleProps {
  cornerstone?: boolean;
}

const Status: React.FC<StatusProps> = ({ renderTime, renderState }) => {
  if (!renderState) {
    return <Flex flexDirection="row" alignItems="center"></Flex>;
  }
  if (renderState === "downloading") {
    return (
      <Flex flexDirection="row" alignItems="center">
        <GoSync />Downloading...
      </Flex>
    );
  }
  if (renderState === "complete") {
    return (
      <Flex flexDirection="row" alignItems="center">
        <MdSpeed />&nbsp;{renderTime}ms
      </Flex>
    );
  }
  if (renderState === "error") {
    return (
      <Flex flexDirection="row" alignItems="center">
        <GoAlert />&nbsp;Error
      </Flex>
    );
  }
  if (renderState === "waiting") {
    return (
      <Flex flexDirection="row" alignItems="center">
        <GoSync />&nbsp;Waiting...
      </Flex>
    );
  }
  return (
    <Flex flexDirection="row" alignItems="center">
      <GoSync />&nbsp;Decode / Render...
    </Flex>
  );
};

const DICOMDiv: React.FC<DICOMDivProps> = ({
  heading,
  id,
  renderTime = null,
  renderState = null,
  canvasRef
}) => {
  useEffect(() => {
    const last = canvasRef.current;
    if (canvasRef.current) {
      cornerstone.enable(canvasRef.current);
    }
    return () => {
      if (last) cornerstone.disable(last);
    };
  }, [canvasRef]);

  return (
    <Flex flex="1">
      <h4>{heading}</h4>
      <div className="canvas-container">
        <div
          className="cornerstone-container"
          ref={canvasRef as React.RefObject<HTMLDivElement>}
          id={id}
        />
      </div>
      <Status renderTime={renderTime} renderState={renderState} />
    </Flex>
  );
};

const DICOMWrapper: React.FC<DICOMWrapperProps> = ({
  heading = "",
  id = "",
  renderTime = null,
  renderState = null,
  canvasRef,
  width = 300,
  height = 300
}) => (
  <Flex flex="1">
    <h4>{heading}</h4>
    <div className="canvas-container">
      <DICOMCanvas id={id} canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>} width={width} height={height} />
    </div>
    <Status renderTime={renderTime} renderState={renderState} />
  </Flex>
);

const Renderer: React.FC<RendererProps> = ({
  initMethod,
  clearMethod,
  renderMethod,
  fileBuffer,
  children
}) => {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [renderState, setRenderState] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | HTMLDivElement>(null);

  useEffect(() => {
    if (fileBuffer) {
      clearMethod(canvasRef.current);
      setRenderState("waiting");
      renderQ.push(() => {
        setRenderTime(null);
        setRenderState("loading");
        const startTime = new Date();
        renderMethod(fileBuffer, canvasRef.current)
          .then(() => {
            setRenderTime(new Date().getTime() - startTime.getTime());
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
    } else if (fileBuffer === null) {
      setRenderState("downloading");
    }
    return () => {};
  }, [fileBuffer, renderMethod, clearMethod]);

  useEffect(() => {
    if (initMethod && canvasRef.current) {
      initMethod(canvasRef.current);
    }
    return () => {};
  }, [canvasRef.current, initMethod]);

  return (
    <>
      {React.Children.map(children, (element) =>
        React.cloneElement(element as ReactElement, {
          renderTime,
          canvasRef,
          renderState,
        })
      )}
    </>
  );
};

const GPURenderer: React.FC<GPURendererProps> = ({ fileBuffer, children }) => (
  <Renderer
    renderMethod={GPUJSDecode}
    fileBuffer={fileBuffer}
    initMethod={GPUJSInit}
    clearMethod={GPUJSClear}
  >
    {children}
  </Renderer>
);

const CornerstoneRenderer: React.FC<CornerstoneRendererProps> = ({
  fileBuffer,
  children,
}) => (
  <Renderer
    renderMethod={CornerstoneDecode}
    fileBuffer={fileBuffer}
    initMethod={CornerstoneInit}
    clearMethod={CornerstoneClear}
  >
    {children}
  </Renderer>
);

const ExampleFileButton: React.FC<ExampleFileButtonProps> = ({
  fileName,
  selectedFile,
  loadFile,
}) => {
  const selected = fileName === selectedFile;
  return (
    <button
      onClick={() => loadFile(fileName)}
      className={selected ? "selected" : ""}
    >
      <GoFileMedia /> {fileName}
    </button>
  );
};

const Example: React.FC<ExampleProps> = (props) => {
  const navigate = useNavigate();
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null | undefined>(undefined);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { cornerstone } = props;
  const canvasRef = useRef<HTMLDivElement>(null);

  const copyText = () => {
    navigator.clipboard.writeText("npm install --save dicom.ts");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const fileSelected = (buff: ArrayBuffer) => {
    setFileBuffer(buff);
  };

  const loadFile = (file: string) => {
    setFileName(file);
    setFileBuffer(null);
    fetch(`images/${file}`)
      .then((response) => response.arrayBuffer().then(setFileBuffer))
      .catch((error) => console.error(error));
  };

  // Rest of the Example component remains the same, just with proper typing
  return (
    <div className="App">
		<section>
			<Flex>
				<h1>dicom.ts</h1>
				<p>A small, super-fast javascript DICOM renderer.</p>
				<Flex
					flexDirection="row"
					alignItems="center"
				>
					<button onClick={() =>  window.location.href="https://github.com/wearemothership/dicom.ts"} className="yellow"><FaGithub /> View on Github</button>
					<button className="blue"  onClick={copyText}><GoRepo /> npm install --save dicom.ts</button>
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
					<ExampleFileButton fileName="greyscale-windowed.dcm" selectedFile={fileName} loadFile={loadFile}/>
          <ExampleFileButton fileName="rle-color.dcm" selectedFile={fileName} loadFile={loadFile}/>
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
				<small>dicom.ts v cornerstone.js comparison: &nbsp;</small>
				<div className="buttons">
					<button id="on" onClick={() => {navigate("/vs-cornerstone")}} className={cornerstone ? "selected" : ""}>On</button>
					<button id="off" onClick={() => {navigate("/")}} className={cornerstone ? "" : "selected"}>Off</button>
				</div>
			</Flex>
		</section>

		<section>
			<Flex
				flexDirection="row"
				justifyContent="center"
				width="100%"
			>
				<GPURenderer fileBuffer={fileBuffer}>
					<DICOMWrapper heading="dicom.ts" canvasRef={canvasRef} />
				</GPURenderer>

				{cornerstone && <CornerstoneRenderer fileBuffer={fileBuffer}>
					<DICOMDiv heading="Cornerstone.js" canvasRef={canvasRef} />
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
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/vs-cornerstone" element={<Example cornerstone={true} />} />
        <Route path="/" element={<Example />} />
      </Routes>
    </Router>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

export default App; 
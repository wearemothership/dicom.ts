/* eslint-disable */
import "./App.css";
import { DICOMCanvas, DICOMJSRenderer, FileInput } from "./components";
import React, { useState } from "react";



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
				<div style={{ height: "50px" }} />
				<DICOMJSRenderer complete={() => { console.log("completed!");}} dataBuffer={fileBuffer} >
					<DICOMCanvas width={512} height={512} />
				</DICOMJSRenderer>
			</header>
		</div>
	);
}

export default App;

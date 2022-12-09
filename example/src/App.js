/* eslint-disable */
import "./App.css";
import { DICOMCanvas, DICOMJSRenderer, FileInput } from "./components";
import React, { useState } from "react";



function App() {
	/* React returns a reader and writer for the state specified.
		When altering the state, the associated component in redrawn by React automatically.
		'useState is like a class initialized in constructor, around one variable, 
		and you get a getter and a settter
	*/
	const [fileBufferArray, setFileBufferArray] = useState([]);

	/*When this callback is called, will trigger a React response,
	as we change the state via its 'writer'*/
	const fileSelected = (buff) => {
		
		console.time('duration')
		setFileBufferArray(buff);
	};
/*Here's the top level windows, with the major components put together*/
	return (
		<div className="App">
			<header className="App-header">
				<div>
					<label >Please load a series of one or more images: </label>
					<FileInput onFileSelected={fileSelected} />
				</div>

				<div style={{ height: "50px" }} />

				<DICOMJSRenderer complete={() => { console.log("completed!"); console.timeEnd('duration')}} dataBufferArray={fileBufferArray} />
				
			</header>
		</div>
	);
}

export default App;

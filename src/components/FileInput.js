import React from "react";

const FileInput = ({ onFileSelected }) => (
	<input
		type="file"
		name="files"
		// value=""
		onChange={(ev) => {
			const { files } = ev.target;
			onFileSelected(files[0]);
		}}
	/>
);

export default FileInput;

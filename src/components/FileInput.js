import React from "react";

export const readFile = (file) => new Promise((resolve, reject) => {
	if (!file) {
		return reject(Error("no file!"));
	}

	const blob = file.slice(0, file.size);
	const reader = new FileReader();
	// console.time("load");
	reader.onloadend = (evt) => {
		if (evt.target.readyState === FileReader.DONE) {
			// console.timeEnd("load");
			return resolve(evt.target.result);
		}
		return reject(Error("could not load!"));
	};
	reader.readAsArrayBuffer(blob);
	return null;
});

const FileInput = ({
	onFileSelected,
	onReadError = null,
	inputRef = null
}) => (
	<input
		type="file"
		name="files"
		ref={inputRef}
		onChange={(ev) => {
			const { files } = ev.target;
			readFile(files[0])
				.then(onFileSelected)
				.catch((err) => {
					console.error(err);
					onReadError?.(err);
				});
		}}
	/>
);

export default FileInput;

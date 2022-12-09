import React, { RefObject } from "react";

//===================================================================
export const readFile = (file: File):Promise<ArrayBuffer> => new Promise((resolve, reject) => {
	if (!file) {
		return reject(Error("no file!"));
	}

	// const blob = file.slice(0, file.size);
	const reader = new FileReader();
	console.time("load");
	
	reader.readAsArrayBuffer(file);
	//-----------------------------
	reader.onloadend = (evt) => {
		if (evt.target?.readyState === FileReader.DONE) {
			console.timeEnd("load");
			return resolve(evt.target?.result as ArrayBuffer);
		}
		return reject(Error("could not load!"));
	};
	
	return null;
});

//===================================================================
type FileInputProps = {
	onFileSelected(data:ArrayBuffer[]): void,
	onReadError:((error: Error) => void) | null,
	inputRef: RefObject<HTMLInputElement> | null,
}
//--------------------------------------------------------------------
const FileInput = ({
	onFileSelected,
	onReadError = null,
	inputRef = null
}: FileInputProps) => (
	<input
		type="file"
		name="files"
		multiple
		accept=".dcm"
		color = "yellow"
		ref={inputRef} 
		onChange={(ev) => {
			let promises = [];

			let files = ev.target.files as FileList;

			if ((files?.length ?? 0) > 0) {
				for(let i=0; i < files.length; i++){
					promises.push(readFile(files[i]));
				}
				Promise.all(promises)
					.then(onFileSelected)
					.catch((err) => {
						console.error(err);
						onReadError?.(err);
					});
			}
		}}
	/>
);

export default FileInput;

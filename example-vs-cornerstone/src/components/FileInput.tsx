import React, { RefObject } from "react";

export const readFile = (file: File):Promise<ArrayBuffer> => new Promise((resolve, reject) => {
	if (!file) {
		return reject(Error("no file!"));
	}

	const blob = file.slice(0, file.size);
	const reader = new FileReader();
	// console.time("load");
	reader.onloadend = (evt) => {
		if (evt.target?.readyState === FileReader.DONE) {
			// console.timeEnd("load");
			return resolve(evt.target?.result as ArrayBuffer);
		}
		return reject(Error("could not load!"));
	};
	reader.readAsArrayBuffer(blob);
	return null;
});

type FileInputProps = {
	onFileSelected(data:ArrayBuffer): void,
	onReadError:((error: Error) => void) | null,
	inputRef: RefObject<HTMLInputElement> | null,
};

const FileInput = ({
	onFileSelected,
	onReadError = null,
	inputRef = null
}: FileInputProps) => (
	<input
		type="file"
		name="files"
		ref={inputRef}
		onChange={(ev) => {
			const { files = null } = ev.target;
			if ((files?.length ?? 0) > 0) {
				readFile(files![0])
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

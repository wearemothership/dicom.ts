import React, { RefObject } from "react";

type DicomCanvasProps = {
	id?:string,
	canvasRef?: RefObject<HTMLCanvasElement>,
	width: number,
	height: number
}

const DICOMCanvas = ({
	id = "dicom-canvas",
	canvasRef,
	width = 512,
	height = 512
}: DicomCanvasProps) => (
	<canvas
		ref={canvasRef}
		id={id}
		style={{ width: `${width}px`, height: `${height}px` }}
	/>
);

export default DICOMCanvas;

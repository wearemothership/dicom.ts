import React, { RefObject } from "react";

type DicomCanvasProps = {
	id:string,
	canvasRef: RefObject<HTMLCanvasElement>,
	width: number,
	height: number
}

const DICOMCanvas = ({
	id,
	canvasRef
}: DicomCanvasProps) => (
	<canvas
		ref={canvasRef}
		id={id}
		width={4096} // start with the canvas big - resizing up is expensive...
		height={4096}
		style={{ height: `100%` }}
	/>
);

export default DICOMCanvas;

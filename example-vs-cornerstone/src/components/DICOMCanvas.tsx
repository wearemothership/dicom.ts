import React, { RefObject } from "react";

type DicomCanvasProps = {
	id:string,
	canvasRef: RefObject<HTMLCanvasElement>,
	width: number,
	height: number
}

const DICOMCanvas = ({
	id,
	canvasRef,
	width = 300,
	height = 300
}: DicomCanvasProps) => (
	<canvas
		ref={canvasRef}
		id={id}
		width={width}
		height={height}
		style={{ height: `100%` }}
	/>
);

export default DICOMCanvas;

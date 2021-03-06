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
	width = 512,
	height = 512
}: DicomCanvasProps) => (
	<canvas
		ref={canvasRef}
		id={id}
		width={width}
		height={height}
		style={{ width: `${width}px`, height: `${height}px` }}
	/>
);

export default DICOMCanvas;

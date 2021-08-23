import React, { RefObject } from "react";

type DicomCanvasProps = {
	id:string,
	canvasRef: RefObject<HTMLCanvasElement>,
	width: number,
	height: number
};

const DICOMCanvas = ({
	id,
	canvasRef
}: DicomCanvasProps) => (
	<canvas
		ref={canvasRef}
		id={id}
		style={{ height: "100%" }}
	/>
);

export default DICOMCanvas;

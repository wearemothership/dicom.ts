import React from "react";

const DICOMCanvas = ({
	id,
	canvasRef,
	width = 512,
	height = 512
}) => (
	(
		<canvas
			ref={canvasRef}
			id={id}
			width={width}
			height={height}
			style={{ width: `${width}px`, height: `${height}px` }}
		/>
	)
);

export default DICOMCanvas;

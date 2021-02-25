import React from "react";

const DICOMCanvas = ({
	heading = "",
	id,
	renderTime = null,
	canvasRef,
	width = 512,
	height = 512
}) => (
	(
		<div style={{ display: "inline-block" }}>
			<div>{heading}</div>
			<canvas
				ref={canvasRef}
				id={id}
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			/>
			<div>{ (renderTime && `${renderTime}ms`) || ""}</div>
		</div>
	)
);

export default DICOMCanvas;

import React, { useEffect } from "react";
import * as cornerstone from "cornerstone-core";

export const DICOMCanvas = ({
	heading,
	id,
	renderTime,
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

export const DICOMDiv = ({
	heading,
	id,
	renderTime,
	canvasRef,
	width = 512,
	height = 512
}) => {
	useEffect(() => {
		const last = canvasRef.current;
		if (canvasRef.current) {
			cornerstone.enable(canvasRef.current);
		}
		return () => {
			cornerstone.disable(last);
		};
	}, [canvasRef]);

	return (
		<div style={{ display: "inline-block" }}>
			<div>{heading}</div>
			<div
				ref={canvasRef}
				id={id}
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			/>
			<div>{ (renderTime && `${renderTime}ms`) || ""}</div>
		</div>
	);
};

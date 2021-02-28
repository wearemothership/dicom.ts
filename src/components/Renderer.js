import React, { useState, useRef, useEffect } from "react";
import Parser, { parseImage } from "../parser";
import render from "../renderer/render";

const parseDecodeAndRender = (buf, canvas) => {
	const data = new DataView(buf);
	Parser.verbose = true;
	const image = parseImage(data);
	// const w = image.getCols();
	// const h = image.getRows();
	// const scale = Math.min(1, Math.min(4096 / w, 4096 / h));
	const scale = 1.0;
	return render(image, canvas, scale);
};

const Renderer = ({
	renderMethod,
	fileBuffer,
	children
}) => {
	const [renderTime, setRenderTime] = useState(null);
	const canvasRef = useRef();
	useEffect(() => {
		if (fileBuffer) {
			const startTime = new Date();
			parseDecodeAndRender(fileBuffer, canvasRef.current).then(() => {
				setRenderTime(new Date() - startTime);
			});
		}
		return	() => {};
	}, [fileBuffer, renderMethod]);

	return (
		<>
			{
				React.Children.map(
					children,
					(element) => React.cloneElement(
						element,
						{ renderTime, canvasRef }
					)
				)
			}
		</>
	);
};

export default Renderer;

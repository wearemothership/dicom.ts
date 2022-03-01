import React, {
	ReactNode,
	ReactElement,
	useRef,
	useEffect,
	ReactChildren,
} from "react";
import { parseImage, render, Renderer } from "dicom.ts";

const parseDecodeAndRender = (buf: ArrayBuffer, canvas: HTMLCanvasElement): Promise<void> => {
	const data = new DataView(buf);
	// Parser.verbose = true;
	const image = parseImage(data);
	const scale = 1.0;
	return render(image!, canvas, scale);
};

type RenderProps = {
	renderMethod: (buf: ArrayBuffer, canvas: HTMLCanvasElement) => Promise<void>
	complete: ((canvas: HTMLCanvasElement) => void) | null;
	dataBuffer: ArrayBuffer,
	children: ReactChildren
}

const DICOMJSRenderer = ({
	renderMethod = parseDecodeAndRender,
	complete = null,
	dataBuffer,
	children
}: RenderProps) => {
	const rendererRef = useRef<Renderer>();
	const canvasRef = useRef<HTMLCanvasElement>();

	useEffect(() => {
		if (dataBuffer && rendererRef.current) {
			console.time("parse and render")
			const image = parseImage(new DataView(dataBuffer));
			rendererRef.current.render(image!, 0).then(() => {
				complete?.(canvasRef.current!)
				console.timeEnd("parse and render")
			});
		}
		return	() => {};
	}, [dataBuffer, complete]);

	useEffect(() => {
		if (canvasRef.current && !rendererRef.current) {
			rendererRef.current = new Renderer(canvasRef.current);
		}
		return () => {
			rendererRef.current?.destroy();
		}
	}, []);

	return (
		// microbundle doesnt like shorthand?
		// eslint-disable-next-line react/jsx-fragments
		<React.Fragment>
			{
				React.Children.map<ReactNode, ReactNode>(
					children,
					(child) => {
						if (React.isValidElement(child)) {
							return React.cloneElement(
								child as ReactElement<any>,
								{ canvasRef }
							);
						}
						return null;
					}
				)
			}
		</React.Fragment>
	);
};

export default DICOMJSRenderer;

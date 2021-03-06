import React, {
	ReactNode,
	ReactElement,
	useState,
	useRef,
	useEffect,
	ReactChildren,
} from "react";
import { Parser, parseImage } from "../parser";
import render from "../renderer/render";

const parseDecodeAndRender = (buf: ArrayBuffer, canvas: HTMLCanvasElement): Promise<void> => {
	const data = new DataView(buf);
	Parser.verbose = true;
	const image = parseImage(data);
	// const w = image.getCols();
	// const h = image.getRows();
	// const scale = Math.min(1, Math.min(4096 / w, 4096 / h));
	const scale = 1.0;
	return render(image, canvas, scale);
};

type RenderProps = {
	renderMethod: (buf: ArrayBuffer, canvas: HTMLCanvasElement) => Promise<void>;
	dataBuffer: ArrayBuffer,
	children: ReactChildren
}

const Renderer = ({
	renderMethod = parseDecodeAndRender,
	dataBuffer,
	children
}: RenderProps) => {
	const [renderTime, setRenderTime] = useState<number | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>();
	useEffect(() => {
		if (dataBuffer && canvasRef.current) {
			const startTime = new Date();
			renderMethod(dataBuffer, canvasRef.current!).then(() => {
				const diff = +new Date() - +startTime!;
				setRenderTime(diff);
			});
		}
		return	() => {};
	}, [dataBuffer, renderMethod]);

	return (
		<>
			{
				React.Children.map<ReactNode, ReactNode>(
					children,
					(child) => {
						if (React.isValidElement(child)) {
							return React.cloneElement(
								child as ReactElement<any>,
								{ renderTime, canvasRef }
							);
						}
						return null;
					}
				)
			}
		</>
	);
};

export default Renderer;

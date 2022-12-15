import React, {
	ReactNode,
	ReactElement,
	useRef,
	useEffect,
	ReactChildren,
	useState,
	createRef,
} from "react";
// import { DCMImage } from "dicom.ts/src/parser";
// import Series from "dicom.ts/src/image/series";

// // import  Parser from "../dicom.ts/src/parser/parser";
// import { parseImage } from "dicom.ts/src/parser/parser";
// import Renderer  from "dicom.ts/src/renderer/Renderer";
// import {IFrameInfo} from "dicom.ts/src/image/Types";

import { DCMImage } from "dicom.ts";
import { Series } from "dicom.ts";

// import  Parser from "../dicom.ts/src/parser/parser";
import { parseImage } from "dicom.ts";
import { Renderer } from "dicom.ts";
import { IFrameInfo,SliceDirection } from "dicom.ts";

//===================================================================
// const parseDecodeAndRender = (buf: ArrayBuffer, canvas: HTMLCanvasElement): Promise<void> => {
// 	const data = new DataView(buf);
// 	Parser.verbose = true;
// 	const image = parseImage(data);
// 	const scale = 1.0;
// 	console.log("Num frames = " + image?.numberOfFrames);
// 	return renderImage(image!, 0, canvas, scale);
// };

//===================================================================
type RenderProps = {
	renderMethod: (buf: ArrayBuffer, canvas: HTMLCanvasElement) => Promise<void>
	complete: ((canvas: HTMLCanvasElement) => void) | null;
	dataBufferArray: ArrayBuffer[],
	children: ReactChildren
}


	
// let imageArray : DCMImage[] = [];

let imageSeries : Series = new Series();
let frameSets: Array<IFrameInfo | null> = Array(0);
let timerRef:NodeJS.Timeout;

let viewName = "Axial";
//===================================================================
/*React component that takes a callback for parsing and rendering, and one to be called when finished*/
const DICOMJSRenderer = ({
	renderMethod ,//parseDecodeAndRender,
	complete = null,
	dataBufferArray, //the actual image set to be rendered
	children
}: RenderProps) => {
	const rendererRef = useRef<Renderer>();
	const canvasRef = createRef<HTMLCanvasElement>();
	const width = 800, height = 600;

	const [frames, setFrames] = useState<IFrameInfo | null>();
	const [studySize, setStudySize] = useState<number[]>([0,0,0]);
	const [cutIndex, setCutIndex] = useState<number[]>([0,0,0]);
	const [frameIndex, setFrameIndex] = useState<number>(0);
	const [framePos, setFramePos] = useState<number>(0);
	
	const viewNames:string[] = ["Sagittal", "Coronal","Axial"];
//-----------------------------------------------------------------
	/*The initialization phase, run once at the beginning, when creating the component*/
	useEffect(() => {
		if (canvasRef.current && !rendererRef.current) {
			rendererRef.current = new Renderer(canvasRef.current);
			rendererRef.current.outputSize = [0,0,canvasRef.current.width, canvasRef.current.height];
			rendererRef.current.slicingDirection = SliceDirection.Axial;
		}
		return () => {
			rendererRef.current?.destroy();
		}
	}, []);

	/*evey time we load a series of files, the imageArray is emptied 
	 and the dicom files are parsed and loaded as dicom images in the array*/  
	 useEffect(() => {
		imageSeries.images = [];
		if (dataBufferArray.length > 0){
			clearTimeout(timerRef);
			for(let bufferIndex in dataBufferArray){
				/*parse each raw image as a Dicom image*/
				let dcmImage:DCMImage = parseImage(new DataView(dataBufferArray[bufferIndex])) as DCMImage;
				/* add this Dicom image to the Sries*/
				if(imageSeries.matchesSeries(dcmImage))
					imageSeries.addImage(dcmImage);
			}
			/*now build the whole series in the correct way*/
			imageSeries.buildSeries();
			/*extract the series' pixels as a 3D Frame Object*/
			imageSeries.getFrames().then((framesObj: IFrameInfo) =>{setFrames(framesObj)});
		}
		return	() => {};
	}, [dataBufferArray]);

	/*every time we add a new series, will have to re-set the frameSet array*/
	useEffect(() => {
		let renderer: Renderer = rendererRef.current!;
		if(!!frames){
			if(frameSets.length === 0){
				const {width, height} = frames!.imageInfo!.size;
				/*set the study size according to the primary study, and reset the cutting point*/
				setStudySize([width,height,frames!.imageInfo.nFrames]);				
			}
			if(frames.imageInfo.image.modality === "RTDOSE")
				frames.imageInfo.modulationColor = [1,0,1,0.5];
			// else
			// 	frames.imageInfo.modulationColor = [0,1,0,1];
			frameSets.push(frames!);
			renderer!.setFrameSets(frameSets);
			setCutIndex([256,256,0]);
		}
	}, [frames]);


//-----------------------------
	/* Every time the count is changed, we need to render the next image in the stack*/
	useEffect(() => {
		let renderer: Renderer = rendererRef.current!;
		if (imageSeries.images.length > 0 && rendererRef.current) {
			// console.time("parse and render");
			
			renderer!.cutIndex = cutIndex;// [256,256,0.0];
			renderer!.render();	
			const sliceStep:number[] = [2,3,1];	
			const timeStep = 100;
			const countMax = studySize[renderer!.slicingDirection];
			const sliceDir = renderer!.slicingDirection;
			let cut_index = [...cutIndex];
			cut_index[sliceDir] = cut_index[sliceDir] < (countMax-sliceStep[sliceDir]) ? cut_index[sliceDir] + sliceStep[sliceDir] : 0 ;
			setFrameIndex(Math.round(cut_index[sliceDir]));
			setFramePos(Math.round(renderer!.cutPoint[sliceDir]*100)/100);
			timerRef = setTimeout(() => {//timer callback
				setCutIndex([...cut_index]);
			}, timeStep);
		}
		return	() => {};
	}, [cutIndex]);
	/* Changers for the current slicing view*/
	const setAxialView = ()=>{
		rendererRef!.current!.slicingDirection = SliceDirection.Axial;
		viewName = viewNames[SliceDirection.Axial];
	}
	const setSagittalView = ()=>{
		rendererRef!.current!.slicingDirection = SliceDirection.Sagittal;
		viewName = viewNames[SliceDirection.Sagittal];
	}
	const setCoronalView = ()=>{
		rendererRef!.current!.slicingDirection = SliceDirection.Coronal;
		viewName = viewNames[SliceDirection.Coronal];
	}
	/*Remove the current frame sets */
	const clearFrameSets = ()=>{		
		frameSets = [];
		rendererRef!.current!.setFrameSets(frameSets);
		setStudySize([0,0,0]);
		// setCutIndex([256,256,0]);
		setAxialView();
	}
	
	const btnStyle = {margin: "10px", width:"90px", padding: "10px", borderRadius: "10px"}	;
	const labelStyle = {marginLeft: "20px", color:"orange"};


	//-----------------------------------------------------------------

	return (
		<div style={{textAlign:"left", border: "2px solid cyan", borderRadius: "10px"}}>
			<div style={{textAlign:"left", border: "2px solid cyan", borderRadius: "10px"}}> 
				<button style={{...btnStyle, backgroundColor: 'lightsalmon'}} onClick={clearFrameSets}>Clear</button>
				<button style={btnStyle} onClick={setAxialView}>Axial</button>
				<button style={btnStyle} onClick={setSagittalView}>Sagittal</button>
				<button style={btnStyle} onClick={setCoronalView}>Coronal</button>
				<label style={labelStyle}>{viewName + ": " + frameIndex + " [" + framePos + "mm]"}</label>
			</div>
			<canvas
				ref={canvasRef}
				// id={id}
				width={width}
				height={height}
				style={{ width: `${width}px`, height: `${height}px` }}
			/>
		</div>
	);
};

export default DICOMJSRenderer;



		// microbundle doesnt like shorthand?
		// eslint-disable-next-line react/jsx-fragments
		// <React.Fragment>
		// 	{
		// 		React.Children.map<ReactNode, ReactNode>(
		// 			children,
		// 			(child) => {
		// 				if (React.isValidElement(child)) {
		// 					return React.cloneElement(
		// 						child as ReactElement<any>,
		// 						{ canvasRef }
		// 					);
		// 				}
		// 				return null;
		// 			}
		// 		)
		// 	}
		// </React.Fragment>
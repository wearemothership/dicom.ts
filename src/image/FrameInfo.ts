import * as twgl from "twgl.js";

import { ImageSize , IDisplayInfo, IFrameInfo} from "./Types";



//--------------------------------------------------------
interface IFrameInfoConstructor {
	imageInfo: IDisplayInfo,
	frameNo: number
	pixelData: Blob
	mat4Pix2Pat: Float32Array
	outputSize: ImageSize
}

//--------------------------------------------------------
/* `FrameInfo` is a class that holds the information about a single frame set of a DICOM image */
class FrameInfo implements IFrameInfo {
	frameNo: number;

	imageInfo: IDisplayInfo;
	
	pixelData: Blob;

	mat4Pix2Pat: Float32Array = new Float32Array();

	texture: WebGLTexture = 0;

	constructor(info: IFrameInfoConstructor) {
		this.imageInfo 	= info.imageInfo;
		this.frameNo 	= info.frameNo;
		this.pixelData 	= info.pixelData;
		this.mat4Pix2Pat= info.mat4Pix2Pat;
	}
	
	getPix2MM(pixpnt:number[]): number[] {
		return [...twgl.m4.transformPoint(this.mat4Pix2Pat,pixpnt)];
	}
	
	getMM2Pix(patpnt:number[]): number[] {
		let mat4Pat2Pix = twgl.m4.inverse(this.mat4Pix2Pat);
		return [...twgl.m4.transformPoint(mat4Pat2Pix, patpnt)];
	}

	destroy():void {
		// if(this.gl.isTexture(this.texture)){
		// 	this.gl.deleteTexture(this.texture);
		// }
	}
}

export default FrameInfo;

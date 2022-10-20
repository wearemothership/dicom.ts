
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
class FrameInfo implements IFrameInfo {
	frameNo: number;

	imageInfo: IDisplayInfo;
	
	pixelData: Blob;

	outputSize: ImageSize;

	mat4Pix2Pat: Float32Array = new Float32Array();

	texture: WebGLTexture = -1;

	constructor(info: IFrameInfoConstructor) {
		this.imageInfo 	= info.imageInfo;
		this.frameNo 	= info.frameNo;
		this.pixelData 	= info.pixelData;
		this.mat4Pix2Pat= info.mat4Pix2Pat;
		this.outputSize = info.outputSize;
	}

	destroy():void {
		// this.gl.deleteTexture(this.texture);
	}
}

export default FrameInfo;

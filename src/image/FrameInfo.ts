import { IDisplayInfo } from "./DisplayInfo";

interface IFrameInfo {
	frameNo: number;

	imageInfo: IDisplayInfo,

	texture: WebGLTexture
}

interface IFrameInfoConstructor {
	imageInfo: IDisplayInfo,
	frameNo: number,
	texture: WebGLTexture
}

class FrameInfo implements IFrameInfo {
	frameNo: number

	imageInfo: IDisplayInfo

	texture: WebGLTexture

	constructor(info: IFrameInfoConstructor) {
		this.imageInfo = info.imageInfo;
		this.frameNo = info.frameNo;
		this.texture = info.texture;
	}
}

export default FrameInfo;

import { IDisplayInfo } from "./DisplayInfo";

interface IFrameInfo {
	frameNo: number

	imageInfo: IDisplayInfo

	texture: WebGLTexture

	destroy(): void
}

interface IFrameInfoConstructor {
	imageInfo: IDisplayInfo,
	frameNo: number,
	gl:WebGLRenderingContext,
	texture: WebGLTexture
}

class FrameInfo implements IFrameInfo {
	frameNo: number;

	imageInfo: IDisplayInfo;

	texture: WebGLTexture;

	private gl: WebGLRenderingContext;

	constructor(info: IFrameInfoConstructor) {
		this.imageInfo = info.imageInfo;
		this.frameNo = info.frameNo;
		this.texture = info.texture;
		this.gl = info.gl;
	}

	destroy():void {
		this.gl.deleteTexture(this.texture);
	}
}

export default FrameInfo;

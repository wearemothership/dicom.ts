
import { IDecoderInfo } from "../image/DecoderInfo";
import { displayInfoFromDecoderInfo, IDisplayInfo } from "../image/DisplayInfo";
import { ImageSize, ISize } from "../image/Types";


//=======================================================================================
interface IDecoder {
	image: IDisplayInfo 
	getFramePixels(frameNo:number):Promise<Blob>
}

//========================================================================================
class Decoder implements IDecoder {
	image: IDisplayInfo;

	constructor(decoderInfo:IDecoderInfo) {
		/* Converting the image from a decoderInfo to a image. */
		this.image = displayInfoFromDecoderInfo(decoderInfo);

	}
//------------------------------------------------------------------------------
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected decode(frameNo:number):Promise<DataView> {
		const { data, nFrames } = this.image;
		const bytesPerFrame = data.byteLength / nFrames;
		const dv = new DataView(
			data.buffer,
			data.byteOffset + bytesPerFrame * frameNo,
			bytesPerFrame
		);
		return Promise.resolve(dv);
	}
//------------------------------------------------------------------------------
	
	/**
	 * It decodes the frames of the image and returns a Blob containing the pixel data of all the
	 * frames
	 * @param {number} frameNo - the frame number to decode. If negative, all frames are decoded.
	 * @returns A Blob object.
	 */
	async getFramePixels(frameNo:number):Promise<Blob> {
		let currFrame = frameNo < 0 ? 0 : frameNo;
		let endFrame = frameNo < 0 ? this.image.nFrames : frameNo+1;
		let frameDataAray = [];
		for(; currFrame < endFrame; currFrame++){
			/*decode frame-by-frame and collate*/
			const pixelData = await this.decode(currFrame);
			frameDataAray.push(pixelData);
		}
		/*concatenate all the frames' pixel data*/
	
		return new Blob(frameDataAray);
	}

}

export default Decoder;

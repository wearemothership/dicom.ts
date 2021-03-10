import { decoderForImage, Decoder } from "../decoder";
import ContrastifyProgram from "./ContrastifyProgram";
import ColorProgram from "./ColorProgram";
import IProgram from "./Program";
import GreyscaleProgram from "./GreyscaleProgram";
import GreyscaleLUTProgram from "./GreyscaleLUTProgram";
import { ImageSize } from "../image/Types";
import { DCMImage } from "../parser";

class Renderer {
	canvas: HTMLCanvasElement

	gl: WebGLRenderingContext

	decoder: Decoder | null = null

	image: DCMImage | null = null

	program: IProgram | null = null;

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext("webgl");
		if (!gl) {
			throw Error("could not create webgl from canvas");
		}
		this.canvas = canvas;
		this.gl = gl!;
	}

	async render(image: DCMImage, frameNo:number = 0) {
		if (this.image !== image) {
			this.image = image;
			const decoder = decoderForImage(image);
			const size = new ImageSize(image);
			decoder!.outputSize = size;
			this.canvas.width = size.width;
			this.canvas.height = size.height;

			const imageInfo = decoder!.image;
			if (imageInfo.rgb) {
				this.program = new ColorProgram(this.gl, imageInfo);
			}
			else if (imageInfo.windowCenter || imageInfo.minPixVal || imageInfo.maxPixVal) {
				this.program = new GreyscaleProgram(this.gl, imageInfo);
			}
			else if (imageInfo.lut) {
				this.program = new GreyscaleLUTProgram(this.gl, imageInfo);
			}
			else {
				this.program = new ContrastifyProgram(this.gl, imageInfo);
			}
			this.decoder = decoder;
		}
		const frame = await this.decoder!.getFrame(this.gl, frameNo);

		this.program!.run(frame);
	}
}

export default Renderer;

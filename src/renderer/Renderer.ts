import { decoderForImage, Decoder } from "../decoder";
import ContrastifyProgram from "./ContrastifyProgram";
import ColorProgram from "./ColorProgram";
import IProgram from "./Program";
import GreyscaleProgram from "./GreyscaleProgram";
import GreyscaleLUTProgram from "./GreyscaleLUTProgram";
import { IImageLutInfo } from "../image/FrameInfo";

class Renderer {
	lut: IImageLutInfo | null = null;

	canvas: HTMLCanvasElement

	gl: WebGLRenderingContext

	decoder: Decoder | null = null

	image: any = null

	program: IProgram | null = null;

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext("webgl");
		if (!gl) {
			throw Error("could not create webgl from canvas");
		}
		this.canvas = canvas;
		this.gl = gl!;
	}

	async render(image: any, frameNo:number = 0) {
		if (this.image !== image) {
			this.image = image;
			this.decoder = decoderForImage(image);
			const width = image.columns;
			const height = image.rows;
			this.decoder!.outputSize = { width, height };

			const { canvas } = this;
			canvas.width = width;
			canvas.height = height;
			this.lut = image.lut;
		}
		const frame = await this.decoder!.getFrame(this.gl, frameNo);

		if (frame.isRGB) {
			this.program = new ColorProgram(this.gl, frame);
		}
		else if (frame.windowCenter || image.minPixValue || image.maxPixValue) {
			this.program = new GreyscaleProgram(this.gl, frame);
		}
		else if (this.lut) {
			this.program = new GreyscaleLUTProgram(this.gl, frame, this.lut!);
		}
		else {
			this.program = new ContrastifyProgram(this.gl, frame);
		}
		this.program.run(frame);
	}
}

export default Renderer;

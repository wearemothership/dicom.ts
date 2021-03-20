import { decoderForImage, Decoder } from "../decoder";
import ContrastifyProgram from "./ContrastifyProgram";
import ColorProgram from "./ColorProgram";
import IProgram from "./Program";
import GreyscaleProgram from "./GreyscaleProgram";
import GreyscaleLUTProgram from "./GreyscaleLUTProgram";
import { ImageSize } from "../image/Types";
import { DCMImage } from "../parser";
import { ISize } from "../decoder/Decoder";
import ColorPaletteProgram from "./ColorPaletteProgram";

class Renderer {
	canvas: HTMLCanvasElement

	image: DCMImage | null = null

	private gl: WebGLRenderingContext

	private decoder: Decoder | null = null

	private program: IProgram | null = null;

	private outSize: ImageSize | null = null;

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext("webgl");
		if (!gl) {
			throw Error("could not create webgl from canvas");
		}
		this.canvas = canvas;
		this.gl = gl!;
	}

	async render(image: DCMImage, frameNo:number = 0) {
		const { gl } = this;
		if (!this.outSize) {
			this.outSize = new ImageSize(image);
		}
		const size = this.outSize!;
		this.canvas.width = size!.width;
		this.canvas.height = size!.height;

		if (this.image !== image) {
			if (this.program) {
				// TODO: lets create a program signature, only recreate if not cached?
				this.program.destroy();
			}
			this.image = image;
			const decoder = decoderForImage(image);
			decoder!.outputSize = new ImageSize(image);

			const imageInfo = decoder!.image;
			if (imageInfo.palette) {
				this.program = new ColorPaletteProgram(gl, imageInfo);
			}
			else if (imageInfo.rgb) {
				this.program = new ColorProgram(gl, imageInfo);
			}
			else if (imageInfo.windowCenter
				|| imageInfo.minPixVal
				|| imageInfo.maxPixVal
			) {
				this.program = new GreyscaleProgram(gl, imageInfo);
			}
			else if (imageInfo.lut) {
				this.program = new GreyscaleLUTProgram(gl, imageInfo);
			}
			else {
				this.program = new ContrastifyProgram(gl, imageInfo);
			}
			this.decoder = decoder;
		}

		this.program!.outputSize = size;

		const frame = await this.decoder!.getFrame(gl, frameNo);

		this.program!.run(frame);

		frame.destroy();
	}

	set outputSize(size:ISize) {
		this.outSize = new ImageSize(size);
	}

	get outputSize():ISize {
		if (this.outSize) {
			return this.outSize;
		}
		return new ImageSize({ width: 0, height: 0 });
	}

	destroy(): void {
		this.program?.destroy();
	}
}

export default Renderer;

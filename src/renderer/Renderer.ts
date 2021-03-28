import sha1 from "crypto-js/sha1";
import { decoderForImage, Decoder } from "../decoder";
import ContrastifyProgram from "./ContrastifyProgram";
import ColorProgram from "./ColorProgram";
import IProgram, { IProgramSignature } from "./Program";
import GreyscaleProgram from "./GreyscaleProgram";
import GreyscaleLUTProgram from "./GreyscaleLUTProgram";
import { ISize, ImageSize } from "../image/Types";
import { DCMImage, Series } from "../parser";
import ColorPaletteProgram from "./ColorPaletteProgram";

class Renderer {
	canvas: HTMLCanvasElement

	image: DCMImage | null = null

	private gl: WebGLRenderingContext

	private decoder: Decoder | null = null

	private program: IProgram | null = null;

	private outSize: ImageSize | null = null;

	private programCacheMap: Map<string, IProgram>;

	constructor(inCanvas: HTMLCanvasElement | null) {
		const canvas = inCanvas || document?.createElement("canvas") || new HTMLCanvasElement();
		const gl = canvas.getContext("webgl");
		if (!gl) {
			throw Error("could not create webgl from canvas");
		}
		this.canvas = canvas;
		this.gl = gl!;
		this.programCacheMap = new Map<string, IProgram>();
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
			this.image = image;
			const decoder = decoderForImage(image);
			decoder!.outputSize = new ImageSize(image);

			const imageInfo = decoder!.image;
			let signature: IProgramSignature | null = null;
			if (imageInfo.palette) {
				signature = {
					hash: sha1(ColorPaletteProgram.programStringForInfo(imageInfo)).toString(),
					Type: ColorPaletteProgram
				};
			}
			else if (imageInfo.rgb) {
				signature = {
					hash: sha1(ColorProgram.programStringForInfo()).toString(),
					Type: ColorProgram
				};
			}
			else if (imageInfo.windowCenter
				|| imageInfo.minPixVal
				|| imageInfo.maxPixVal
			) {
				signature = {
					hash: sha1(GreyscaleProgram.programStringForInfo(imageInfo)).toString(),
					Type: GreyscaleProgram
				};
			}
			else if (imageInfo.lut) {
				signature = {
					hash: sha1(GreyscaleLUTProgram.programStringForInfo(imageInfo)).toString(),
					Type: GreyscaleLUTProgram
				};
			}
			else {
				const [s0, s1] = ContrastifyProgram.programStringForInfo(imageInfo);
				signature = {
					hash: sha1(s0 + s1).toString(),
					Type: ContrastifyProgram
				};
			}
			let program = this.programCacheMap.get(signature.hash);
			if (!program) {
				program = new signature.Type(gl, imageInfo) as IProgram;
				this.programCacheMap.set(signature.hash, program);
			}
			program.use();
			this.program = program!;
			this.decoder = decoder;
		}

		const frame = await this.decoder!.getFrame(gl, frameNo);

		this.program!.run(frame, size);

		setTimeout(() => {
			frame.destroy();
		}, 0);
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

	destroy(aggressive:boolean = false): void {
		this.programCacheMap.forEach((program) => {
			program.destroy();
		});
		this.programCacheMap = new Map();
		this.program = null;
		this.image = null;
		if (aggressive) {
			// https://stackoverflow.com/questions/23598471/how-do-i-clean-up-and-unload-a-webgl-canvas-context-from-gpu-after-use
			this.gl.getExtension("WEBGL_lose_context")?.loseContext();
			this.canvas.width = 1;
			this.canvas.height = 1;
		}
	}
}

export const render = async (
	image: DCMImage,
	canvas: HTMLCanvasElement,
	scale: number = 1.0
): Promise<void> => {
	if (!image) {
		return Promise.reject(Series.parserError);
	}
	const renderer = new Renderer(canvas);

	const outSize = new ImageSize(image).scale(scale);
	renderer.outputSize = outSize;
	await renderer.render(image, 0);
	renderer.destroy();
	return Promise.resolve();
};

export default Renderer;

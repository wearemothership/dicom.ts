import sha1 from "crypto-js/sha1";
import { decoderForImage, Decoder } from "../decoder";
import ContrastifyProgram from "./ContrastifyProgram";
import ColorProgram from "./ColorProgram";
import IProgram, { IColorProgramType, IGreyscaleProgramType, IProgramSignature } from "./Program";
import GreyscaleProgram from "./GreyscaleProgram";
import GreyscaleLUTProgram from "./GreyscaleLUTProgram";
import { ISize, ImageSize } from "../image/Types";
import { DCMImage, Series } from "../parser";
import ColorPaletteProgram from "./ColorPaletteProgram";
import { IDisplayInfo } from "../image/DisplayInfo";
import { Codec } from "../image/DecoderInfo";

class Renderer {
	canvas: HTMLCanvasElement;

	image: DCMImage | null = null;

	private gl: WebGLRenderingContext;

	private decoder: Decoder | null = null;

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

	/**
	 * prime the renderer with specific programs
	 * this can improve 1st image render time quite dramatically
	 * @param programType
	 */
	primeGreyscale(programType: IGreyscaleProgramType) {
		const {
			hasLut,
			invert,
			signed,
			bitsAllocated,
			bitsStored,
			littleEndian,
			hasPixelPaddingValue,
			knownWindow,
		} = programType;
		const imageType: IDisplayInfo = {
			image: new DCMImage(),
			nFrames: 1,
			rgb: false,
			planar: false,
			signed: signed ?? false,
			size: new ImageSize({ width: 0, height: 0 }),
			codec: Codec.Uncompressed,
			samples: 0,
			bitsAllocated: bitsAllocated ?? 16,
			bytesAllocated: (bitsAllocated ?? 16) / 8,
			bitsStored: bitsStored ?? bitsAllocated ?? 16,
			littleEndian: littleEndian ?? true,
			data: new DataView(new ArrayBuffer(0)),

			lut: hasLut ? {
				nEntries: 0,
				firstValue: 0,
				bitsStored: 0,
				data: new Uint8Array(0)
			} : null,

			palette: null,
			invert: invert ?? false,
			pixelPaddingVal: hasPixelPaddingValue ? 1 : null,
			minPixVal: null,
			maxPixVal: null,
			windowCenter: knownWindow ? 0.5 : null,
			windowWidth: knownWindow ? 1 : null,
			slope: 1,
			intercept: 0
		};
		this.getProgram(imageType);
	}

	/**
	 * prime the renderer with specific programs
	 * this can improve 1st image render time quite dramatically
	 * @param programType
	 */
	primeColor(programType: IColorProgramType) {
		const {
			planar,
			bitsAllocated,
			signed,
			littleEndian,
			hasPaletteWithWordBits,
			invert,
		} = programType;
		const imageType: IDisplayInfo = {
			image: new DCMImage(),
			nFrames: 1,
			rgb: true,
			planar: planar ?? false,
			signed: signed ?? false,
			size: new ImageSize({ width: 0, height: 0 }),
			codec: Codec.Uncompressed,
			samples: 3,
			bitsAllocated,
			bytesAllocated: bitsAllocated / 8,
			bitsStored: bitsAllocated,
			littleEndian: littleEndian ?? true,
			data: new DataView(new ArrayBuffer(0)),
			lut: null,
			palette: hasPaletteWithWordBits ? {
				nEntries: 0,
				firstValue: 0,
				bitsAllocated: hasPaletteWithWordBits,
				r: new DataView(new ArrayBuffer(0)),
				g: new DataView(new ArrayBuffer(0)),
				b: new DataView(new ArrayBuffer(0)),
			} : null,
			invert: invert ?? false,
			pixelPaddingVal: null,
			minPixVal: null,
			maxPixVal: null,
			windowCenter: null,
			windowWidth: null,
			slope: 1,
			intercept: 0
		};
		this.getProgram(imageType);
	}

	/**
	 * render the image frame to the canvas
	 * @param image parsed DCMImage
	 * @param frameNo the frame index
	 */
	async render(image: DCMImage, frameNo:number = 0) {
		const { gl, canvas } = this;
		if (!this.outSize) {
			this.outSize = new ImageSize(image);
		}
		const size = this.outSize!;
		if (size.width !== canvas.width || size.height !== canvas.height) {
			canvas.width = 1; // near zero the canvas, makes resize much faste!
			canvas.height = 1;
			canvas.width = size!.width;
			canvas.height = size!.height;
		}
		if (this.image !== image) {
			this.image = image;
			const decoder = decoderForImage(image);
			decoder!.outputSize = new ImageSize(image);

			const imageInfo = decoder!.image;
			const program = this.getProgram(imageInfo);
			program.use();
			this.program = program;
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

	clear(): void {
		const { gl, canvas } = this;
		canvas.width = 0; // zero the canvas, makes resize much faster!
		canvas.height = 0;
		// eslint-disable-next-line no-bitwise
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
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

	private getProgram(imageInfo: IDisplayInfo): IProgram {
		const { gl } = this;
		let signature: IProgramSignature | null = null;
		if (imageInfo.palette) {
			signature = {
				hash: sha1(ColorPaletteProgram.programStringForInfo(imageInfo)).toString(),
				Type: ColorPaletteProgram
			};
		}
		else if (imageInfo.rgb) {
			signature = {
				hash: sha1(ColorProgram.programStringForInfo(imageInfo)).toString(),
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
		return program;
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

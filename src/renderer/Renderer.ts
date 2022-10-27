import sha1 from "sha1";
import { decoderForImage, Decoder } from "../decoder";
import { IFrameInfo } from "../image/Types";
import ContrastifyProgram from "./ContrastifyProgram";
import ColorProgram from "./ColorProgram";
import IProgram, { IColorProgramType, IGreyscaleProgramType, IProgramSignature } from "./Program";
import GreyscaleProgram from "./GreyscaleProgram";
import GreyscaleLUTProgram from "./GreyscaleLUTProgram";
import { ISize, ImageSize } from "../image/Types";
import { DCMImage } from "../parser";
import ColorPaletteProgram from "./ColorPaletteProgram";
import { Codec, IDisplayInfo } from "../image/Types";
import * as twgl from "twgl.js";
import FrameInfo from "../image/FrameInfo";

class ImageRenderer {
	canvas: HTMLCanvasElement;

	image: DCMImage | null = null;

	frames: FrameInfo | null = null;

	private gl: WebGL2RenderingContext;

	private decoder: Decoder | null = null;

	private program: IProgram | null = null;

	private outSize: ImageSize | null = null;

	private programCacheMap: Map<string, IProgram>;

	/**
	 * It creates a new WebGL2RenderingContext object.
	 * @param {HTMLCanvasElement | null} inCanvas - HTMLCanvasElement | null
	 */
	constructor(inCanvas: HTMLCanvasElement | null) {
		const canvas = inCanvas || document?.createElement("canvas") || new HTMLCanvasElement();
		
		/* It creates a new WebGL2RenderingContext object. */
		const gl = canvas.getContext("webgl2");
		if (!gl) {
			throw Error("could not create webgl2 from canvas");
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


	//----------------------------------------------------------------------------
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
		/*if we change the image, let's get the decoder and the 
		image's suitable shader program*/
		if (this.image !== image) {
			this.image = image;
			/* select the correct decoder for this image modality*/
			const decoder = decoderForImage(image);
			// decoder!.outputSize = new ImageSize(image);
			/*this is a DisplayInfo object*/
			const displayInfo = decoder!.image;
			/* select the correct GLSL program for this image modality*/
			const program = this.getProgram(displayInfo);
			program.use();
			this.program = program;
			this.decoder = decoder;
			
		//  console.log(program.programInfo);
		}
		/* decode the frame's pixel buffer, to be loaded into a WebGL texture*/
		const pixels = await this.decoder!.getFramePixels(frameNo);

		const frame = new FrameInfo({
			imageInfo: this.decoder!.image,
			frameNo:0,
			pixelData: pixels,
			outputSize: this.decoder!.image.size,
			mat4Pix2Pat: new Float32Array()
		});
		/* create the associated frame's WebGL texture*/
		frame.texture = await this.createTexture(frame);
		gl.viewport(0,0,frame.imageInfo.image.columns, frame.imageInfo.image.rows);
		/* perform the rendering of a textured quad, using the selected shading program*/
		this.program!.run(frame, size);
		/*destroy the texture asynchronously*/
		setTimeout(() => {
			// frame.destroy();
			this.gl.deleteTexture(frame.texture);
		}, 0);
	}

	//----------------------------------------------------------------------------
	async renderFrame(frames: FrameInfo, frameNo:number = 0) {
		const { gl, canvas } = this;
		if (!this.outSize) {
			this.outSize = frames.outputSize;
		}
		const size = this.outSize!;
		if (size.width !== canvas.width || size.height !== canvas.height) {
			canvas.width = 1; // near zero the canvas, makes resize much faste!
			canvas.height = 1;
			canvas.width = size!.width;
			canvas.height = size!.height;
		}
		/*if we change the image, let's get the decoder and the 
		image's suitable shader program*/
		if (this.frames !== frames) {
			/*destroy the texture asynchronously*/
			setTimeout(() => {
				// frames.destroy();
				this.gl.deleteTexture(this.frames!.texture);
			}, 0);
			/* create the associated frame's WebGL texture*/
			frames.texture = await this.createTexture(frames);
			this.frames = frames;
			
			/* select the correct GLSL program for this image modality*/
			const program = this.getProgram(frames.imageInfo);
			program.use();
			this.program = program;
			
		//  console.log(program.programInfo);
		}
		frames.frameNo = frameNo;
		gl.viewport(0,0,frames.imageInfo.image.columns, frames.imageInfo.image.rows);
		/* perform the rendering of a textured quad, using the selected shading program*/
		this.program!.run(frames, size);
	}
//------------------------------------------------------------------------------

/**
 * It creates a WebGL texture from a frame of a DICOM image
 * @param {IFrameInfo} frame - IFrameInfo - This is the frame that is being decoded.
 * @returns A promise that resolves to a WebGLTexture.
 */
protected async createTexture(frame: IFrameInfo):Promise<WebGLTexture> {
	/* Decoding the frameNo'th frame of the image. */
	const { gl } = this;
	const pixelData = await frame.pixelData.arrayBuffer();
	const bytes = new Uint8Array(pixelData);
	let { height } = frame.outputSize;
	const { width } = frame.outputSize;
	const image  = frame.imageInfo;
	let format = gl.LUMINANCE_ALPHA;
	let internalFormat = gl.LUMINANCE_ALPHA;
	if (image.rgb && !image.planar && !image.palette) {
		format = gl.RGB;
		internalFormat = gl.RGB;
	}
	else if (image.bytesAllocated === 1) {
		format = gl.LUMINANCE;
		internalFormat = gl.LUMINANCE;
	}
	if (image.planar) {
		height *= image.samples;
	}
 
	let depth = frame.imageInfo.nFrames;
	let texTarget = gl.TEXTURE_3D;//(depth > 1 && frame.frameNo < 0) ? gl.TEXTURE_2D :  gl.TEXTURE_2D;

						
	return Promise.resolve(twgl.createTexture(gl, {
		src: bytes,
		target: texTarget,
		width,
		height,
		depth,
		format,
		internalFormat,
		type: gl.UNSIGNED_BYTE,
		min: gl.NEAREST,
		mag: gl.NEAREST,
		wrap: gl.CLAMP_TO_EDGE,
	}));
}
	//----------------------------------------------------------------------------
	set outputSize(size:ISize) {
		this.outSize = new ImageSize(size);
	}

	//----------------------------------------------------------------------------
	get outputSize():ISize {
		if (this.outSize) {
			return this.outSize;
		}
		return new ImageSize({ width: 0, height: 0 });
	}

	//----------------------------------------------------------------------------
	clear(): void {
		const { gl, canvas } = this;
		canvas.width = 0; // zero the canvas, makes resize much faster!
		canvas.height = 0;
		// eslint-disable-next-line no-bitwise
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
	}

	//----------------------------------------------------------------------------
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

	//----------------------------------------------------------------------------
	/**
	 * It takes an image info object and returns a program object
	 * @param {IDisplayInfo} imageInfo - IDisplayInfo
	 * @returns A program object.
	 */
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


export default ImageRenderer;

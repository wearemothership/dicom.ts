export interface ISize {
	width: number,
	height: number
}
export interface IImageSizeContructor {
	width?: number,
	height?: number,
	rows?: number,
	columns?: number
}

export interface IImageSize extends ISize {
	width: number,
	height: number,
	rows: number,
	columns: number
}

export class ImageSize implements IImageSize {
	readonly width: number;

	readonly height: number;

	constructor({
		width,
		height,
		rows,
		columns
	}: IImageSizeContructor) {
		this.width = width ?? columns ?? 0;
		this.height = height ?? rows ?? 0;
	}

	get rows():number {
		return this.height;
	}

	get columns():number {
		return this.width;
	}

	get numberOfPixels(): number {
		const { width, height } = this;
		return width * height;
	}

	scale(scale: number):ImageSize {
		let { width, height } = this;
		width *= scale;
		height *= scale;
		return new ImageSize({ width, height });
	}
}

// TODO: shouldthis be needed - generate with tsc / rollup?

declare module "dicom.ts" {
	export function parseImage(data: DataView): unknown;
	export function render(image: unknown, canvas: HTMLCanvasElement, scale: number): Promise<void>;

	export class Renderer {
		constructor(canvas: HTMLCanvasElement);

		destroy(): void;
	}
}

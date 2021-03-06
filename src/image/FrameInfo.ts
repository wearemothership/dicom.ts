import { TransferSyntax } from "../parser/constants";

interface ImageDisplayInfo {

}

interface FrameInfo {
	frameNo: number;
	width: number;
	height: number;
	data: ArrayBuffer;
	littleEndian: boolean;
	transferSyntax: TransferSyntax;
	pixelRepresentation: number;
	bitsAllocated: number;
	bitsStored: number;
	rows: number;
	columns: number;
	samplesPerPixel: number;
	photometricInterpretation: number;
	dataType: number
}

export default FrameInfo;

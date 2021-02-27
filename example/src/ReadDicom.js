// /* eslint-disable */
import { dicomjs } from "dicom.js"

// import from source for debugging!
// import { dicomjs } from "./dicom-src/index"

export const CPUDecode = (buf, canvas) => new Promise((resolve, reject) => {
	const data = new DataView(buf);
	dicomjs.Parser.verbose = true;
	const start = new Date().valueOf();
	const image = dicomjs.parseImage(data);
	console.timeEnd("parse");
	// start = new Date().valueOf();
	if (image === null) {
		console.error(dicomjs.parserError);
		return reject(Error(dicomjs.parserError));
	}
	if (!image.hasPixelData()) {
		return reject(Error("No pixel data!"));
	}
	console.time("getInterpretedData");
	const pixelData = image.getInterpretedData(true, false, 0);
	console.timeEnd("getInterpretedData");
	console.log(`get pix data: ${(new Date().valueOf() - start)}`);
	// const canvas = document.getElementById("canvas1");
	// eslint-disable-next-line no-param-reassign
	canvas.width = image.columns;
	// eslint-disable-next-line no-param-reassign
	canvas.height = image.rows;

	const ctx = canvas.getContext("2d");
	console.time("createImageData");
	const imageData = ctx.createImageData(image.columns, image.rows);
	console.timeEnd("createImageData");
	let pos = 0;
	if (image.dataType === dicomjs.Image.byteType.rgb) {
		const nSamples = image.samplesPerPixel;
		if (image.getPlanarConfig() && nSamples === 3) {
			// planar config 1 = RRR...GGG...BBB
			const length = pixelData.length / 3;
			for (let i = 0; i < length; i += 1) {
				const r = pixelData[i];
				const g = pixelData[i + length];
				const b = pixelData[i + length * 2];
				imageData.data[pos] = r;
				imageData.data[pos += 1] = g;
				imageData.data[pos += 1] = b;
				imageData.data[pos += 1] = 255; // opaque alpha
				pos += 1;
			}
		}
		else {
			// planar config 0 = RGBRGBRGB...
			for (let i = 0; i < pixelData.length; i += 3) {
				const r = pixelData[i];
				const g = pixelData[i + 1];
				const b = pixelData[i + 2];
				imageData.data[pos] = r;
				imageData.data[pos += 1] = g;
				imageData.data[pos += 1] = b;
				imageData.data[pos += 1] = 255; // opaque alpha
				pos += 1;
			}
		}
	}
	else {
		// greyscale...

		// TODO: move this to Daikon - getInterpretedData
		const lutDescriptor = image.getTag(dicomjs.Tag.TAG_VOI_LUT_DESCRIPTOR);

		// calculate bit shift for colour depths > 8bit greyscale
		const storedBits = image.bitsStored;
		const bitShift = (storedBits % 8) + ((Math.trunc(storedBits / 8) - 1) * 8);

		let getPixData = (i) => pixelData[i];

		if (image.pixelRepresentation === 1) {
			getPixData = (i) => pixelData[i] + (2 ** (storedBits - 1));
		}

		if (lutDescriptor) {
			const pixData2 = new Uint16Array(image.getRawData());
			// const nValues = lutDescriptor.value[0];
			const firstInputValue = lutDescriptor.value[1];
			let ArrayType = Uint8Array;
			if (lutDescriptor.value[2] > 8) {
				ArrayType = Uint16Array;
			}
			const lutData = new ArrayType(image.getTag(dicomjs.Tag.TAG_VOI_LUT_DATA).value);
			console.log(lutDescriptor);
			console.log(lutData);
			// const outRange = lutDescriptor.value[1];
			getPixData = (i) => (
				4095 - lutData[Math.max(firstInputValue, pixData2[i]) - firstInputValue]
			);
			// };

			const minVal = Math.min(pixData2);
			console.log(minVal);
		}
		else {
			// TODO: get to work, and maybe add to parser?

			// const pixData2 = new Uint16Array(image.getRawData());

			// const minPixVal = image.getTagValue(dicomjs.Tag.TAG_IMAGE_MIN);
			// const maxPixVal = image.getTagValue(dicomjs.Tag.TAG_IMAGE_MAX);

			// let windowCenter = image.getTagValue(dicomjs.Tag.TAG_WINDOW_CENTER)[0];
			// let windowWidth = image.getTagValue(dicomjs.Tag.TAG_WINDOW_WIDTH)[0];

			// if (windowWidth || maxPixVal) {
			// 	if (maxPixVal && !windowWidth) {
			// 		windowWidth = maxPixVal - minPixVal;
			// 		windowCenter = windowWidth / 2.0;
			// 	}
			// 	getPixData = (i) => (
			// 		(pixData2[i] - windowCenter) / windowWidth + 0.5
			// 	);
			// }
		}

		for (let i = 0; i < pixelData.length; i += 1) {
			// eslint-disable-next-line no-bitwise
			const grey = getPixData(i) >> bitShift;
			imageData.data[pos] = grey;
			imageData.data[pos += 1] = grey;
			imageData.data[pos += 1] = grey;
			imageData.data[pos += 1] = 255; // opaque alpha
			pos += 1;
		}
	}
	console.log(`encoded image data: ${(new Date().valueOf() - start)}`);
	ctx.fillStyle = "black"; // this is default anyway
	ctx.fillRect(0, 0, 1024, 1024);
	ctx.putImageData(imageData, 0, 0, 0, 0, image.columns, image.rows);
	return resolve();
});

export const NewDecode = (buf, canvas) => {
	const data = new DataView(buf);
	dicomjs.Parser.verbose = true;
	const image = dicomjs.parseImage(data);
	// const w = image.getCols();
	// const h = image.getRows();
	// const scale = Math.min(1, Math.min(4096 / w, 4096 / h));
	const scale = 1.0;
	return dicomjs.render(image, canvas, scale);
};

const readFile = (file) => new Promise((resolve, reject) => {
	if (!file) {
		return reject(Error("no file!"));
	}

	const blob = file.slice(0, file.size);
	const reader = new FileReader();
	console.time("load");
	reader.onloadend = (evt) => {
		if (evt.target.readyState === FileReader.DONE) {
			console.timeEnd("load");
			return resolve(evt.target.result);
		}
		return reject(Error("could not load!"));
	};
	reader.readAsArrayBuffer(blob);
	return null;
});

export default readFile;

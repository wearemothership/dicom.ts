# dicom.js

> A small, fast, javascript DICOM renderer

[![NPM](https://img.shields.io/npm/v/dicom.js.svg)](https://www.npmjs.com/package/dicom.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


# background
We had a requirement to display greyscale, single frame dicom files as quickly as possible in the browser.  Cornerstone.js, which seems ubiquitous and feature rich - just seemed too big and complex for the task, and saw that performance could be improved.  Thought it was worth investigating accelerating things as much as possible with WebGl.

This is the result!

By tightly integrating the parser, decoders and renderer, moving as much as possibile to the GPU (LUT & palette conversion etc), and using safari's native jpeg2000 decoder, some decent perfomance improvements over cornerstone can be seen; ranging from 10% to 1800% faster, depending on the image type and wether it was the first decode of the library.  Also library size is about a 5th of using core & wado loader.

see ./example-vs-cornerstone for how we came up with the comparison figures.

## Install

```bash
npm install --save dicom.js
```

## Usage

### Run the example

```bash
git clone https://github.com/wearemothership/dicom.js
cd dicom.js
npm i
npm run build
cd example
npm i
npm start
```

### Run dicom.js vs cornerston.js performance example
Same as above, but change example for

### Display on given canvas
```js
import dicomjs from 'dicom.js'

const displayDicom = async (canvas, buffer) => {
	try {
		// get the DCM image
		const image = dicomjs.parseImage(buffer);

		// access any tags needed, common ones have parameters
		console.log("PatientID:", image.patientID);
		// or use the DICOM tag group, element id pairs
		console.log("PatientName:", image.getTagValue([0x0010, 0x0010]));

		// create the renderer (keeping hold of an instance can
		// improve 2nd image decode performance)
		const renderer = new dicomjs.Renderer(canvas);

		// decode, and display frame 0 on the canvas
		await renderer.render(image, 0);


	}
	catch (e) {
		// ...
		console.error(e);
	}
}

// get an ArrayBuffer of the file
const dataBuffer = ...

// get your canvas, and ensure add to the DOM
// dicomjs will create one if none provided
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

displayDicom(canvas, dataBuffer);

```

## Todo
- consistent error handling
- improve memory management.  Can we share decoder wasm heap?
- load series
- seperate out react lib?
- ~~add standalone React canvas example~~
- ~~pixel padding support on > contrastify program~~
- ~~some images are not perfect with cornerstone, what is correct?~~
- ~~accelerate palette conversion~~
- ~~planar config~~
- ~~palette conversion does not work see ./test/issues~~
- ~~code coverage~~
- ~~make sure adhere to licenses...~~
- ~~J2KI files slower than cornerstone~~
- ~~scale / maxsize~~
- ~~LL decoder can be slower than cornerstones~~
- ~~add typescript support~~
- ~~complete ts impl~~
- ~~fix microbundle warnings~~
- ~~fix cornerstone comparison example~~
- ~~add test framework~~
- ~~seperate out decoders from parser~~
- ~~seperate programs~~
- ~~currently only supports rendering frame 0!~~
## Used by:
vPOP PRO:
https://vpop-pro.com

## License

MIT © [wearemothership](https://github.com/wearemothership)

parser based heavily on https://github.com/rii-mango/Daikon
thank you - RII-UTHSCSA / martinezmj

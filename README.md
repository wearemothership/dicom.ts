# dicom.js

> A small, fast, javascript DICOM renderer

[![NPM](https://img.shields.io/npm/v/dicom.js.svg)](https://www.npmjs.com/package/dicom.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


# background
Was in the need of displaying greyscale, single frame dicom files as quickly as possible in the browser.  Cornerstone just seemed too big and complex for the task, it also slow even using the webgl renderer for some images.

This is the result!

By tightly integrating the parser, decoders and renderer, some decent perfomance improvements over cornerstone can be seen; ranging from 10% to 1200% faster, depending on the image type and wether it was the first decode of the library.

see ./example-vs-cornerstone for how we came up with those figures.

## Todo
- consistent error handling
- improve memory management.  Can we share decoder wasm heap?
- add standalone React canvas example
- load series
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

## Install

```bash
npm install --save dicom.js
```

## Usage

### Display on given canvas
```js
import dicomjs from 'dicom.js'

const displayDicom = async (canvas, buffer) => {
	try {
		const image = dicomjs.parseImage(buffer);
		const renderer = new dicomjs.Renderer(canvas);
		const frameNumber = 0;
		await renderer.render(image, frameNumber);
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

## License

MIT © [wearemothership](https://github.com/wearemothership)

parser based heavily on https://github.com/rii-mango/Daikon
thank you - RII-UTHSCSA / martinezmj

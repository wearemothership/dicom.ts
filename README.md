# dicom.ts
**A small, super-fast javascript DICOM renderer**

<!-- INTRODUCTION -->
We had a requirement to display greyscale, single frame dicom files as quickly as possible in the browser. Cornerstone.js, which seems ubiquitous and feature rich - just seemed too big and complex for the task, and saw that performance could be improved. We thought it was worth investigating accelerating things as much as possible with WebGl.

By tightly integrating the parser, decoders and renderer, moving as much as possibile to the GPU (LUT & palette conversion etc), only allowing modern browsers and using browsers jpeg decoder & safari's native jpeg2000 decoder (now deprecated!), some decent perfomance improvements over cornerstone can be seen; ranging from 10% to 1800% faster, depending on the image type and wether it was the first decode of the library. Also library size is about a 5th of using cornerstone core & wado loader, so page load times will be quicker too.
****



<!-- GETTING STARTED -->
### Getting Started
To get a local copy up and running follow these simple steps.

#### Prerequisites
- [node](https://nodejs.org/en/download/)
- [npm](https://www.npmjs.com)

#### Install via [npm](https://www.npmjs.com)
```bash
npm install --save dicom.ts
```

#### Or clone locally
```bash
git clone https://github.com/wearemothership/dicom.ts
```
****



<!-- DEMO EXAMPLES -->
### Demo
We have provied some demos of how this can be used in your project.

#### Online demos
- [Simple](https://wearemothership.github.io/dicom.ts)
- [dicom.ts vs cornerstone.js performance](https://wearemothership.github.io/dicom.ts/#/vs-cornerstone)

#### Or build and run the demos locally
```bash
git clone https://github.com/wearemothership/dicom.ts
cd dicom.ts
npm install
npm run build
```

#### dicom.ts vs cornerstone.js performance demo
```bash
cd example-vs-cornerstone
npm install
npm start
```
Some DICOM test files can be found in:
```
dicom.ts/node_modules/dicom-test-files/
```
****



<!-- USAGE EXAMPLES -->
### Usage
Some usage examples of how this can be used in you project.

#### Display on a given canvas
```js
import dicomjs from 'dicom.ts'

const displayDicom = async (canvas, buffer) => {
	try {
		// get the DCM image
		const image = dicomjs.parseImage(buffer);

		// access any tags needed, common ones have parameters
		console.log("PatientID:", image.patientID);
		// or use the DICOM tag group, element id pairs
		console.log("PatientName:", image.getTagValue([0x0010, 0x0010]));

		// create the renderer (keeping hold of an instance for the canvas can
		// improve 2nd image decode performance hugely - see examples)
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
****



<!-- ROADMAP -->
### Roadmap
See the [open issues](https://github.com/wearemothership/dicom.ts/issues) for a list of proposed features (and known issues).
****



<!-- CONTRIBUTING -->
### Contributing
Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
****



<!-- LICENSE -->
### License
Distributed under the MIT License.
https://github.com/wearemothership/dicom.ts/blob/main/LICENSE.md

Copyright (c) 2025 [Mothership Software Ltd.](https://github.com/wearemothership.com)
****


<!-- ACKNOWLEDGEMENTS -->
### Acknowledgements
Parser based heavily on https://github.com/rii-mango/Daikon
thank you - RII-UTHSCSA / martinezmj
****



<!-- CONTACT -->
### Made by Mothership
[wearemothership.com](https://wearemothership.com)
****

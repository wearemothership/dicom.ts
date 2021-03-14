# dicom.js

> A small, fast, javascript DICOM renderer

[![NPM](https://img.shields.io/npm/v/dicom.js.svg)](https://www.npmjs.com/package/dicom.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


# background
Was in the need of displaying greyscale, single frame dicom files as quickly as possible in the browser.  Cornerstone just seemed too big and complex for the task, it also seemed slow even using the webgl renderer.

This is the result!

By tightly integrating the parser, decoders and renderer, some decent perfomance improvements over cornerstone can be seen; ranging from 1.1 to 12 times faster, depending on the image and wether it was the first decode of the library.

## Todo

- add standalone React canvas example
- some images are not perfect with cornerstone, what is correct?
- accelerate palette conversion
- load series
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

fix this:
```jsx
import React, { Component } from 'react'

import DICOMCanvas from 'dicom.js'
import 'dicom.js/dist/index.css'

class Example extends Component {
  render() {
    return <MyComponent />
  }
}
```

## License

MIT © [mothershipsoft](https://github.com/mothershipsoft)

parser based heavily on https://github.com/rii-mango/Daikon
thank you - RII-UTHSCSA / martinezmj

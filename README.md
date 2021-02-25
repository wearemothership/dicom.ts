# dicom.js

> A small, fast, javascript DICOM renderer

[![NPM](https://img.shields.io/npm/v/dicom.js.svg)](https://www.npmjs.com/package/dicom.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


# background
Was in need to display greyscale, single frame dicom files as quickly as possible in the browser.  Cornerstone just seemed too big and complex for the task.

This is the result!

## Todo
- make sure adhere to licenses...
- fix microbundle warnings
- fix cornerstone comparison example
- add standalone React canvas example
- add test framework
- palette conversion does not work see ./test/issues
- some images are not perfect with cornerstone
- ll decoder can be slower than cornerstones
- seperate out decoders from parser
- currently only supports rendering frame 0!
- accelerate palette conversion


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
license bellow:
/*!
 * Copyright (c) 2012-2013, RII-UTHSCSA
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 *   disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
 *   disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * - Neither the name of the RII-UTHSCSA nor the names of its contributors may be used to endorse or promote products
 *   derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// Adapted from: https://github.com/chafey/cornerstoneWADOImageLoader/blob/73ed7c4bbbd275bb0f7f9f363ef82575c17bb5f1/src/webWorker/decodeTask/decoders/decodeJPEGLS.js
/*!
 The MIT License (MIT)

 Copyright (c) 2014 Chris Hafey (chafey@gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/* eslint-disable */

"use strict";

import CharLS from './charLS-FixedMemory-browser.js';

let charLS;

function jpegLSDecode(data, isSigned) {
  // prepare input parameters
  const dataPtr = charLS._malloc(data.length);

  // charLS.writeArrayToMemory(data, dataPtr);
  charLS.HEAP8.set(data, dataPtr); // should be a bit faster than writeArrayToMemory

  // prepare output parameters
  const imagePtrPtr = charLS._malloc(4);
  const imageSizePtr = charLS._malloc(4);
  const widthPtr = charLS._malloc(4);
  const heightPtr = charLS._malloc(4);
  const bitsPerSamplePtr = charLS._malloc(4);
  const stridePtr = charLS._malloc(4);
  const allowedLossyErrorPtr = charLS._malloc(4);
  const componentsPtr = charLS._malloc(4);
  const interleaveModePtr = charLS._malloc(4);

  // Decode the image
  const result = charLS.ccall(
    'jpegls_decode',
    'number',
    [
      'number',
      'number',
      'number',
      'number',
      'number',
      'number',
      'number',
      'number',
      'number',
      'number',
      'number',
    ],
    [
      dataPtr,
      data.length,
      imagePtrPtr,
      imageSizePtr,
      widthPtr,
      heightPtr,
      bitsPerSamplePtr,
      stridePtr,
      componentsPtr,
      allowedLossyErrorPtr,
      interleaveModePtr,
    ]
  );

  // Extract result values into object
  const image = {
    result,
    width: charLS.getValue(widthPtr, 'i32'),
    height: charLS.getValue(heightPtr, 'i32'),
    bitsPerSample: charLS.getValue(bitsPerSamplePtr, 'i32'),
    stride: charLS.getValue(stridePtr, 'i32'),
    components: charLS.getValue(componentsPtr, 'i32'),
    allowedLossyError: charLS.getValue(allowedLossyErrorPtr, 'i32'),
    interleaveMode: charLS.getValue(interleaveModePtr, 'i32'),
    pixelData: undefined,
  };

  // Copy image from emscripten heap into appropriate array buffer type
  const imagePtr = charLS.getValue(imagePtrPtr, '*');

  const size = image.width * image.height * image.components;
  if (image.bitsPerSample <= 8) {
    image.pixelData = new Uint8Array(new Uint8Array(charLS.HEAP8.buffer, imagePtr, size));
  } else if (isSigned) {
    image.pixelData = new Int16Array(new Int16Array(charLS.HEAP16.buffer, imagePtr, size));
  } else {
    image.pixelData =  new Uint16Array(new Uint16Array(charLS.HEAP16.buffer, imagePtr, size));
  }

  // free memory and return image object
  charLS._free(dataPtr);
  charLS._free(imagePtr);
  charLS._free(imagePtrPtr);
  charLS._free(imageSizePtr);
  charLS._free(widthPtr);
  charLS._free(heightPtr);
  charLS._free(bitsPerSamplePtr);
  charLS._free(stridePtr);
  charLS._free(componentsPtr);
  charLS._free(interleaveModePtr);

  return image;
}

function initializeJPEGLS() {
  // check to make sure codec is loaded
  if (typeof CharLS === 'undefined') {
    throw new Error('No JPEG-LS decoder loaded');
  }

  // Try to initialize CharLS
  // CharLS https://github.com/cornerstonejs/charls
  if (!charLS) {
    charLS = CharLS();
    if (!charLS || !charLS._jpegls_decode) {
      throw new Error('JPEG-LS failed to initialize');
    }
  }
}

function decodeJPEGLS(imageFrame, pixelData) {
  initializeJPEGLS();

  const image = jpegLSDecode(pixelData, imageFrame.pixelRepresentation === 1);

  // throw error if not success or too much data
  if (image.result !== 0 && image.result !== 6) {
    throw new Error(
      `JPEG-LS decoder failed to decode frame (error code ${image.result})`
    );
  }

  imageFrame.columns = image.width;
  imageFrame.rows = image.height;
  imageFrame.pixelData = image.pixelData;

  return imageFrame;
}

export default decodeJPEGLS;
export { initializeJPEGLS };
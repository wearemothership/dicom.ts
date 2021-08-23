import React from "react";
import ReactDOM from "react-dom";

import {
	mockDOM,
	WebGLRenderingContext,
	WebGLActiveInfo,
	WebGLFramebuffer,
	WebGLBuffer,
	WebGLDrawingBufferWrapper,
	WebGLProgram,
	WebGLRenderbuffer,
	WebGLShader,
	WebGLShaderPrecisionFormat,
	WebGLTexture,
	WebGLUniformLocation
} from "node-canvas-webgl";

import App from "./App";
// eslint-disable-next-line no-undef
if (!globalThis.fetch) {
	// eslint-disable-next-line no-undef
	globalThis.fetch = fetch;
}

// need to be global (as they would be in browser) for twgl to get them!
window.WebGLRenderingContext = WebGLRenderingContext;
window.WebGLActiveInfo = WebGLActiveInfo;
window.WebGLFramebuffer = WebGLFramebuffer;
window.WebGLBuffer = WebGLBuffer;
window.WebGLDrawingBufferWrapper = WebGLDrawingBufferWrapper;
window.WebGLProgram = WebGLProgram;
window.WebGLRenderbuffer = WebGLRenderbuffer;
window.WebGLShader = WebGLShader;
window.WebGLShaderPrecisionFormat = WebGLShaderPrecisionFormat;
window.WebGLTexture = WebGLTexture;
window.WebGLUniformLocation = WebGLUniformLocation;

mockDOM(window);

it("renders without crashing", () => {
	const div = document.createElement("div");
	ReactDOM.render(<App />, div);
	ReactDOM.unmountComponentAtNode(div);
	expect(true).toBeTruthy();
});

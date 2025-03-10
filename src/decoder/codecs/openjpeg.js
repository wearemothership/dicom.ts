// MIT License

// Copyright (c) 2020 Chris Hafey

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* istanbul ignore file */

/* eslint-disable */
import openjpegWasm from "./openjpeg.wasm?arraybuffer";

var OpenJPEGWASM = (function () {
	var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
	if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
	return (
		function (OpenJPEGWASM) {
			OpenJPEGWASM = OpenJPEGWASM || {};

			var Module = typeof OpenJPEGWASM !== "undefined" ? OpenJPEGWASM : {};
			var moduleOverrides = {};
			var key;
			for (key in Module) {
				if (Module.hasOwnProperty(key)) {
					moduleOverrides[key] = Module[key]
				}
			}
			var arguments_ = [];
			var thisProgram = "./this.program";
			var quit_ = function (status, toThrow) {
				throw toThrow
			};
			var ENVIRONMENT_IS_WEB = false;
			var ENVIRONMENT_IS_WORKER = false;
			var ENVIRONMENT_IS_NODE = false;
			var ENVIRONMENT_HAS_NODE = false;
			var ENVIRONMENT_IS_SHELL = false;
			ENVIRONMENT_IS_WEB = typeof window === "object";
			ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
			ENVIRONMENT_HAS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
			ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
			ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

			var scriptDirectory = "";

			function locateFile(path) {
				if (Module["locateFile"]) {
					return Module["locateFile"](path, scriptDirectory)
				}
				return scriptDirectory + path
			}
			var read_, readAsync, readBinary, setWindowTitle;
			var nodeFS;
			var nodePath;
			if (ENVIRONMENT_HAS_NODE) {
				scriptDirectory = __dirname + "/";
				read_ = function shell_read(filename, binary) {
					if (!nodeFS) nodeFS = require("fs");
					if (!nodePath) nodePath = require("path");
					filename = nodePath["normalize"](filename);
					return nodeFS["readFileSync"](filename, binary ? null : "utf8")
				};
				readBinary = function readBinary(filename) {
					var ret = read_(filename, true);
					if (!ret.buffer) {
						ret = new Uint8Array(ret)
					}
					assert(ret.buffer);
					return ret
				};
				if (process["argv"].length > 1) {
					thisProgram = process["argv"][1].replace(/\\/g, "/")
				}
				arguments_ = process["argv"].slice(2);
				process["on"]("uncaughtException", function (ex) {
					if (!(ex instanceof ExitStatus)) {
						throw ex
					}
				});
				process["on"]("unhandledRejection", abort);
				quit_ = function (status) {
					process["exit"](status)
				};
				Module["inspect"] = function () {
					return "[Emscripten Module object]"
				}
			} else if (ENVIRONMENT_IS_SHELL) {
				if (typeof read != "undefined") {
					read_ = function shell_read(f) {
						return read(f)
					}
				}
				readBinary = function readBinary(f) {
					var data;
					if (typeof readbuffer === "function") {
						return new Uint8Array(readbuffer(f))
					}
					data = read(f, "binary");
					assert(typeof data === "object");
					return data
				};
				if (typeof scriptArgs != "undefined") {
					arguments_ = scriptArgs
				} else if (typeof arguments != "undefined") {
					arguments_ = arguments
				}
				if (typeof quit === "function") {
					quit_ = function (status) {
						quit(status)
					}
				}
				if (typeof print !== "undefined") {
					if (typeof console === "undefined") console = {};
					console.log = print;
					console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
				}
			} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
				if (ENVIRONMENT_IS_WORKER) {
					scriptDirectory = self.location.href
				} else if (document.currentScript) {
					scriptDirectory = document.currentScript.src
				}
				if (_scriptDir) {
					scriptDirectory = _scriptDir
				}
				if (scriptDirectory.indexOf("blob:") !== 0) {
					scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
				} else {
					scriptDirectory = ""
				} {
					read_ = function shell_read(url) {
						var xhr = new XMLHttpRequest;
						xhr.open("GET", url, false);
						xhr.send(null);
						return xhr.responseText
					};
					if (ENVIRONMENT_IS_WORKER) {
						readBinary = function readBinary(url) {
							var xhr = new XMLHttpRequest;
							xhr.open("GET", url, false);
							xhr.responseType = "arraybuffer";
							xhr.send(null);
							return new Uint8Array(xhr.response)
						}
					}
					readAsync = function readAsync(url, onload, onerror) {
						var xhr = new XMLHttpRequest;
						xhr.open("GET", url, true);
						xhr.responseType = "arraybuffer";
						xhr.onload = function xhr_onload() {
							if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
								onload(xhr.response);
								return
							}
							onerror()
						};
						xhr.onerror = onerror;
						xhr.send(null)
					}
				}
				setWindowTitle = function (title) {
					document.title = title
				}
			} else {}
			// var out = Module["print"] || console.log.bind(console);
			var out = () => {}; // ignore info for now
			var err = Module["printErr"] || console.warn.bind(console);
			for (key in moduleOverrides) {
				if (moduleOverrides.hasOwnProperty(key)) {
					Module[key] = moduleOverrides[key]
				}
			}
			moduleOverrides = null;
			if (Module["arguments"]) arguments_ = Module["arguments"];
			if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
			if (Module["quit"]) quit_ = Module["quit"];
			var STACK_ALIGN = 16;

			function dynamicAlloc(size) {
				var ret = HEAP32[DYNAMICTOP_PTR >> 2];
				var end = ret + size + 15 & -16;
				if (end > _emscripten_get_heap_size()) {
					abort()
				}
				HEAP32[DYNAMICTOP_PTR >> 2] = end;
				return ret
			}

			function getNativeTypeSize(type) {
				switch (type) {
					case "i1":
					case "i8":
						return 1;
					case "i16":
						return 2;
					case "i32":
						return 4;
					case "i64":
						return 8;
					case "float":
						return 4;
					case "double":
						return 8;
					default: {
						if (type[type.length - 1] === "*") {
							return 4
						} else if (type[0] === "i") {
							var bits = parseInt(type.substr(1));
							assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
							return bits / 8
						} else {
							return 0
						}
					}
				}
			}

			function warnOnce(text) {
				if (!warnOnce.shown) warnOnce.shown = {};
				if (!warnOnce.shown[text]) {
					warnOnce.shown[text] = 1;
					err(text)
				}
			}
			var asm2wasmImports = {
				"f64-rem": function (x, y) {
					return x % y
				},
				"debugger": function () {}
			};
			var jsCallStartIndex = 1;
			var functionPointers = new Array(0);

			function convertJsFunctionToWasm(func, sig) {
				if (typeof WebAssembly.Function === "function") {
					var typeNames = {
						"i": "i32",
						"j": "i64",
						"f": "f32",
						"d": "f64"
					};
					var type = {
						parameters: [],
						results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
					};
					for (var i = 1; i < sig.length; ++i) {
						type.parameters.push(typeNames[sig[i]])
					}
					return new WebAssembly.Function(type, func)
				}
				var typeSection = [1, 0, 1, 96];
				var sigRet = sig.slice(0, 1);
				var sigParam = sig.slice(1);
				var typeCodes = {
					"i": 127,
					"j": 126,
					"f": 125,
					"d": 124
				};
				typeSection.push(sigParam.length);
				for (var i = 0; i < sigParam.length; ++i) {
					typeSection.push(typeCodes[sigParam[i]])
				}
				if (sigRet == "v") {
					typeSection.push(0)
				} else {
					typeSection = typeSection.concat([1, typeCodes[sigRet]])
				}
				typeSection[1] = typeSection.length - 2;
				var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
				var module = new WebAssembly.Module(bytes);
				var instance = new WebAssembly.Instance(module, {
					"e": {
						"f": func
					}
				});
				var wrappedFunc = instance.exports["f"];
				return wrappedFunc
			}
			var funcWrappers = {};

			function dynCall(sig, ptr, args) {
				if (args && args.length) {
					return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
				} else {
					return Module["dynCall_" + sig].call(null, ptr)
				}
			}
			var tempRet0 = 0;
			var setTempRet0 = function (value) {
				tempRet0 = value
			};
			var getTempRet0 = function () {
				return tempRet0
			};
			var wasmBinary;
			if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
			var noExitRuntime;
			if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
			if (typeof WebAssembly !== "object") {
				err("no native wasm support detected")
			}

			function setValue(ptr, value, type, noSafe) {
				type = type || "i8";
				if (type.charAt(type.length - 1) === "*") type = "i32";
				switch (type) {
					case "i1":
						HEAP8[ptr >> 0] = value;
						break;
					case "i8":
						HEAP8[ptr >> 0] = value;
						break;
					case "i16":
						HEAP16[ptr >> 1] = value;
						break;
					case "i32":
						HEAP32[ptr >> 2] = value;
						break;
					case "i64":
						tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
						break;
					case "float":
						HEAPF32[ptr >> 2] = value;
						break;
					case "double":
						HEAPF64[ptr >> 3] = value;
						break;
					default:
						abort("invalid type for setValue: " + type)
				}
			}
			var wasmMemory;
			var wasmTable = new WebAssembly.Table({
				"initial": 370,
				"maximum": 370,
				"element": "anyfunc"
			});
			var ABORT = false;
			var EXITSTATUS = 0;

			function assert(condition, text) {
				if (!condition) {
					abort("Assertion failed: " + text)
				}
			}

			function getCFunc(ident) {
				var func = Module["_" + ident];
				assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
				return func
			}

			function ccall(ident, returnType, argTypes, args, opts) {
				var toC = {
					"string": function (str) {
						var ret = 0;
						if (str !== null && str !== undefined && str !== 0) {
							var len = (str.length << 2) + 1;
							ret = stackAlloc(len);
							stringToUTF8(str, ret, len)
						}
						return ret
					},
					"array": function (arr) {
						var ret = stackAlloc(arr.length);
						writeArrayToMemory(arr, ret);
						return ret
					}
				};

				function convertReturnValue(ret) {
					if (returnType === "string") return UTF8ToString(ret);
					if (returnType === "boolean") return Boolean(ret);
					return ret
				}
				var func = getCFunc(ident);
				var cArgs = [];
				var stack = 0;
				if (args) {
					for (var i = 0; i < args.length; i++) {
						var converter = toC[argTypes[i]];
						if (converter) {
							if (stack === 0) stack = stackSave();
							cArgs[i] = converter(args[i])
						} else {
							cArgs[i] = args[i]
						}
					}
				}
				var ret = func.apply(null, cArgs);
				ret = convertReturnValue(ret);
				if (stack !== 0) stackRestore(stack);
				return ret
			}
			var ALLOC_NONE = 3;

			function getMemory(size) {
				if (!runtimeInitialized) return dynamicAlloc(size);
				return _malloc(size)
			}
			var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

			function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
				var endIdx = idx + maxBytesToRead;
				var endPtr = idx;
				while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
				if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
					return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
				} else {
					var str = "";
					while (idx < endPtr) {
						var u0 = u8Array[idx++];
						if (!(u0 & 128)) {
							str += String.fromCharCode(u0);
							continue
						}
						var u1 = u8Array[idx++] & 63;
						if ((u0 & 224) == 192) {
							str += String.fromCharCode((u0 & 31) << 6 | u1);
							continue
						}
						var u2 = u8Array[idx++] & 63;
						if ((u0 & 240) == 224) {
							u0 = (u0 & 15) << 12 | u1 << 6 | u2
						} else {
							u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
						}
						if (u0 < 65536) {
							str += String.fromCharCode(u0)
						} else {
							var ch = u0 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
						}
					}
				}
				return str
			}

			function UTF8ToString(ptr, maxBytesToRead) {
				return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
			}

			function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
				if (!(maxBytesToWrite > 0)) return 0;
				var startIdx = outIdx;
				var endIdx = outIdx + maxBytesToWrite - 1;
				for (var i = 0; i < str.length; ++i) {
					var u = str.charCodeAt(i);
					if (u >= 55296 && u <= 57343) {
						var u1 = str.charCodeAt(++i);
						u = 65536 + ((u & 1023) << 10) | u1 & 1023
					}
					if (u <= 127) {
						if (outIdx >= endIdx) break;
						outU8Array[outIdx++] = u
					} else if (u <= 2047) {
						if (outIdx + 1 >= endIdx) break;
						outU8Array[outIdx++] = 192 | u >> 6;
						outU8Array[outIdx++] = 128 | u & 63
					} else if (u <= 65535) {
						if (outIdx + 2 >= endIdx) break;
						outU8Array[outIdx++] = 224 | u >> 12;
						outU8Array[outIdx++] = 128 | u >> 6 & 63;
						outU8Array[outIdx++] = 128 | u & 63
					} else {
						if (outIdx + 3 >= endIdx) break;
						outU8Array[outIdx++] = 240 | u >> 18;
						outU8Array[outIdx++] = 128 | u >> 12 & 63;
						outU8Array[outIdx++] = 128 | u >> 6 & 63;
						outU8Array[outIdx++] = 128 | u & 63
					}
				}
				outU8Array[outIdx] = 0;
				return outIdx - startIdx
			}

			function stringToUTF8(str, outPtr, maxBytesToWrite) {
				return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
			}

			function lengthBytesUTF8(str) {
				var len = 0;
				for (var i = 0; i < str.length; ++i) {
					var u = str.charCodeAt(i);
					if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
					if (u <= 127) ++len;
					else if (u <= 2047) len += 2;
					else if (u <= 65535) len += 3;
					else len += 4
				}
				return len
			}
			var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

			function allocateUTF8(str) {
				var size = lengthBytesUTF8(str) + 1;
				var ret = _malloc(size);
				if (ret) stringToUTF8Array(str, HEAP8, ret, size);
				return ret
			}

			function writeArrayToMemory(array, buffer) {
				HEAP8.set(array, buffer)
			}

			function writeAsciiToMemory(str, buffer, dontAddNull) {
				for (var i = 0; i < str.length; ++i) {
					HEAP8[buffer++ >> 0] = str.charCodeAt(i)
				}
				if (!dontAddNull) HEAP8[buffer >> 0] = 0
			}
			var PAGE_SIZE = 16384;
			var WASM_PAGE_SIZE = 65536;

			function alignUp(x, multiple) {
				if (x % multiple > 0) {
					x += multiple - x % multiple
				}
				return x
			}
			var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

			function updateGlobalBufferAndViews(buf) {
				buffer = buf;
				Module["HEAP8"] = HEAP8 = new Int8Array(buf);
				Module["HEAP16"] = HEAP16 = new Int16Array(buf);
				Module["HEAP32"] = HEAP32 = new Int32Array(buf);
				Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
				Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
				Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
				Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
				Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
			}
			var STACK_BASE = 38704,
				DYNAMIC_BASE = 5281584,
				DYNAMICTOP_PTR = 38512;
			var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 1073741824;
			if (Module["wasmMemory"]) {
				wasmMemory = Module["wasmMemory"]
			} else {
				wasmMemory = new WebAssembly.Memory({
					"initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
				})
			}
			if (wasmMemory) {
				buffer = wasmMemory.buffer
			}
			INITIAL_TOTAL_MEMORY = buffer.byteLength;
			updateGlobalBufferAndViews(buffer);
			HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

			function callRuntimeCallbacks(callbacks) {
				while (callbacks.length > 0) {
					var callback = callbacks.shift();
					if (typeof callback == "function") {
						callback();
						continue
					}
					var func = callback.func;
					if (typeof func === "number") {
						if (callback.arg === undefined) {
							Module["dynCall_v"](func)
						} else {
							Module["dynCall_vi"](func, callback.arg)
						}
					} else {
						func(callback.arg === undefined ? null : callback.arg)
					}
				}
			}
			var __ATPRERUN__ = [];
			var __ATINIT__ = [];
			var __ATMAIN__ = [];
			var __ATPOSTRUN__ = [];
			var runtimeInitialized = false;
			var runtimeExited = false;

			function preRun() {
				if (Module["preRun"]) {
					if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
					while (Module["preRun"].length) {
						addOnPreRun(Module["preRun"].shift())
					}
				}
				callRuntimeCallbacks(__ATPRERUN__)
			}

			function initRuntime() {
				runtimeInitialized = true;
				callRuntimeCallbacks(__ATINIT__)
			}

			function preMain() {
				callRuntimeCallbacks(__ATMAIN__)
			}

			function exitRuntime() {
				runtimeExited = true
			}

			function postRun() {
				if (Module["postRun"]) {
					if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
					while (Module["postRun"].length) {
						addOnPostRun(Module["postRun"].shift())
					}
				}
				callRuntimeCallbacks(__ATPOSTRUN__)
			}

			function addOnPreRun(cb) {
				__ATPRERUN__.unshift(cb)
			}

			function addOnPostRun(cb) {
				__ATPOSTRUN__.unshift(cb)
			}
			var Math_abs = Math.abs;
			var Math_ceil = Math.ceil;
			var Math_floor = Math.floor;
			var Math_min = Math.min;
			var runDependencies = 0;
			var runDependencyWatcher = null;
			var dependenciesFulfilled = null;

			function addRunDependency(id) {
				runDependencies++;
				if (Module["monitorRunDependencies"]) {
					Module["monitorRunDependencies"](runDependencies)
				}
			}

			function removeRunDependency(id) {
				runDependencies--;
				if (Module["monitorRunDependencies"]) {
					Module["monitorRunDependencies"](runDependencies)
				}
				if (runDependencies == 0) {
					if (runDependencyWatcher !== null) {
						clearInterval(runDependencyWatcher);
						runDependencyWatcher = null
					}
					if (dependenciesFulfilled) {
						var callback = dependenciesFulfilled;
						dependenciesFulfilled = null;
						callback()
					}
				}
			}
			Module["preloadedImages"] = {};
			Module["preloadedAudios"] = {};

			function abort(what) {
				if (Module["onAbort"]) {
					Module["onAbort"](what)
				}
				what += "";
				out(what);
				err(what);
				ABORT = true;
				EXITSTATUS = 1;
				what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
				throw new WebAssembly.RuntimeError(what)
			}
			var dataURIPrefix = "data:application/octet-stream;base64,";

			function isDataURI(filename) {
				return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
			}
			var wasmBinaryFile = undefined;

			function getBinary() {
				try {
					if (wasmBinary) {
						return new Uint8Array(wasmBinary)
					}
					if (readBinary) {
						return readBinary(wasmBinaryFile)
					} else {
						throw "both async and sync fetching of the wasm failed"
					}
				} catch (err) {
					abort(err)
				}
			}

			function getBinaryPromise() {
				if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
					return fetch(wasmBinaryFile, {
						credentials: "same-origin"
					}).then(function (response) {
						if (!response["ok"]) {
							throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
						}
						return response["arrayBuffer"]()
					}).catch(function () {
						return getBinary()
					})
				}
				return new Promise(function (resolve, reject) {
					resolve(getBinary())
				})
			}

			function createWasm() {
				var info = {
					"env": asmLibraryArg,
					"wasi_unstable": asmLibraryArg,
					"global": {
						"NaN": NaN,
						Infinity: Infinity
					},
					"global.Math": Math,
					"asm2wasm": asm2wasmImports
				};

				function receiveInstance(instance, module) {
					var exports = instance.exports;
					Module["asm"] = exports;
					removeRunDependency("wasm-instantiate")
				}
				addRunDependency("wasm-instantiate");

				function receiveInstantiatedSource(output) {
					receiveInstance(output["instance"])
				}

				function instantiateArrayBuffer(receiver) {
					return getBinaryPromise().then(function (binary) {
						return WebAssembly.instantiate(binary, info)
					}).then(receiver, function (reason) {
						err("failed to asynchronously prepare wasm: " + reason);
						abort(reason)
					})
				}

				function instantiateAsync() {
					if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
						fetch(wasmBinaryFile, {
							credentials: "same-origin"
						}).then(function (response) {
							var result = WebAssembly.instantiateStreaming(response, info);
							return result.then(receiveInstantiatedSource, function (reason) {
								err("wasm streaming compile failed: " + reason);
								err("falling back to ArrayBuffer instantiation");
								instantiateArrayBuffer(receiveInstantiatedSource)
							})
						})
					} else {
						return instantiateArrayBuffer(receiveInstantiatedSource)
					}
				}
				if (Module["instantiateWasm"]) {
					try {
						var exports = Module["instantiateWasm"](info, receiveInstance);
						return exports
					} catch (e) {
						err("Module.instantiateWasm callback failed with error: " + e);
						return false
					}
				}
				if (openjpegWasm) {
					return WebAssembly
						.instantiate(openjpegWasm, info)
						.then(receiveInstantiatedSource, function (reason) {
						err("failed to asynchronously prepare wasm: " + reason);
						abort(reason)
					})
				}
				else {
					instantiateAsync();
				}
				return {}
			}
			Module["asm"] = createWasm;
			var tempDouble;
			var tempI64;
			__ATINIT__.push({
				func: function () {
					globalCtors()
				}
			});
			var tempDoublePtr = 38688;

			function demangle(func) {
				return func
			}

			function demangleAll(text) {
				var regex = /\b__Z[\w\d_]+/g;
				return text.replace(regex, function (x) {
					var y = demangle(x);
					return x === y ? x : y + " [" + x + "]"
				})
			}

			function jsStackTrace() {
				var err = new Error;
				if (!err.stack) {
					try {
						throw new Error(0)
					} catch (e) {
						err = e
					}
					if (!err.stack) {
						return "(no stack trace available)"
					}
				}
				return err.stack.toString()
			}

			function stackTrace() {
				var js = jsStackTrace();
				if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
				return demangleAll(js)
			}
			var ENV = {};

			function ___buildEnvironment(environ) {
				var MAX_ENV_VALUES = 64;
				var TOTAL_ENV_SIZE = 1024;
				var poolPtr;
				var envPtr;
				if (!___buildEnvironment.called) {
					___buildEnvironment.called = true;
					ENV["USER"] = "web_user";
					ENV["LOGNAME"] = "web_user";
					ENV["PATH"] = "/";
					ENV["PWD"] = "/";
					ENV["HOME"] = "/home/web_user";
					ENV["LANG"] = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
					ENV["_"] = thisProgram;
					poolPtr = getMemory(TOTAL_ENV_SIZE);
					envPtr = getMemory(MAX_ENV_VALUES * 4);
					HEAP32[envPtr >> 2] = poolPtr;
					HEAP32[environ >> 2] = envPtr
				} else {
					envPtr = HEAP32[environ >> 2];
					poolPtr = HEAP32[envPtr >> 2]
				}
				var strings = [];
				var totalSize = 0;
				for (var key in ENV) {
					if (typeof ENV[key] === "string") {
						var line = key + "=" + ENV[key];
						strings.push(line);
						totalSize += line.length
					}
				}
				if (totalSize > TOTAL_ENV_SIZE) {
					throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
				}
				var ptrSize = 4;
				for (var i = 0; i < strings.length; i++) {
					var line = strings[i];
					writeAsciiToMemory(line, poolPtr);
					HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
					poolPtr += line.length + 1
				}
				HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
			}

			function ___cxa_allocate_exception(size) {
				return _malloc(size)
			}
			var ___exception_infos = {};
			var ___exception_caught = [];

			function ___exception_addRef(ptr) {
				if (!ptr) return;
				var info = ___exception_infos[ptr];
				info.refcount++
			}

			function ___exception_deAdjust(adjusted) {
				if (!adjusted || ___exception_infos[adjusted]) return adjusted;
				for (var key in ___exception_infos) {
					var ptr = +key;
					var adj = ___exception_infos[ptr].adjusted;
					var len = adj.length;
					for (var i = 0; i < len; i++) {
						if (adj[i] === adjusted) {
							return ptr
						}
					}
				}
				return adjusted
			}

			function ___cxa_begin_catch(ptr) {
				var info = ___exception_infos[ptr];
				if (info && !info.caught) {
					info.caught = true;
					__ZSt18uncaught_exceptionv.uncaught_exceptions--
				}
				if (info) info.rethrown = false;
				___exception_caught.push(ptr);
				___exception_addRef(___exception_deAdjust(ptr));
				return ptr
			}
			var ___exception_last = 0;

			function ___cxa_throw(ptr, type, destructor) {
				___exception_infos[ptr] = {
					ptr: ptr,
					adjusted: [ptr],
					type: type,
					destructor: destructor,
					refcount: 0,
					caught: false,
					rethrown: false
				};
				___exception_last = ptr;
				if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
					__ZSt18uncaught_exceptionv.uncaught_exceptions = 1
				} else {
					__ZSt18uncaught_exceptionv.uncaught_exceptions++
				}
				throw ptr
			}

			function ___gxx_personality_v0() {}
			var PATH = {
				splitPath: function (filename) {
					var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
					return splitPathRe.exec(filename).slice(1)
				},
				normalizeArray: function (parts, allowAboveRoot) {
					var up = 0;
					for (var i = parts.length - 1; i >= 0; i--) {
						var last = parts[i];
						if (last === ".") {
							parts.splice(i, 1)
						} else if (last === "..") {
							parts.splice(i, 1);
							up++
						} else if (up) {
							parts.splice(i, 1);
							up--
						}
					}
					if (allowAboveRoot) {
						for (; up; up--) {
							parts.unshift("..")
						}
					}
					return parts
				},
				normalize: function (path) {
					var isAbsolute = path.charAt(0) === "/",
						trailingSlash = path.substr(-1) === "/";
					path = PATH.normalizeArray(path.split("/").filter(function (p) {
						return !!p
					}), !isAbsolute).join("/");
					if (!path && !isAbsolute) {
						path = "."
					}
					if (path && trailingSlash) {
						path += "/"
					}
					return (isAbsolute ? "/" : "") + path
				},
				dirname: function (path) {
					var result = PATH.splitPath(path),
						root = result[0],
						dir = result[1];
					if (!root && !dir) {
						return "."
					}
					if (dir) {
						dir = dir.substr(0, dir.length - 1)
					}
					return root + dir
				},
				basename: function (path) {
					if (path === "/") return "/";
					var lastSlash = path.lastIndexOf("/");
					if (lastSlash === -1) return path;
					return path.substr(lastSlash + 1)
				},
				extname: function (path) {
					return PATH.splitPath(path)[3]
				},
				join: function () {
					var paths = Array.prototype.slice.call(arguments, 0);
					return PATH.normalize(paths.join("/"))
				},
				join2: function (l, r) {
					return PATH.normalize(l + "/" + r)
				}
			};
			var SYSCALLS = {
				buffers: [null, [],
					[]
				],
				printChar: function (stream, curr) {
					var buffer = SYSCALLS.buffers[stream];
					if (curr === 0 || curr === 10) {
						(stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
						buffer.length = 0
					} else {
						buffer.push(curr)
					}
				},
				varargs: 0,
				get: function (varargs) {
					SYSCALLS.varargs += 4;
					var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
					return ret
				},
				getStr: function () {
					var ret = UTF8ToString(SYSCALLS.get());
					return ret
				},
				get64: function () {
					var low = SYSCALLS.get(),
						high = SYSCALLS.get();
					return low
				},
				getZero: function () {
					SYSCALLS.get()
				}
			};

			function _fd_close(fd) {
				try {
					return 0
				} catch (e) {
					if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
					return e.errno
				}
			}

			function ___wasi_fd_close() {
				return _fd_close.apply(null, arguments)
			}

			function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
				try {
					return 0
				} catch (e) {
					if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
					return e.errno
				}
			}

			function ___wasi_fd_seek() {
				return _fd_seek.apply(null, arguments)
			}

			function flush_NO_FILESYSTEM() {
				var fflush = Module["_fflush"];
				if (fflush) fflush(0);
				var buffers = SYSCALLS.buffers;
				if (buffers[1].length) SYSCALLS.printChar(1, 10);
				if (buffers[2].length) SYSCALLS.printChar(2, 10)
			}

			function _fd_write(fd, iov, iovcnt, pnum) {
				try {
					var num = 0;
					for (var i = 0; i < iovcnt; i++) {
						var ptr = HEAP32[iov + i * 8 >> 2];
						var len = HEAP32[iov + (i * 8 + 4) >> 2];
						for (var j = 0; j < len; j++) {
							SYSCALLS.printChar(fd, HEAPU8[ptr + j])
						}
						num += len
					}
					HEAP32[pnum >> 2] = num;
					return 0
				} catch (e) {
					if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
					return e.errno
				}
			}

			function ___wasi_fd_write() {
				return _fd_write.apply(null, arguments)
			}
			var structRegistrations = {};

			function runDestructors(destructors) {
				while (destructors.length) {
					var ptr = destructors.pop();
					var del = destructors.pop();
					del(ptr)
				}
			}

			function simpleReadValueFromPointer(pointer) {
				return this["fromWireType"](HEAPU32[pointer >> 2])
			}
			var awaitingDependencies = {};
			var registeredTypes = {};
			var typeDependencies = {};
			var char_0 = 48;
			var char_9 = 57;

			function makeLegalFunctionName(name) {
				if (undefined === name) {
					return "_unknown"
				}
				name = name.replace(/[^a-zA-Z0-9_]/g, "$");
				var f = name.charCodeAt(0);
				if (f >= char_0 && f <= char_9) {
					return "_" + name
				} else {
					return name
				}
			}

			function createNamedFunction(name, body) {
				name = makeLegalFunctionName(name);
				return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body)
			}

			function extendError(baseErrorType, errorName) {
				var errorClass = createNamedFunction(errorName, function (message) {
					this.name = errorName;
					this.message = message;
					var stack = new Error(message).stack;
					if (stack !== undefined) {
						this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
					}
				});
				errorClass.prototype = Object.create(baseErrorType.prototype);
				errorClass.prototype.constructor = errorClass;
				errorClass.prototype.toString = function () {
					if (this.message === undefined) {
						return this.name
					} else {
						return this.name + ": " + this.message
					}
				};
				return errorClass
			}
			var InternalError = undefined;

			function throwInternalError(message) {
				throw new InternalError(message)
			}

			function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
				myTypes.forEach(function (type) {
					typeDependencies[type] = dependentTypes
				});

				function onComplete(typeConverters) {
					var myTypeConverters = getTypeConverters(typeConverters);
					if (myTypeConverters.length !== myTypes.length) {
						throwInternalError("Mismatched type converter count")
					}
					for (var i = 0; i < myTypes.length; ++i) {
						registerType(myTypes[i], myTypeConverters[i])
					}
				}
				var typeConverters = new Array(dependentTypes.length);
				var unregisteredTypes = [];
				var registered = 0;
				dependentTypes.forEach(function (dt, i) {
					if (registeredTypes.hasOwnProperty(dt)) {
						typeConverters[i] = registeredTypes[dt]
					} else {
						unregisteredTypes.push(dt);
						if (!awaitingDependencies.hasOwnProperty(dt)) {
							awaitingDependencies[dt] = []
						}
						awaitingDependencies[dt].push(function () {
							typeConverters[i] = registeredTypes[dt];
							++registered;
							if (registered === unregisteredTypes.length) {
								onComplete(typeConverters)
							}
						})
					}
				});
				if (0 === unregisteredTypes.length) {
					onComplete(typeConverters)
				}
			}

			function __embind_finalize_value_object(structType) {
				var reg = structRegistrations[structType];
				delete structRegistrations[structType];
				var rawConstructor = reg.rawConstructor;
				var rawDestructor = reg.rawDestructor;
				var fieldRecords = reg.fields;
				var fieldTypes = fieldRecords.map(function (field) {
					return field.getterReturnType
				}).concat(fieldRecords.map(function (field) {
					return field.setterArgumentType
				}));
				whenDependentTypesAreResolved([structType], fieldTypes, function (fieldTypes) {
					var fields = {};
					fieldRecords.forEach(function (field, i) {
						var fieldName = field.fieldName;
						var getterReturnType = fieldTypes[i];
						var getter = field.getter;
						var getterContext = field.getterContext;
						var setterArgumentType = fieldTypes[i + fieldRecords.length];
						var setter = field.setter;
						var setterContext = field.setterContext;
						fields[fieldName] = {
							read: function (ptr) {
								return getterReturnType["fromWireType"](getter(getterContext, ptr))
							},
							write: function (ptr, o) {
								var destructors = [];
								setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
								runDestructors(destructors)
							}
						}
					});
					return [{
						name: reg.name,
						"fromWireType": function (ptr) {
							var rv = {};
							for (var i in fields) {
								rv[i] = fields[i].read(ptr)
							}
							rawDestructor(ptr);
							return rv
						},
						"toWireType": function (destructors, o) {
							for (var fieldName in fields) {
								if (!(fieldName in o)) {
									throw new TypeError("Missing field")
								}
							}
							var ptr = rawConstructor();
							for (fieldName in fields) {
								fields[fieldName].write(ptr, o[fieldName])
							}
							if (destructors !== null) {
								destructors.push(rawDestructor, ptr)
							}
							return ptr
						},
						"argPackAdvance": 8,
						"readValueFromPointer": simpleReadValueFromPointer,
						destructorFunction: rawDestructor
					}]
				})
			}

			function getShiftFromSize(size) {
				switch (size) {
					case 1:
						return 0;
					case 2:
						return 1;
					case 4:
						return 2;
					case 8:
						return 3;
					default:
						throw new TypeError("Unknown type size: " + size)
				}
			}

			function embind_init_charCodes() {
				var codes = new Array(256);
				for (var i = 0; i < 256; ++i) {
					codes[i] = String.fromCharCode(i)
				}
				embind_charCodes = codes
			}
			var embind_charCodes = undefined;

			function readLatin1String(ptr) {
				var ret = "";
				var c = ptr;
				while (HEAPU8[c]) {
					ret += embind_charCodes[HEAPU8[c++]]
				}
				return ret
			}
			var BindingError = undefined;

			function throwBindingError(message) {
				throw new BindingError(message)
			}

			function registerType(rawType, registeredInstance, options) {
				options = options || {};
				if (!("argPackAdvance" in registeredInstance)) {
					throw new TypeError("registerType registeredInstance requires argPackAdvance")
				}
				var name = registeredInstance.name;
				if (!rawType) {
					throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
				}
				if (registeredTypes.hasOwnProperty(rawType)) {
					if (options.ignoreDuplicateRegistrations) {
						return
					} else {
						throwBindingError("Cannot register type '" + name + "' twice")
					}
				}
				registeredTypes[rawType] = registeredInstance;
				delete typeDependencies[rawType];
				if (awaitingDependencies.hasOwnProperty(rawType)) {
					var callbacks = awaitingDependencies[rawType];
					delete awaitingDependencies[rawType];
					callbacks.forEach(function (cb) {
						cb()
					})
				}
			}

			function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
				var shift = getShiftFromSize(size);
				name = readLatin1String(name);
				registerType(rawType, {
					name: name,
					"fromWireType": function (wt) {
						return !!wt
					},
					"toWireType": function (destructors, o) {
						return o ? trueValue : falseValue
					},
					"argPackAdvance": 8,
					"readValueFromPointer": function (pointer) {
						var heap;
						if (size === 1) {
							heap = HEAP8
						} else if (size === 2) {
							heap = HEAP16
						} else if (size === 4) {
							heap = HEAP32
						} else {
							throw new TypeError("Unknown boolean type size: " + name)
						}
						return this["fromWireType"](heap[pointer >> shift])
					},
					destructorFunction: null
				})
			}

			function ClassHandle_isAliasOf(other) {
				if (!(this instanceof ClassHandle)) {
					return false
				}
				if (!(other instanceof ClassHandle)) {
					return false
				}
				var leftClass = this.$$.ptrType.registeredClass;
				var left = this.$$.ptr;
				var rightClass = other.$$.ptrType.registeredClass;
				var right = other.$$.ptr;
				while (leftClass.baseClass) {
					left = leftClass.upcast(left);
					leftClass = leftClass.baseClass
				}
				while (rightClass.baseClass) {
					right = rightClass.upcast(right);
					rightClass = rightClass.baseClass
				}
				return leftClass === rightClass && left === right
			}

			function shallowCopyInternalPointer(o) {
				return {
					count: o.count,
					deleteScheduled: o.deleteScheduled,
					preservePointerOnDelete: o.preservePointerOnDelete,
					ptr: o.ptr,
					ptrType: o.ptrType,
					smartPtr: o.smartPtr,
					smartPtrType: o.smartPtrType
				}
			}

			function throwInstanceAlreadyDeleted(obj) {
				function getInstanceTypeName(handle) {
					return handle.$$.ptrType.registeredClass.name
				}
				throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
			}
			var finalizationGroup = false;

			function detachFinalizer(handle) {}

			function runDestructor($$) {
				if ($$.smartPtr) {
					$$.smartPtrType.rawDestructor($$.smartPtr)
				} else {
					$$.ptrType.registeredClass.rawDestructor($$.ptr)
				}
			}

			function releaseClassHandle($$) {
				$$.count.value -= 1;
				var toDelete = 0 === $$.count.value;
				if (toDelete) {
					runDestructor($$)
				}
			}

			function attachFinalizer(handle) {
				if ("undefined" === typeof FinalizationGroup) {
					attachFinalizer = function (handle) {
						return handle
					};
					return handle
				}
				finalizationGroup = new FinalizationGroup(function (iter) {
					for (var result = iter.next(); !result.done; result = iter.next()) {
						var $$ = result.value;
						if (!$$.ptr) {
							console.warn("object already deleted: " + $$.ptr)
						} else {
							releaseClassHandle($$)
						}
					}
				});
				attachFinalizer = function (handle) {
					finalizationGroup.register(handle, handle.$$, handle.$$);
					return handle
				};
				detachFinalizer = function (handle) {
					finalizationGroup.unregister(handle.$$)
				};
				return attachFinalizer(handle)
			}

			function ClassHandle_clone() {
				if (!this.$$.ptr) {
					throwInstanceAlreadyDeleted(this)
				}
				if (this.$$.preservePointerOnDelete) {
					this.$$.count.value += 1;
					return this
				} else {
					var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
						$$: {
							value: shallowCopyInternalPointer(this.$$)
						}
					}));
					clone.$$.count.value += 1;
					clone.$$.deleteScheduled = false;
					return clone
				}
			}

			function ClassHandle_delete() {
				if (!this.$$.ptr) {
					throwInstanceAlreadyDeleted(this)
				}
				if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
					throwBindingError("Object already scheduled for deletion")
				}
				detachFinalizer(this);
				releaseClassHandle(this.$$);
				if (!this.$$.preservePointerOnDelete) {
					this.$$.smartPtr = undefined;
					this.$$.ptr = undefined
				}
			}

			function ClassHandle_isDeleted() {
				return !this.$$.ptr
			}
			var delayFunction = undefined;
			var deletionQueue = [];

			function flushPendingDeletes() {
				while (deletionQueue.length) {
					var obj = deletionQueue.pop();
					obj.$$.deleteScheduled = false;
					obj["delete"]()
				}
			}

			function ClassHandle_deleteLater() {
				if (!this.$$.ptr) {
					throwInstanceAlreadyDeleted(this)
				}
				if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
					throwBindingError("Object already scheduled for deletion")
				}
				deletionQueue.push(this);
				if (deletionQueue.length === 1 && delayFunction) {
					delayFunction(flushPendingDeletes)
				}
				this.$$.deleteScheduled = true;
				return this
			}

			function init_ClassHandle() {
				ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
				ClassHandle.prototype["clone"] = ClassHandle_clone;
				ClassHandle.prototype["delete"] = ClassHandle_delete;
				ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
				ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater
			}

			function ClassHandle() {}
			var registeredPointers = {};

			function ensureOverloadTable(proto, methodName, humanName) {
				if (undefined === proto[methodName].overloadTable) {
					var prevFunc = proto[methodName];
					proto[methodName] = function () {
						if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
							throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
						}
						return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
					};
					proto[methodName].overloadTable = [];
					proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
				}
			}

			function exposePublicSymbol(name, value, numArguments) {
				if (Module.hasOwnProperty(name)) {
					if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
						throwBindingError("Cannot register public name '" + name + "' twice")
					}
					ensureOverloadTable(Module, name, name);
					if (Module.hasOwnProperty(numArguments)) {
						throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
					}
					Module[name].overloadTable[numArguments] = value
				} else {
					Module[name] = value;
					if (undefined !== numArguments) {
						Module[name].numArguments = numArguments
					}
				}
			}

			function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
				this.name = name;
				this.constructor = constructor;
				this.instancePrototype = instancePrototype;
				this.rawDestructor = rawDestructor;
				this.baseClass = baseClass;
				this.getActualType = getActualType;
				this.upcast = upcast;
				this.downcast = downcast;
				this.pureVirtualFunctions = []
			}

			function upcastPointer(ptr, ptrClass, desiredClass) {
				while (ptrClass !== desiredClass) {
					if (!ptrClass.upcast) {
						throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name)
					}
					ptr = ptrClass.upcast(ptr);
					ptrClass = ptrClass.baseClass
				}
				return ptr
			}

			function constNoSmartPtrRawPointerToWireType(destructors, handle) {
				if (handle === null) {
					if (this.isReference) {
						throwBindingError("null is not a valid " + this.name)
					}
					return 0
				}
				if (!handle.$$) {
					throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
				}
				if (!handle.$$.ptr) {
					throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
				}
				var handleClass = handle.$$.ptrType.registeredClass;
				var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				return ptr
			}

			function genericPointerToWireType(destructors, handle) {
				var ptr;
				if (handle === null) {
					if (this.isReference) {
						throwBindingError("null is not a valid " + this.name)
					}
					if (this.isSmartPointer) {
						ptr = this.rawConstructor();
						if (destructors !== null) {
							destructors.push(this.rawDestructor, ptr)
						}
						return ptr
					} else {
						return 0
					}
				}
				if (!handle.$$) {
					throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
				}
				if (!handle.$$.ptr) {
					throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
				}
				if (!this.isConst && handle.$$.ptrType.isConst) {
					throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
				}
				var handleClass = handle.$$.ptrType.registeredClass;
				ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				if (this.isSmartPointer) {
					if (undefined === handle.$$.smartPtr) {
						throwBindingError("Passing raw pointer to smart pointer is illegal")
					}
					switch (this.sharingPolicy) {
						case 0:
							if (handle.$$.smartPtrType === this) {
								ptr = handle.$$.smartPtr
							} else {
								throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
							}
							break;
						case 1:
							ptr = handle.$$.smartPtr;
							break;
						case 2:
							if (handle.$$.smartPtrType === this) {
								ptr = handle.$$.smartPtr
							} else {
								var clonedHandle = handle["clone"]();
								ptr = this.rawShare(ptr, __emval_register(function () {
									clonedHandle["delete"]()
								}));
								if (destructors !== null) {
									destructors.push(this.rawDestructor, ptr)
								}
							}
							break;
						default:
							throwBindingError("Unsupporting sharing policy")
					}
				}
				return ptr
			}

			function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
				if (handle === null) {
					if (this.isReference) {
						throwBindingError("null is not a valid " + this.name)
					}
					return 0
				}
				if (!handle.$$) {
					throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
				}
				if (!handle.$$.ptr) {
					throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
				}
				if (handle.$$.ptrType.isConst) {
					throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name)
				}
				var handleClass = handle.$$.ptrType.registeredClass;
				var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				return ptr
			}

			function RegisteredPointer_getPointee(ptr) {
				if (this.rawGetPointee) {
					ptr = this.rawGetPointee(ptr)
				}
				return ptr
			}

			function RegisteredPointer_destructor(ptr) {
				if (this.rawDestructor) {
					this.rawDestructor(ptr)
				}
			}

			function RegisteredPointer_deleteObject(handle) {
				if (handle !== null) {
					handle["delete"]()
				}
			}

			function downcastPointer(ptr, ptrClass, desiredClass) {
				if (ptrClass === desiredClass) {
					return ptr
				}
				if (undefined === desiredClass.baseClass) {
					return null
				}
				var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
				if (rv === null) {
					return null
				}
				return desiredClass.downcast(rv)
			}

			function getInheritedInstanceCount() {
				return Object.keys(registeredInstances).length
			}

			function getLiveInheritedInstances() {
				var rv = [];
				for (var k in registeredInstances) {
					if (registeredInstances.hasOwnProperty(k)) {
						rv.push(registeredInstances[k])
					}
				}
				return rv
			}

			function setDelayFunction(fn) {
				delayFunction = fn;
				if (deletionQueue.length && delayFunction) {
					delayFunction(flushPendingDeletes)
				}
			}

			function init_embind() {
				Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
				Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
				Module["flushPendingDeletes"] = flushPendingDeletes;
				Module["setDelayFunction"] = setDelayFunction
			}
			var registeredInstances = {};

			function getBasestPointer(class_, ptr) {
				if (ptr === undefined) {
					throwBindingError("ptr should not be undefined")
				}
				while (class_.baseClass) {
					ptr = class_.upcast(ptr);
					class_ = class_.baseClass
				}
				return ptr
			}

			function getInheritedInstance(class_, ptr) {
				ptr = getBasestPointer(class_, ptr);
				return registeredInstances[ptr]
			}

			function makeClassHandle(prototype, record) {
				if (!record.ptrType || !record.ptr) {
					throwInternalError("makeClassHandle requires ptr and ptrType")
				}
				var hasSmartPtrType = !!record.smartPtrType;
				var hasSmartPtr = !!record.smartPtr;
				if (hasSmartPtrType !== hasSmartPtr) {
					throwInternalError("Both smartPtrType and smartPtr must be specified")
				}
				record.count = {
					value: 1
				};
				return attachFinalizer(Object.create(prototype, {
					$$: {
						value: record
					}
				}))
			}

			function RegisteredPointer_fromWireType(ptr) {
				var rawPointer = this.getPointee(ptr);
				if (!rawPointer) {
					this.destructor(ptr);
					return null
				}
				var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
				if (undefined !== registeredInstance) {
					if (0 === registeredInstance.$$.count.value) {
						registeredInstance.$$.ptr = rawPointer;
						registeredInstance.$$.smartPtr = ptr;
						return registeredInstance["clone"]()
					} else {
						var rv = registeredInstance["clone"]();
						this.destructor(ptr);
						return rv
					}
				}

				function makeDefaultHandle() {
					if (this.isSmartPointer) {
						return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this.pointeeType,
							ptr: rawPointer,
							smartPtrType: this,
							smartPtr: ptr
						})
					} else {
						return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this,
							ptr: ptr
						})
					}
				}
				var actualType = this.registeredClass.getActualType(rawPointer);
				var registeredPointerRecord = registeredPointers[actualType];
				if (!registeredPointerRecord) {
					return makeDefaultHandle.call(this)
				}
				var toType;
				if (this.isConst) {
					toType = registeredPointerRecord.constPointerType
				} else {
					toType = registeredPointerRecord.pointerType
				}
				var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
				if (dp === null) {
					return makeDefaultHandle.call(this)
				}
				if (this.isSmartPointer) {
					return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp,
						smartPtrType: this,
						smartPtr: ptr
					})
				} else {
					return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp
					})
				}
			}

			function init_RegisteredPointer() {
				RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
				RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
				RegisteredPointer.prototype["argPackAdvance"] = 8;
				RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
				RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
				RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType
			}

			function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
				this.name = name;
				this.registeredClass = registeredClass;
				this.isReference = isReference;
				this.isConst = isConst;
				this.isSmartPointer = isSmartPointer;
				this.pointeeType = pointeeType;
				this.sharingPolicy = sharingPolicy;
				this.rawGetPointee = rawGetPointee;
				this.rawConstructor = rawConstructor;
				this.rawShare = rawShare;
				this.rawDestructor = rawDestructor;
				if (!isSmartPointer && registeredClass.baseClass === undefined) {
					if (isConst) {
						this["toWireType"] = constNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null
					} else {
						this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null
					}
				} else {
					this["toWireType"] = genericPointerToWireType
				}
			}

			function replacePublicSymbol(name, value, numArguments) {
				if (!Module.hasOwnProperty(name)) {
					throwInternalError("Replacing nonexistant public symbol")
				}
				if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
					Module[name].overloadTable[numArguments] = value
				} else {
					Module[name] = value;
					Module[name].argCount = numArguments
				}
			}

			function embind__requireFunction(signature, rawFunction) {
				signature = readLatin1String(signature);

				function makeDynCaller(dynCall) {
					var args = [];
					for (var i = 1; i < signature.length; ++i) {
						args.push("a" + i)
					}
					var name = "dynCall_" + signature + "_" + rawFunction;
					var body = "return function " + name + "(" + args.join(", ") + ") {\n";
					body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
					body += "};\n";
					return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction)
				}
				var fp;
				if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
					fp = Module["FUNCTION_TABLE_" + signature][rawFunction]
				} else if (typeof FUNCTION_TABLE !== "undefined") {
					fp = FUNCTION_TABLE[rawFunction]
				} else {
					var dc = Module["dynCall_" + signature];
					if (dc === undefined) {
						dc = Module["dynCall_" + signature.replace(/f/g, "d")];
						if (dc === undefined) {
							throwBindingError("No dynCall invoker for signature: " + signature)
						}
					}
					fp = makeDynCaller(dc)
				}
				if (typeof fp !== "function") {
					throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
				}
				return fp
			}
			var UnboundTypeError = undefined;

			function getTypeName(type) {
				var ptr = ___getTypeName(type);
				var rv = readLatin1String(ptr);
				_free(ptr);
				return rv
			}

			function throwUnboundTypeError(message, types) {
				var unboundTypes = [];
				var seen = {};

				function visit(type) {
					if (seen[type]) {
						return
					}
					if (registeredTypes[type]) {
						return
					}
					if (typeDependencies[type]) {
						typeDependencies[type].forEach(visit);
						return
					}
					unboundTypes.push(type);
					seen[type] = true
				}
				types.forEach(visit);
				throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
			}

			function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
				name = readLatin1String(name);
				getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
				if (upcast) {
					upcast = embind__requireFunction(upcastSignature, upcast)
				}
				if (downcast) {
					downcast = embind__requireFunction(downcastSignature, downcast)
				}
				rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
				var legalFunctionName = makeLegalFunctionName(name);
				exposePublicSymbol(legalFunctionName, function () {
					throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType])
				});
				whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
					base = base[0];
					var baseClass;
					var basePrototype;
					if (baseClassRawType) {
						baseClass = base.registeredClass;
						basePrototype = baseClass.instancePrototype
					} else {
						basePrototype = ClassHandle.prototype
					}
					var constructor = createNamedFunction(legalFunctionName, function () {
						if (Object.getPrototypeOf(this) !== instancePrototype) {
							throw new BindingError("Use 'new' to construct " + name)
						}
						if (undefined === registeredClass.constructor_body) {
							throw new BindingError(name + " has no accessible constructor")
						}
						var body = registeredClass.constructor_body[arguments.length];
						if (undefined === body) {
							throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!")
						}
						return body.apply(this, arguments)
					});
					var instancePrototype = Object.create(basePrototype, {
						constructor: {
							value: constructor
						}
					});
					constructor.prototype = instancePrototype;
					var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
					var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
					var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
					var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
					registeredPointers[rawType] = {
						pointerType: pointerConverter,
						constPointerType: constPointerConverter
					};
					replacePublicSymbol(legalFunctionName, constructor);
					return [referenceConverter, pointerConverter, constPointerConverter]
				})
			}

			function heap32VectorToArray(count, firstElement) {
				var array = [];
				for (var i = 0; i < count; i++) {
					array.push(HEAP32[(firstElement >> 2) + i])
				}
				return array
			}

			function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
				assert(argCount > 0);
				var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
				invoker = embind__requireFunction(invokerSignature, invoker);
				var args = [rawConstructor];
				var destructors = [];
				whenDependentTypesAreResolved([], [rawClassType], function (classType) {
					classType = classType[0];
					var humanName = "constructor " + classType.name;
					if (undefined === classType.registeredClass.constructor_body) {
						classType.registeredClass.constructor_body = []
					}
					if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
						throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!")
					}
					classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
						throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes)
					};
					whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
						classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
							if (arguments.length !== argCount - 1) {
								throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1))
							}
							destructors.length = 0;
							args.length = argCount;
							for (var i = 1; i < argCount; ++i) {
								args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1])
							}
							var ptr = invoker.apply(null, args);
							runDestructors(destructors);
							return argTypes[0]["fromWireType"](ptr)
						};
						return []
					});
					return []
				})
			}

			function new_(constructor, argumentList) {
				if (!(constructor instanceof Function)) {
					throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
				}
				var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () {});
				dummy.prototype = constructor.prototype;
				var obj = new dummy;
				var r = constructor.apply(obj, argumentList);
				return r instanceof Object ? r : obj
			}

			function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
				var argCount = argTypes.length;
				if (argCount < 2) {
					throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
				}
				var isClassMethodFunc = argTypes[1] !== null && classType !== null;
				var needsDestructorStack = false;
				for (var i = 1; i < argTypes.length; ++i) {
					if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
						needsDestructorStack = true;
						break
					}
				}
				var returns = argTypes[0].name !== "void";
				var argsList = "";
				var argsListWired = "";
				for (var i = 0; i < argCount - 2; ++i) {
					argsList += (i !== 0 ? ", " : "") + "arg" + i;
					argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired"
				}
				var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
				if (needsDestructorStack) {
					invokerFnBody += "var destructors = [];\n"
				}
				var dtorStack = needsDestructorStack ? "destructors" : "null";
				var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
				var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
				if (isClassMethodFunc) {
					invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
				}
				for (var i = 0; i < argCount - 2; ++i) {
					invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
					args1.push("argType" + i);
					args2.push(argTypes[i + 2])
				}
				if (isClassMethodFunc) {
					argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired
				}
				invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
				if (needsDestructorStack) {
					invokerFnBody += "runDestructors(destructors);\n"
				} else {
					for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
						var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
						if (argTypes[i].destructorFunction !== null) {
							invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
							args1.push(paramName + "_dtor");
							args2.push(argTypes[i].destructorFunction)
						}
					}
				}
				if (returns) {
					invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
				} else {}
				invokerFnBody += "}\n";
				args1.push(invokerFnBody);
				var invokerFunction = new_(Function, args1).apply(null, args2);
				return invokerFunction
			}

			function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
				var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
				methodName = readLatin1String(methodName);
				rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
				whenDependentTypesAreResolved([], [rawClassType], function (classType) {
					classType = classType[0];
					var humanName = classType.name + "." + methodName;
					if (isPureVirtual) {
						classType.registeredClass.pureVirtualFunctions.push(methodName)
					}

					function unboundTypesHandler() {
						throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
					}
					var proto = classType.registeredClass.instancePrototype;
					var method = proto[methodName];
					if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
						unboundTypesHandler.argCount = argCount - 2;
						unboundTypesHandler.className = classType.name;
						proto[methodName] = unboundTypesHandler
					} else {
						ensureOverloadTable(proto, methodName, humanName);
						proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
					}
					whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
						var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
						if (undefined === proto[methodName].overloadTable) {
							memberFunction.argCount = argCount - 2;
							proto[methodName] = memberFunction
						} else {
							proto[methodName].overloadTable[argCount - 2] = memberFunction
						}
						return []
					});
					return []
				})
			}
			var emval_free_list = [];
			var emval_handle_array = [{}, {
				value: undefined
			}, {
				value: null
			}, {
				value: true
			}, {
				value: false
			}];

			function __emval_decref(handle) {
				if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
					emval_handle_array[handle] = undefined;
					emval_free_list.push(handle)
				}
			}

			function count_emval_handles() {
				var count = 0;
				for (var i = 5; i < emval_handle_array.length; ++i) {
					if (emval_handle_array[i] !== undefined) {
						++count
					}
				}
				return count
			}

			function get_first_emval() {
				for (var i = 5; i < emval_handle_array.length; ++i) {
					if (emval_handle_array[i] !== undefined) {
						return emval_handle_array[i]
					}
				}
				return null
			}

			function init_emval() {
				Module["count_emval_handles"] = count_emval_handles;
				Module["get_first_emval"] = get_first_emval
			}

			function __emval_register(value) {
				switch (value) {
					case undefined: {
						return 1
					}
					case null: {
						return 2
					}
					case true: {
						return 3
					}
					case false: {
						return 4
					}
					default: {
						var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
						emval_handle_array[handle] = {
							refcount: 1,
							value: value
						};
						return handle
					}
				}
			}

			function __embind_register_emval(rawType, name) {
				name = readLatin1String(name);
				registerType(rawType, {
					name: name,
					"fromWireType": function (handle) {
						var rv = emval_handle_array[handle].value;
						__emval_decref(handle);
						return rv
					},
					"toWireType": function (destructors, value) {
						return __emval_register(value)
					},
					"argPackAdvance": 8,
					"readValueFromPointer": simpleReadValueFromPointer,
					destructorFunction: null
				})
			}

			function _embind_repr(v) {
				if (v === null) {
					return "null"
				}
				var t = typeof v;
				if (t === "object" || t === "array" || t === "function") {
					return v.toString()
				} else {
					return "" + v
				}
			}

			function floatReadValueFromPointer(name, shift) {
				switch (shift) {
					case 2:
						return function (pointer) {
							return this["fromWireType"](HEAPF32[pointer >> 2])
						};
					case 3:
						return function (pointer) {
							return this["fromWireType"](HEAPF64[pointer >> 3])
						};
					default:
						throw new TypeError("Unknown float type: " + name)
				}
			}

			function __embind_register_float(rawType, name, size) {
				var shift = getShiftFromSize(size);
				name = readLatin1String(name);
				registerType(rawType, {
					name: name,
					"fromWireType": function (value) {
						return value
					},
					"toWireType": function (destructors, value) {
						if (typeof value !== "number" && typeof value !== "boolean") {
							throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
						}
						return value
					},
					"argPackAdvance": 8,
					"readValueFromPointer": floatReadValueFromPointer(name, shift),
					destructorFunction: null
				})
			}

			function integerReadValueFromPointer(name, shift, signed) {
				switch (shift) {
					case 0:
						return signed ? function readS8FromPointer(pointer) {
							return HEAP8[pointer]
						} : function readU8FromPointer(pointer) {
							return HEAPU8[pointer]
						};
					case 1:
						return signed ? function readS16FromPointer(pointer) {
							return HEAP16[pointer >> 1]
						} : function readU16FromPointer(pointer) {
							return HEAPU16[pointer >> 1]
						};
					case 2:
						return signed ? function readS32FromPointer(pointer) {
							return HEAP32[pointer >> 2]
						} : function readU32FromPointer(pointer) {
							return HEAPU32[pointer >> 2]
						};
					default:
						throw new TypeError("Unknown integer type: " + name)
				}
			}

			function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
				name = readLatin1String(name);
				if (maxRange === -1) {
					maxRange = 4294967295
				}
				var shift = getShiftFromSize(size);
				var fromWireType = function (value) {
					return value
				};
				if (minRange === 0) {
					var bitshift = 32 - 8 * size;
					fromWireType = function (value) {
						return value << bitshift >>> bitshift
					}
				}
				var isUnsignedType = name.indexOf("unsigned") != -1;
				registerType(primitiveType, {
					name: name,
					"fromWireType": fromWireType,
					"toWireType": function (destructors, value) {
						if (typeof value !== "number" && typeof value !== "boolean") {
							throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
						}
						if (value < minRange || value > maxRange) {
							throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
						}
						return isUnsignedType ? value >>> 0 : value | 0
					},
					"argPackAdvance": 8,
					"readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
					destructorFunction: null
				})
			}

			function __embind_register_memory_view(rawType, dataTypeIndex, name) {
				var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
				var TA = typeMapping[dataTypeIndex];

				function decodeMemoryView(handle) {
					handle = handle >> 2;
					var heap = HEAPU32;
					var size = heap[handle];
					var data = heap[handle + 1];
					return new TA(heap["buffer"], data, size)
				}
				name = readLatin1String(name);
				registerType(rawType, {
					name: name,
					"fromWireType": decodeMemoryView,
					"argPackAdvance": 8,
					"readValueFromPointer": decodeMemoryView
				}, {
					ignoreDuplicateRegistrations: true
				})
			}

			function __embind_register_std_string(rawType, name) {
				name = readLatin1String(name);
				var stdStringIsUTF8 = name === "std::string";
				registerType(rawType, {
					name: name,
					"fromWireType": function (value) {
						var length = HEAPU32[value >> 2];
						var str;
						if (stdStringIsUTF8) {
							var endChar = HEAPU8[value + 4 + length];
							var endCharSwap = 0;
							if (endChar != 0) {
								endCharSwap = endChar;
								HEAPU8[value + 4 + length] = 0
							}
							var decodeStartPtr = value + 4;
							for (var i = 0; i <= length; ++i) {
								var currentBytePtr = value + 4 + i;
								if (HEAPU8[currentBytePtr] == 0) {
									var stringSegment = UTF8ToString(decodeStartPtr);
									if (str === undefined) str = stringSegment;
									else {
										str += String.fromCharCode(0);
										str += stringSegment
									}
									decodeStartPtr = currentBytePtr + 1
								}
							}
							if (endCharSwap != 0) HEAPU8[value + 4 + length] = endCharSwap
						} else {
							var a = new Array(length);
							for (var i = 0; i < length; ++i) {
								a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
							}
							str = a.join("")
						}
						_free(value);
						return str
					},
					"toWireType": function (destructors, value) {
						if (value instanceof ArrayBuffer) {
							value = new Uint8Array(value)
						}
						var getLength;
						var valueIsOfTypeString = typeof value === "string";
						if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
							throwBindingError("Cannot pass non-string to std::string")
						}
						if (stdStringIsUTF8 && valueIsOfTypeString) {
							getLength = function () {
								return lengthBytesUTF8(value)
							}
						} else {
							getLength = function () {
								return value.length
							}
						}
						var length = getLength();
						var ptr = _malloc(4 + length + 1);
						HEAPU32[ptr >> 2] = length;
						if (stdStringIsUTF8 && valueIsOfTypeString) {
							stringToUTF8(value, ptr + 4, length + 1)
						} else {
							if (valueIsOfTypeString) {
								for (var i = 0; i < length; ++i) {
									var charCode = value.charCodeAt(i);
									if (charCode > 255) {
										_free(ptr);
										throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
									}
									HEAPU8[ptr + 4 + i] = charCode
								}
							} else {
								for (var i = 0; i < length; ++i) {
									HEAPU8[ptr + 4 + i] = value[i]
								}
							}
						}
						if (destructors !== null) {
							destructors.push(_free, ptr)
						}
						return ptr
					},
					"argPackAdvance": 8,
					"readValueFromPointer": simpleReadValueFromPointer,
					destructorFunction: function (ptr) {
						_free(ptr)
					}
				})
			}

			function __embind_register_std_wstring(rawType, charSize, name) {
				name = readLatin1String(name);
				var getHeap, shift;
				if (charSize === 2) {
					getHeap = function () {
						return HEAPU16
					};
					shift = 1
				} else if (charSize === 4) {
					getHeap = function () {
						return HEAPU32
					};
					shift = 2
				}
				registerType(rawType, {
					name: name,
					"fromWireType": function (value) {
						var HEAP = getHeap();
						var length = HEAPU32[value >> 2];
						var a = new Array(length);
						var start = value + 4 >> shift;
						for (var i = 0; i < length; ++i) {
							a[i] = String.fromCharCode(HEAP[start + i])
						}
						_free(value);
						return a.join("")
					},
					"toWireType": function (destructors, value) {
						var length = value.length;
						var ptr = _malloc(4 + length * charSize);
						var HEAP = getHeap();
						HEAPU32[ptr >> 2] = length;
						var start = ptr + 4 >> shift;
						for (var i = 0; i < length; ++i) {
							HEAP[start + i] = value.charCodeAt(i)
						}
						if (destructors !== null) {
							destructors.push(_free, ptr)
						}
						return ptr
					},
					"argPackAdvance": 8,
					"readValueFromPointer": simpleReadValueFromPointer,
					destructorFunction: function (ptr) {
						_free(ptr)
					}
				})
			}

			function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
				structRegistrations[rawType] = {
					name: readLatin1String(name),
					rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
					rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
					fields: []
				}
			}

			function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
				structRegistrations[structType].fields.push({
					fieldName: readLatin1String(fieldName),
					getterReturnType: getterReturnType,
					getter: embind__requireFunction(getterSignature, getter),
					getterContext: getterContext,
					setterArgumentType: setterArgumentType,
					setter: embind__requireFunction(setterSignature, setter),
					setterContext: setterContext
				})
			}

			function __embind_register_void(rawType, name) {
				name = readLatin1String(name);
				registerType(rawType, {
					isVoid: true,
					name: name,
					"argPackAdvance": 0,
					"fromWireType": function () {
						return undefined
					},
					"toWireType": function (destructors, o) {
						return undefined
					}
				})
			}

			function __emval_incref(handle) {
				if (handle > 4) {
					emval_handle_array[handle].refcount += 1
				}
			}

			function requireRegisteredType(rawType, humanName) {
				var impl = registeredTypes[rawType];
				if (undefined === impl) {
					throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
				}
				return impl
			}

			function __emval_take_value(type, argv) {
				type = requireRegisteredType(type, "_emval_take_value");
				var v = type["readValueFromPointer"](argv);
				return __emval_register(v)
			}

			function _abort() {
				abort()
			}

			function _emscripten_get_heap_size() {
				return HEAP8.length
			}

			function abortOnCannotGrowMemory(requestedSize) {
				abort("OOM")
			}

			function emscripten_realloc_buffer(size) {
				try {
					wasmMemory.grow(size - buffer.byteLength + 65535 >> 16);
					updateGlobalBufferAndViews(wasmMemory.buffer);
					return 1
				} catch (e) {}
			}

			function _emscripten_resize_heap(requestedSize) {
				var oldSize = _emscripten_get_heap_size();
				var PAGE_MULTIPLE = 65536;
				var LIMIT = 2147483648 - PAGE_MULTIPLE;
				if (requestedSize > LIMIT) {
					return false
				}
				var MIN_TOTAL_MEMORY = 16777216;
				var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
				while (newSize < requestedSize) {
					if (newSize <= 536870912) {
						newSize = alignUp(2 * newSize, PAGE_MULTIPLE)
					} else {
						newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT)
					}
				}
				var replacement = emscripten_realloc_buffer(newSize);
				if (!replacement) {
					return false
				}
				return true
			}

			function _getenv(name) {
				if (name === 0) return 0;
				name = UTF8ToString(name);
				if (!ENV.hasOwnProperty(name)) return 0;
				if (_getenv.ret) _free(_getenv.ret);
				_getenv.ret = allocateUTF8(ENV[name]);
				return _getenv.ret
			}

			function _emscripten_memcpy_big(dest, src, num) {
				HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
			}

			function _pthread_attr_init(attr) {
				return 0
			}

			function _pthread_attr_setdetachstate() {}

			function _pthread_cond_destroy() {
				return 0
			}

			function _pthread_cond_init() {
				return 0
			}

			function _pthread_create() {
				return 6
			}

			function _pthread_join() {}

			function ___setErrNo(value) {
				if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
				return value
			}

			function _sysconf(name) {
				switch (name) {
					case 30:
						return PAGE_SIZE;
					case 85:
						var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
						return maxHeapSize / PAGE_SIZE;
					case 132:
					case 133:
					case 12:
					case 137:
					case 138:
					case 15:
					case 235:
					case 16:
					case 17:
					case 18:
					case 19:
					case 20:
					case 149:
					case 13:
					case 10:
					case 236:
					case 153:
					case 9:
					case 21:
					case 22:
					case 159:
					case 154:
					case 14:
					case 77:
					case 78:
					case 139:
					case 80:
					case 81:
					case 82:
					case 68:
					case 67:
					case 164:
					case 11:
					case 29:
					case 47:
					case 48:
					case 95:
					case 52:
					case 51:
					case 46:
						return 200809;
					case 79:
						return 0;
					case 27:
					case 246:
					case 127:
					case 128:
					case 23:
					case 24:
					case 160:
					case 161:
					case 181:
					case 182:
					case 242:
					case 183:
					case 184:
					case 243:
					case 244:
					case 245:
					case 165:
					case 178:
					case 179:
					case 49:
					case 50:
					case 168:
					case 169:
					case 175:
					case 170:
					case 171:
					case 172:
					case 97:
					case 76:
					case 32:
					case 173:
					case 35:
						return -1;
					case 176:
					case 177:
					case 7:
					case 155:
					case 8:
					case 157:
					case 125:
					case 126:
					case 92:
					case 93:
					case 129:
					case 130:
					case 131:
					case 94:
					case 91:
						return 1;
					case 74:
					case 60:
					case 69:
					case 70:
					case 4:
						return 1024;
					case 31:
					case 42:
					case 72:
						return 32;
					case 87:
					case 26:
					case 33:
						return 2147483647;
					case 34:
					case 1:
						return 47839;
					case 38:
					case 36:
						return 99;
					case 43:
					case 37:
						return 2048;
					case 0:
						return 2097152;
					case 3:
						return 65536;
					case 28:
						return 32768;
					case 44:
						return 32767;
					case 75:
						return 16384;
					case 39:
						return 1e3;
					case 89:
						return 700;
					case 71:
						return 256;
					case 40:
						return 255;
					case 2:
						return 100;
					case 180:
						return 64;
					case 25:
						return 20;
					case 5:
						return 16;
					case 6:
						return 6;
					case 73:
						return 4;
					case 84: {
						if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
						return 1
					}
				}
				___setErrNo(28);
				return -1
			}
			InternalError = Module["InternalError"] = extendError(Error, "InternalError");
			embind_init_charCodes();
			BindingError = Module["BindingError"] = extendError(Error, "BindingError");
			init_ClassHandle();
			init_RegisteredPointer();
			init_embind();
			UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
			init_emval();
			var ASSERTIONS = false;
			var asmGlobalArg = {};
			var asmLibraryArg = {
				"ClassHandle": ClassHandle,
				"ClassHandle_clone": ClassHandle_clone,
				"ClassHandle_delete": ClassHandle_delete,
				"ClassHandle_deleteLater": ClassHandle_deleteLater,
				"ClassHandle_isAliasOf": ClassHandle_isAliasOf,
				"ClassHandle_isDeleted": ClassHandle_isDeleted,
				"RegisteredClass": RegisteredClass,
				"RegisteredPointer": RegisteredPointer,
				"RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
				"RegisteredPointer_destructor": RegisteredPointer_destructor,
				"RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
				"RegisteredPointer_getPointee": RegisteredPointer_getPointee,
				"___buildEnvironment": ___buildEnvironment,
				"___cxa_allocate_exception": ___cxa_allocate_exception,
				"___cxa_begin_catch": ___cxa_begin_catch,
				"___cxa_throw": ___cxa_throw,
				"___exception_addRef": ___exception_addRef,
				"___exception_deAdjust": ___exception_deAdjust,
				"___gxx_personality_v0": ___gxx_personality_v0,
				"___setErrNo": ___setErrNo,
				"___wasi_fd_close": ___wasi_fd_close,
				"___wasi_fd_seek": ___wasi_fd_seek,
				"___wasi_fd_write": ___wasi_fd_write,
				"__embind_finalize_value_object": __embind_finalize_value_object,
				"__embind_register_bool": __embind_register_bool,
				"__embind_register_class": __embind_register_class,
				"__embind_register_class_constructor": __embind_register_class_constructor,
				"__embind_register_class_function": __embind_register_class_function,
				"__embind_register_emval": __embind_register_emval,
				"__embind_register_float": __embind_register_float,
				"__embind_register_integer": __embind_register_integer,
				"__embind_register_memory_view": __embind_register_memory_view,
				"__embind_register_std_string": __embind_register_std_string,
				"__embind_register_std_wstring": __embind_register_std_wstring,
				"__embind_register_value_object": __embind_register_value_object,
				"__embind_register_value_object_field": __embind_register_value_object_field,
				"__embind_register_void": __embind_register_void,
				"__emval_decref": __emval_decref,
				"__emval_incref": __emval_incref,
				"__emval_register": __emval_register,
				"__emval_take_value": __emval_take_value,
				"__memory_base": 1024,
				"__table_base": 0,
				"_abort": _abort,
				"_embind_repr": _embind_repr,
				"_emscripten_get_heap_size": _emscripten_get_heap_size,
				"_emscripten_memcpy_big": _emscripten_memcpy_big,
				"_emscripten_resize_heap": _emscripten_resize_heap,
				"_fd_close": _fd_close,
				"_fd_seek": _fd_seek,
				"_fd_write": _fd_write,
				"_getenv": _getenv,
				"_pthread_attr_init": _pthread_attr_init,
				"_pthread_attr_setdetachstate": _pthread_attr_setdetachstate,
				"_pthread_cond_destroy": _pthread_cond_destroy,
				"_pthread_cond_init": _pthread_cond_init,
				"_pthread_create": _pthread_create,
				"_pthread_join": _pthread_join,
				"_sysconf": _sysconf,
				"abort": abort,
				"abortOnCannotGrowMemory": abortOnCannotGrowMemory,
				"attachFinalizer": attachFinalizer,
				"constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
				"count_emval_handles": count_emval_handles,
				"craftInvokerFunction": craftInvokerFunction,
				"createNamedFunction": createNamedFunction,
				"demangle": demangle,
				"demangleAll": demangleAll,
				"detachFinalizer": detachFinalizer,
				"downcastPointer": downcastPointer,
				"embind__requireFunction": embind__requireFunction,
				"embind_init_charCodes": embind_init_charCodes,
				"emscripten_realloc_buffer": emscripten_realloc_buffer,
				"ensureOverloadTable": ensureOverloadTable,
				"exposePublicSymbol": exposePublicSymbol,
				"extendError": extendError,
				"floatReadValueFromPointer": floatReadValueFromPointer,
				"flushPendingDeletes": flushPendingDeletes,
				"flush_NO_FILESYSTEM": flush_NO_FILESYSTEM,
				"genericPointerToWireType": genericPointerToWireType,
				"getBasestPointer": getBasestPointer,
				"getInheritedInstance": getInheritedInstance,
				"getInheritedInstanceCount": getInheritedInstanceCount,
				"getLiveInheritedInstances": getLiveInheritedInstances,
				"getShiftFromSize": getShiftFromSize,
				"getTempRet0": getTempRet0,
				"getTypeName": getTypeName,
				"get_first_emval": get_first_emval,
				"heap32VectorToArray": heap32VectorToArray,
				"init_ClassHandle": init_ClassHandle,
				"init_RegisteredPointer": init_RegisteredPointer,
				"init_embind": init_embind,
				"init_emval": init_emval,
				"integerReadValueFromPointer": integerReadValueFromPointer,
				"jsStackTrace": jsStackTrace,
				"makeClassHandle": makeClassHandle,
				"makeLegalFunctionName": makeLegalFunctionName,
				"memory": wasmMemory,
				"new_": new_,
				"nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
				"readLatin1String": readLatin1String,
				"registerType": registerType,
				"releaseClassHandle": releaseClassHandle,
				"replacePublicSymbol": replacePublicSymbol,
				"requireRegisteredType": requireRegisteredType,
				"runDestructor": runDestructor,
				"runDestructors": runDestructors,
				"setDelayFunction": setDelayFunction,
				"setTempRet0": setTempRet0,
				"shallowCopyInternalPointer": shallowCopyInternalPointer,
				"simpleReadValueFromPointer": simpleReadValueFromPointer,
				"stackTrace": stackTrace,
				"table": wasmTable,
				"tempDoublePtr": tempDoublePtr,
				"throwBindingError": throwBindingError,
				"throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
				"throwInternalError": throwInternalError,
				"throwUnboundTypeError": throwUnboundTypeError,
				"upcastPointer": upcastPointer,
				"whenDependentTypesAreResolved": whenDependentTypesAreResolved
			};
			var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
			Module["asm"] = asm;
			var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = function () {
				return Module["asm"]["__ZSt18uncaught_exceptionv"].apply(null, arguments)
			};
			var ___cxa_can_catch = Module["___cxa_can_catch"] = function () {
				return Module["asm"]["___cxa_can_catch"].apply(null, arguments)
			};
			var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function () {
				return Module["asm"]["___cxa_is_pointer_type"].apply(null, arguments)
			};
			var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function () {
				return Module["asm"]["___embind_register_native_and_builtin_types"].apply(null, arguments)
			};
			var ___getTypeName = Module["___getTypeName"] = function () {
				return Module["asm"]["___getTypeName"].apply(null, arguments)
			};
			var __get_environ = Module["__get_environ"] = function () {
				return Module["asm"]["__get_environ"].apply(null, arguments)
			};
			var _emscripten_get_sbrk_ptr = Module["_emscripten_get_sbrk_ptr"] = function () {
				return Module["asm"]["_emscripten_get_sbrk_ptr"].apply(null, arguments)
			};
			var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function () {
				return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments)
			};
			var _free = Module["_free"] = function () {
				return Module["asm"]["_free"].apply(null, arguments)
			};
			var _malloc = Module["_malloc"] = function () {
				return Module["asm"]["_malloc"].apply(null, arguments)
			};
			var _memcpy = Module["_memcpy"] = function () {
				return Module["asm"]["_memcpy"].apply(null, arguments)
			};
			var _memset = Module["_memset"] = function () {
				return Module["asm"]["_memset"].apply(null, arguments)
			};
			var _rintf = Module["_rintf"] = function () {
				return Module["asm"]["_rintf"].apply(null, arguments)
			};
			var establishStackSpace = Module["establishStackSpace"] = function () {
				return Module["asm"]["establishStackSpace"].apply(null, arguments)
			};
			var globalCtors = Module["globalCtors"] = function () {
				return Module["asm"]["globalCtors"].apply(null, arguments)
			};
			var stackAlloc = Module["stackAlloc"] = function () {
				return Module["asm"]["stackAlloc"].apply(null, arguments)
			};
			var stackRestore = Module["stackRestore"] = function () {
				return Module["asm"]["stackRestore"].apply(null, arguments)
			};
			var stackSave = Module["stackSave"] = function () {
				return Module["asm"]["stackSave"].apply(null, arguments)
			};
			var dynCall_fi = Module["dynCall_fi"] = function () {
				return Module["asm"]["dynCall_fi"].apply(null, arguments)
			};
			var dynCall_i = Module["dynCall_i"] = function () {
				return Module["asm"]["dynCall_i"].apply(null, arguments)
			};
			var dynCall_ii = Module["dynCall_ii"] = function () {
				return Module["asm"]["dynCall_ii"].apply(null, arguments)
			};
			var dynCall_iidiiii = Module["dynCall_iidiiii"] = function () {
				return Module["asm"]["dynCall_iidiiii"].apply(null, arguments)
			};
			var dynCall_iii = Module["dynCall_iii"] = function () {
				return Module["asm"]["dynCall_iii"].apply(null, arguments)
			};
			var dynCall_iiii = Module["dynCall_iiii"] = function () {
				return Module["asm"]["dynCall_iiii"].apply(null, arguments)
			};
			var dynCall_iiiii = Module["dynCall_iiiii"] = function () {
				return Module["asm"]["dynCall_iiiii"].apply(null, arguments)
			};
			var dynCall_iiiiii = Module["dynCall_iiiiii"] = function () {
				return Module["asm"]["dynCall_iiiiii"].apply(null, arguments)
			};
			var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function () {
				return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments)
			};
			var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function () {
				return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments)
			};
			var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = function () {
				return Module["asm"]["dynCall_iiiiiiiiiiii"].apply(null, arguments)
			};
			var dynCall_iiji = Module["dynCall_iiji"] = function () {
				return Module["asm"]["dynCall_iiji"].apply(null, arguments)
			};
			var dynCall_iji = Module["dynCall_iji"] = function () {
				return Module["asm"]["dynCall_iji"].apply(null, arguments)
			};
			var dynCall_jiji = Module["dynCall_jiji"] = function () {
				return Module["asm"]["dynCall_jiji"].apply(null, arguments)
			};
			var dynCall_jji = Module["dynCall_jji"] = function () {
				return Module["asm"]["dynCall_jji"].apply(null, arguments)
			};
			var dynCall_v = Module["dynCall_v"] = function () {
				return Module["asm"]["dynCall_v"].apply(null, arguments)
			};
			var dynCall_vi = Module["dynCall_vi"] = function () {
				return Module["asm"]["dynCall_vi"].apply(null, arguments)
			};
			var dynCall_vii = Module["dynCall_vii"] = function () {
				return Module["asm"]["dynCall_vii"].apply(null, arguments)
			};
			var dynCall_viif = Module["dynCall_viif"] = function () {
				return Module["asm"]["dynCall_viif"].apply(null, arguments)
			};
			var dynCall_viii = Module["dynCall_viii"] = function () {
				return Module["asm"]["dynCall_viii"].apply(null, arguments)
			};
			var dynCall_viiif = Module["dynCall_viiif"] = function () {
				return Module["asm"]["dynCall_viiif"].apply(null, arguments)
			};
			var dynCall_viiii = Module["dynCall_viiii"] = function () {
				return Module["asm"]["dynCall_viiii"].apply(null, arguments)
			};
			var dynCall_viiiii = Module["dynCall_viiiii"] = function () {
				return Module["asm"]["dynCall_viiiii"].apply(null, arguments)
			};
			var dynCall_viiiiii = Module["dynCall_viiiiii"] = function () {
				return Module["asm"]["dynCall_viiiiii"].apply(null, arguments)
			};
			Module["asm"] = asm;
			Module["ccall"] = ccall;
			var calledRun;
			Module["then"] = function (func) {
				if (calledRun) {
					func(Module)
				} else {
					var old = Module["onRuntimeInitialized"];
					Module["onRuntimeInitialized"] = function () {
						if (old) old();
						func(Module)
					}
				}
				return Module
			};

			function ExitStatus(status) {
				this.name = "ExitStatus";
				this.message = "Program terminated with exit(" + status + ")";
				this.status = status
			}
			dependenciesFulfilled = function runCaller() {
				if (!calledRun) run();
				if (!calledRun) dependenciesFulfilled = runCaller
			};

			function run(args) {
				args = args || arguments_;
				if (runDependencies > 0) {
					return
				}
				preRun();
				if (runDependencies > 0) return;

				function doRun() {
					if (calledRun) return;
					calledRun = true;
					if (ABORT) return;
					initRuntime();
					preMain();
					if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
					postRun()
				}
				if (Module["setStatus"]) {
					Module["setStatus"]("Running...");
					setTimeout(function () {
						setTimeout(function () {
							Module["setStatus"]("")
						}, 1);
						doRun()
					}, 1)
				} else {
					doRun()
				}
			}
			Module["run"] = run;
			if (Module["preInit"]) {
				if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
				while (Module["preInit"].length > 0) {
					Module["preInit"].pop()()
				}
			}
			noExitRuntime = true;
			run();


			return OpenJPEGWASM
		}
	);
})();

export default OpenJPEGWASM;

/******/ var __webpack_modules__ = ({

/***/ 407:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// emscripten doesnt support conditional loading of wasm modules out of the box
// so we hack around it by passing the url and simd support via the worker name
// hopefully not bad?
if (self.name.startsWith('em-pthread')) {
    const url = self.name.split('-').slice(2).join('-');
    const _fetch = globalThis.fetch;
    globalThis.fetch = _ => _fetch(url);
    self.name = 'em-pthread';
}
async function Module(moduleArg = {}) {
    var moduleRtn;
    var Module = moduleArg;
    var ENVIRONMENT_IS_WEB = true;
    var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
    var out = (...args) => console.log(...args);
    var err = (...args) => console.error(...args);
    function ready() { readyPromiseResolve?.(Module); if (ENVIRONMENT_IS_PTHREAD) {
        startWorker();
    } }
    var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && globalThis.name == "em-pthread";
    if (ENVIRONMENT_IS_WORKER) {
        _scriptName = self.location.href;
    }
    var _scriptName;
    const supportsGrowth = !!WebAssembly.Memory.prototype.toResizableBuffer;
    updateMemoryViews = () => { if (supportsGrowth && self.HEAPU8RAW)
        return; var b = supportsGrowth ? wasmMemory.toResizableBuffer() : wasmMemory.buffer; HEAP8 = new Int8Array(b); HEAP16 = new Int16Array(b); HEAPU8 = new Uint8Array(b); HEAPU16 = new Uint16Array(b); HEAP32 = new Int32Array(b); HEAPU32 = new Uint32Array(b); HEAPF32 = new Float32Array(b); HEAPF64 = new Float64Array(b); HEAP64 = new BigInt64Array(b); HEAPU64 = new BigUint64Array(b); self.HEAPU8RAW = new Uint8Array(b); self.WASMMEMORY = wasmMemory; };
    if (moduleArg.__out)
        out = moduleArg.__out;
    if (moduleArg.__err)
        err = moduleArg.__err;
    if (!self.name.startsWith("em-pthread")) {
        const OriginalWorker = globalThis.Worker;
        globalThis.Worker = class extends OriginalWorker {
            constructor(scriptURL, options = {}) { super(scriptURL, { ...options, name: "em-pthread-" + moduleArg.__url }); }
        };
    }
    if (!ENVIRONMENT_IS_PTHREAD) { }
    function abort(what) { throw what; }
    class EmscriptenEH {
    }
    class EmscriptenSjLj extends EmscriptenEH {
    }
    function growMemViews() { if (wasmMemory.buffer != HEAP8.buffer) {
        updateMemoryViews();
    } }
    var readyPromiseResolve, readyPromiseReject;
    var startWorker;
    if (ENVIRONMENT_IS_PTHREAD) {
        var initializedJS = false;
        self.onunhandledrejection = e => { throw e.reason || e; };
        function handleMessage(e) { try {
            var msgData = e["data"];
            var cmd = msgData.cmd;
            if (cmd === "load") {
                let messageQueue = [];
                self.onmessage = e => messageQueue.push(e);
                startWorker = () => { postMessage({ cmd: "loaded" }); for (let msg of messageQueue) {
                    handleMessage(msg);
                } self.onmessage = handleMessage; };
                for (const handler of msgData.handlers) {
                    if (!Module[handler] || Module[handler].proxy) {
                        Module[handler] = (...args) => { postMessage({ cmd: "callHandler", handler, args }); };
                        if (handler == "print")
                            out = Module[handler];
                        if (handler == "printErr")
                            err = Module[handler];
                    }
                }
                wasmMemory = msgData.wasmMemory;
                updateMemoryViews();
                Module["wasm"] = msgData.wasmModule;
                loadModule();
            }
            else if (cmd === "run") {
                establishStackSpace(msgData.pthread_ptr);
                __emscripten_thread_init(msgData.pthread_ptr, 0, 0, 1, 0, 0);
                PThread.threadInitTLS();
                __emscripten_thread_mailbox_await(msgData.pthread_ptr);
                if (!initializedJS) {
                    __embind_initialize_bindings();
                    initializedJS = true;
                }
                try {
                    invokeEntryPoint(msgData.start_routine, msgData.arg);
                }
                catch (ex) {
                    if (ex != "unwind") {
                        throw ex;
                    }
                }
            }
            else if (msgData.target === "setimmediate") { }
            else if (cmd === "checkMailbox") {
                if (initializedJS) {
                    checkMailbox();
                }
            }
            else if (cmd) {
                err(`worker: received unknown command ${cmd}`);
                err(msgData);
            }
        }
        catch (ex) {
            __emscripten_thread_crashed();
            throw ex;
        } }
        self.onmessage = handleMessage;
    }
    var runtimeInitialized = false;
    function updateMemoryViews() { var b = wasmMemory.buffer; HEAP8 = new Int8Array(b); HEAP16 = new Int16Array(b); HEAPU8 = new Uint8Array(b); HEAPU16 = new Uint16Array(b); HEAP32 = new Int32Array(b); HEAPU32 = new Uint32Array(b); HEAPF32 = new Float32Array(b); HEAPF64 = new Float64Array(b); HEAP64 = new BigInt64Array(b); HEAPU64 = new BigUint64Array(b); }
    function initMemory() { if (ENVIRONMENT_IS_PTHREAD) {
        return;
    } {
        var INITIAL_MEMORY = 33554432;
        wasmMemory = new WebAssembly.Memory({ initial: INITIAL_MEMORY / 65536, maximum: 32768, shared: true });
    } updateMemoryViews(); }
    initMemory();
    var HEAP16;
    var HEAP32;
    var HEAP64;
    var HEAP8;
    var HEAPF32;
    var HEAPF64;
    var HEAPU16;
    var HEAPU32;
    var HEAPU64;
    var HEAPU8;
    var terminateWorker = worker => { worker.terminate(); worker.onmessage = e => { }; };
    var cleanupThread = pthread_ptr => { var worker = PThread.pthreads[pthread_ptr]; PThread.returnWorkerToPool(worker); };
    var callRuntimeCallbacks = callbacks => { while (callbacks.length > 0) {
        callbacks.shift()(Module);
    } };
    var onPreRuns = [];
    var spawnThread = threadParams => { var worker = PThread.getNewWorker(); if (!worker) {
        return 6;
    } PThread.runningWorkers.push(worker); PThread.pthreads[threadParams.pthread_ptr] = worker; worker.pthread_ptr = threadParams.pthread_ptr; var msg = { cmd: "run", start_routine: threadParams.startRoutine, arg: threadParams.arg, pthread_ptr: threadParams.pthread_ptr }; worker.postMessage(msg, threadParams.transferList); return 0; };
    var stackSave = () => _emscripten_stack_get_current();
    var stackRestore = val => __emscripten_stack_restore(val);
    var stackAlloc = sz => __emscripten_stack_alloc(sz);
    var proxyToMainThread = (funcIndex, emAsmAddr, proxyMode, ...callArgs) => { var bufSize = 8 * callArgs.length * 2; var sp = stackSave(); var args = stackAlloc(bufSize); var b = args >> 3; for (var arg of callArgs) {
        if (typeof arg == "bigint") {
            (growMemViews(), HEAP64)[b++] = 1n;
            (growMemViews(), HEAP64)[b++] = arg;
        }
        else {
            (growMemViews(), HEAP64)[b++] = 0n;
            (growMemViews(), HEAPF64)[b++] = arg;
        }
    } var rtn = __emscripten_run_js_on_main_thread(funcIndex, emAsmAddr, bufSize, args, proxyMode); stackRestore(sp); return rtn; };
    function _proc_exit(code) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(0, 0, 1, code); throw `exit(${code})`; }
    var _exit = _proc_exit;
    var waitAsyncPolyfilled = !Atomics.waitAsync || globalThis.navigator?.userAgent && Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]) < 91;
    var PThread = { unusedWorkers: [], runningWorkers: [], tlsInitFunctions: [], pthreads: {}, init() { if (!ENVIRONMENT_IS_PTHREAD) {
            PThread.initMainThread();
        } }, initMainThread() { var pthreadPoolSize = !navigator.userAgent.toLowerCase().includes("firefox") && self.crossOriginIsolated ? Math.min(Math.max(0, navigator.hardwareConcurrency - 2), 8) : 0; while (pthreadPoolSize--) {
            PThread.allocateUnusedWorker();
        } }, terminateAllThreads: () => { for (var worker of PThread.runningWorkers) {
            terminateWorker(worker);
        } for (var worker of PThread.unusedWorkers) {
            terminateWorker(worker);
        } PThread.unusedWorkers = []; PThread.runningWorkers = []; PThread.pthreads = {}; }, terminateRuntime: () => { PThread.terminateAllThreads(); var pthread_ptr = _pthread_self(); ___set_thread_state(0, 0, 0, 1); if (!waitAsyncPolyfilled) {
            Atomics.notify((growMemViews(), HEAP32), pthread_ptr >> 2);
        } }, returnWorkerToPool: worker => { var pthread_ptr = worker.pthread_ptr; delete PThread.pthreads[pthread_ptr]; PThread.unusedWorkers.push(worker); PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1); worker.pthread_ptr = 0; __emscripten_thread_free_data(pthread_ptr); }, threadInitTLS() { PThread.tlsInitFunctions.forEach(f => f()); }, loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => { worker.onmessage = e => { var d = e["data"]; var cmd = d.cmd; if (d.targetThread && d.targetThread != _pthread_self()) {
            var targetWorker = PThread.pthreads[d.targetThread];
            if (targetWorker) {
                targetWorker.postMessage(d, d.transferList);
            }
            else {
                err(`worker sent message (${cmd}) to pthread (${d.targetThread}) that no longer exists`);
            }
            return;
        } if (cmd === "checkMailbox") {
            checkMailbox();
        }
        else if (cmd === "spawnThread") {
            spawnThread(d);
        }
        else if (cmd === "cleanupThread") {
            callUserCallback(() => cleanupThread(d.thread));
        }
        else if (cmd === "loaded") {
            worker.loaded = true;
            onFinishedLoading(worker);
        }
        else if (d.target === "setimmediate") {
            worker.postMessage(d);
        }
        else if (cmd === "callHandler") {
            Module[d.handler](...d.args);
        }
        else if (cmd) {
            err(`worker sent an unknown command ${cmd}`);
        } }; worker.onerror = e => { var message = "worker sent an error!"; err(`${message} ${e.filename}:${e.lineno}: ${e.message}`); throw e; }; var handlers = []; var knownHandlers = []; for (var handler of knownHandlers) {
            if (Module.propertyIsEnumerable(handler)) {
                handlers.push(handler);
            }
        } worker.postMessage({ cmd: "load", handlers, wasmMemory, wasmModule }); }), async loadWasmModuleToAllWorkers() { if (ENVIRONMENT_IS_PTHREAD) {
            return;
        } let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker)); return pthreadPoolReady; }, allocateUnusedWorker() { var worker; worker = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u(602), __webpack_require__.b), { type: "module", name: "em-pthread" }); PThread.unusedWorkers.push(worker); }, getNewWorker() { if (PThread.unusedWorkers.length == 0) {
            PThread.allocateUnusedWorker();
            PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
        } return PThread.unusedWorkers.pop(); } };
    function establishStackSpace(pthread_ptr) { var stackHigh = (growMemViews(), HEAPU32)[pthread_ptr + 48 >> 2]; var stackSize = (growMemViews(), HEAPU32)[pthread_ptr + 52 >> 2]; var stackLow = stackHigh - stackSize; _emscripten_stack_set_limits(stackHigh, stackLow); stackRestore(stackHigh); }
    var wasmTableMirror = [];
    var getWasmTableEntry = funcPtr => { var func = wasmTableMirror[funcPtr]; if (!func) {
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
    } return func; };
    var invokeEntryPoint = (ptr, arg) => { var result = getWasmTableEntry(ptr)(arg); function finish(result) { __emscripten_thread_exit(result); } finish(result); };
    var lengthBytesUTF8 = str => { var len = 0; for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++;
        }
        else if (c <= 2047) {
            len += 2;
        }
        else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i;
        }
        else {
            len += 3;
        }
    } return len; };
    var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => { if (!(maxBytesToWrite > 0))
        return 0; var startIdx = outIdx; var endIdx = outIdx + maxBytesToWrite - 1; for (var i = 0; i < str.length; ++i) {
        var u = str.codePointAt(i);
        if (u <= 127) {
            if (outIdx >= endIdx)
                break;
            heap[outIdx++] = u;
        }
        else if (u <= 2047) {
            if (outIdx + 1 >= endIdx)
                break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63;
        }
        else if (u <= 65535) {
            if (outIdx + 2 >= endIdx)
                break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63;
        }
        else {
            if (outIdx + 3 >= endIdx)
                break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63;
            i++;
        }
    } heap[outIdx] = 0; return outIdx - startIdx; };
    var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, (growMemViews(), HEAPU8), outPtr, maxBytesToWrite);
    var stringToNewUTF8 = str => { var size = lengthBytesUTF8(str) + 1; var ret = _malloc(size); if (ret)
        stringToUTF8(str, ret, size); return ret; };
    var wasmMemory;
    var UTF8Decoder = new TextDecoder;
    var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => { var maxIdx = idx + maxBytesToRead; if (ignoreNul)
        return maxIdx; while (heapOrArray[idx] && !(idx >= maxIdx))
        ++idx; return idx; };
    var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => { if (!ptr)
        return ""; var end = findStringEnd((growMemViews(), HEAPU8), ptr, maxBytesToRead, ignoreNul); return UTF8Decoder.decode((growMemViews(), HEAPU8).slice(ptr, end)); };
    var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]);
    function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(1, 0, 1, pthread_ptr, attr, startRoutine, arg); return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg); }
    var _emscripten_has_threading_support = () => !!globalThis.SharedArrayBuffer;
    var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => { if (!_emscripten_has_threading_support()) {
        return 6;
    } var transferList = []; var error = 0; if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
        return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
    } if (error)
        return error; var threadParams = { startRoutine, pthread_ptr, arg, transferList }; if (ENVIRONMENT_IS_PTHREAD) {
        threadParams.cmd = "spawnThread";
        postMessage(threadParams, transferList);
        return 0;
    } return spawnThread(threadParams); };
    var SYSCALLS = { varargs: undefined, getStr(ptr) { var ret = UTF8ToString(ptr); return ret; } };
    function ___syscall_fcntl64(fd, cmd, varargs) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(2, 0, 1, fd, cmd, varargs); SYSCALLS.varargs = varargs; return 0; }
    function ___syscall_getdents64(fd, dirp, count) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(3, 0, 1, fd, dirp, count); }
    function ___syscall_ioctl(fd, op, varargs) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(4, 0, 1, fd, op, varargs); SYSCALLS.varargs = varargs; return 0; }
    function ___syscall_openat(dirfd, path, flags, varargs) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(5, 0, 1, dirfd, path, flags, varargs); SYSCALLS.varargs = varargs; }
    var __abort_js = () => abort("");
    var AsciiToString = ptr => { var str = ""; while (1) {
        var ch = (growMemViews(), HEAPU8)[ptr++];
        if (!ch)
            return str;
        str += String.fromCharCode(ch);
    } };
    var awaitingDependencies = {};
    var registeredTypes = {};
    var typeDependencies = {};
    var BindingError = class BindingError extends Error {
        constructor(message) { super(message); this.name = "BindingError"; }
    };
    var throwBindingError = message => { throw new BindingError(message); };
    function sharedRegisterType(rawType, registeredInstance, options = {}) { var name = registeredInstance.name; if (!rawType) {
        throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
    } if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
            return;
        }
        else {
            throwBindingError(`Cannot register type '${name}' twice`);
        }
    } registeredTypes[rawType] = registeredInstance; delete typeDependencies[rawType]; if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach(cb => cb());
    } }
    function registerType(rawType, registeredInstance, options = {}) { return sharedRegisterType(rawType, registeredInstance, options); }
    var integerReadValueFromPointer = (name, width, signed) => { switch (width) {
        case 1: return signed ? pointer => (growMemViews(), HEAP8)[pointer] : pointer => (growMemViews(), HEAPU8)[pointer];
        case 2: return signed ? pointer => (growMemViews(), HEAP16)[pointer >> 1] : pointer => (growMemViews(), HEAPU16)[pointer >> 1];
        case 4: return signed ? pointer => (growMemViews(), HEAP32)[pointer >> 2] : pointer => (growMemViews(), HEAPU32)[pointer >> 2];
        case 8: return signed ? pointer => (growMemViews(), HEAP64)[pointer >> 3] : pointer => (growMemViews(), HEAPU64)[pointer >> 3];
        default: throw new TypeError(`invalid integer width (${width}): ${name}`);
    } };
    var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => { name = AsciiToString(name); const isUnsignedType = minRange === 0n; let fromWireType = value => value; if (isUnsignedType) {
        const bitSize = size * 8;
        fromWireType = value => BigInt.asUintN(bitSize, value);
        maxRange = fromWireType(maxRange);
    } registerType(primitiveType, { name, fromWireType, toWireType: (destructors, value) => { if (typeof value == "number") {
            value = BigInt(value);
        } return value; }, readValueFromPointer: integerReadValueFromPointer(name, size, !isUnsignedType), destructorFunction: null }); };
    var __embind_register_bool = (rawType, name, trueValue, falseValue) => { name = AsciiToString(name); registerType(rawType, { name, fromWireType: function (wt) { return !!wt; }, toWireType: function (destructors, o) { return o ? trueValue : falseValue; }, readValueFromPointer: function (pointer) { return this.fromWireType((growMemViews(), HEAPU8)[pointer]); }, destructorFunction: null }); };
    var shallowCopyInternalPointer = o => ({ count: o.count, deleteScheduled: o.deleteScheduled, preservePointerOnDelete: o.preservePointerOnDelete, ptr: o.ptr, ptrType: o.ptrType, smartPtr: o.smartPtr, smartPtrType: o.smartPtrType });
    var throwInstanceAlreadyDeleted = obj => { function getInstanceTypeName(handle) { return handle.$$.ptrType.registeredClass.name; } throwBindingError(getInstanceTypeName(obj) + " instance already deleted"); };
    var finalizationRegistry = false;
    var detachFinalizer = handle => { };
    var runDestructor = $$ => { if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
    }
    else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
    } };
    var releaseClassHandle = $$ => { $$.count.value -= 1; var toDelete = 0 === $$.count.value; if (toDelete) {
        runDestructor($$);
    } };
    var attachFinalizer = handle => { if (!globalThis.FinalizationRegistry) {
        attachFinalizer = handle => handle;
        return handle;
    } finalizationRegistry = new FinalizationRegistry(info => { releaseClassHandle(info.$$); }); attachFinalizer = handle => { var $$ = handle.$$; var hasSmartPtr = !!$$.smartPtr; if (hasSmartPtr) {
        var info = { $$ };
        finalizationRegistry.register(handle, info, handle);
    } return handle; }; detachFinalizer = handle => finalizationRegistry.unregister(handle); return attachFinalizer(handle); };
    var deletionQueue = [];
    var flushPendingDeletes = () => { while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj["delete"]();
    } };
    var delayFunction;
    var init_ClassHandle = () => { let proto = ClassHandle.prototype; Object.assign(proto, { isAliasOf(other) { if (!(this instanceof ClassHandle)) {
            return false;
        } if (!(other instanceof ClassHandle)) {
            return false;
        } var leftClass = this.$$.ptrType.registeredClass; var left = this.$$.ptr; other.$$ = other.$$; var rightClass = other.$$.ptrType.registeredClass; var right = other.$$.ptr; while (leftClass.baseClass) {
            left = leftClass.upcast(left);
            leftClass = leftClass.baseClass;
        } while (rightClass.baseClass) {
            right = rightClass.upcast(right);
            rightClass = rightClass.baseClass;
        } return leftClass === rightClass && left === right; }, clone() { if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
        } if (this.$$.preservePointerOnDelete) {
            this.$$.count.value += 1;
            return this;
        }
        else {
            var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
            clone.$$.count.value += 1;
            clone.$$.deleteScheduled = false;
            return clone;
        } }, delete() { if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
        } if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError("Object already scheduled for deletion");
        } detachFinalizer(this); releaseClassHandle(this.$$); if (!this.$$.preservePointerOnDelete) {
            this.$$.smartPtr = undefined;
            this.$$.ptr = undefined;
        } }, isDeleted() { return !this.$$.ptr; }, deleteLater() { if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
        } if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError("Object already scheduled for deletion");
        } deletionQueue.push(this); if (deletionQueue.length === 1 && delayFunction) {
            delayFunction(flushPendingDeletes);
        } this.$$.deleteScheduled = true; return this; } }); const symbolDispose = Symbol.dispose; if (symbolDispose) {
        proto[symbolDispose] = proto["delete"];
    } };
    function ClassHandle() { }
    var createNamedFunction = (name, func) => Object.defineProperty(func, "name", { value: name });
    var registeredPointers = {};
    var ensureOverloadTable = (proto, methodName, humanName) => { if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = function (...args) { if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) {
            throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
        } return proto[methodName].overloadTable[args.length].apply(this, args); };
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
    } };
    var exposePublicSymbol = (name, value, numArguments) => { if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
            throwBindingError(`Cannot register public name '${name}' twice`);
        }
        ensureOverloadTable(Module, name, name);
        if (Module[name].overloadTable.hasOwnProperty(numArguments)) {
            throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
        }
        Module[name].overloadTable[numArguments] = value;
    }
    else {
        Module[name] = value;
        Module[name].argCount = numArguments;
    } };
    var char_0 = 48;
    var char_9 = 57;
    var makeLegalFunctionName = name => { name = name.replace(/[^a-zA-Z0-9_]/g, "$"); var f = name.charCodeAt(0); if (f >= char_0 && f <= char_9) {
        return `_${name}`;
    } return name; };
    function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) { this.name = name; this.constructor = constructor; this.instancePrototype = instancePrototype; this.rawDestructor = rawDestructor; this.baseClass = baseClass; this.getActualType = getActualType; this.upcast = upcast; this.downcast = downcast; this.pureVirtualFunctions = []; }
    var upcastPointer = (ptr, ptrClass, desiredClass) => { while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
            throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
    } return ptr; };
    var embindRepr = v => { if (v === null) {
        return "null";
    } var t = typeof v; if (t === "object" || t === "array" || t === "function") {
        return v.toString();
    }
    else {
        return "" + v;
    } };
    function constNoSmartPtrRawPointerToWireType(destructors, handle) { if (handle === null) {
        if (this.isReference) {
            throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
    } if (!handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
    } if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
    } var handleClass = handle.$$.ptrType.registeredClass; var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass); return ptr; }
    function genericPointerToWireType(destructors, handle) { var ptr; if (handle === null) {
        if (this.isReference) {
            throwBindingError(`null is not a valid ${this.name}`);
        }
        if (this.isSmartPointer) {
            ptr = this.rawConstructor();
            if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
            }
            return ptr;
        }
        else {
            return 0;
        }
    } if (!handle || !handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
    } if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
    } if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
    } var handleClass = handle.$$.ptrType.registeredClass; ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass); if (this.isSmartPointer) {
        if (undefined === handle.$$.smartPtr) {
            throwBindingError("Passing raw pointer to smart pointer is illegal");
        }
        switch (this.sharingPolicy) {
            case 0:
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr;
                }
                else {
                    throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
                }
                break;
            case 1:
                ptr = handle.$$.smartPtr;
                break;
            case 2:
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr;
                }
                else {
                    var clonedHandle = handle["clone"]();
                    ptr = this.rawShare(ptr, Emval.toHandle(() => clonedHandle["delete"]()));
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr);
                    }
                }
                break;
            default: throwBindingError("Unsupported sharing policy");
        }
    } return ptr; }
    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) { if (handle === null) {
        if (this.isReference) {
            throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
    } if (!handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
    } if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
    } if (handle.$$.ptrType.isConst) {
        throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
    } var handleClass = handle.$$.ptrType.registeredClass; var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass); return ptr; }
    function readPointer(pointer) { return this.fromWireType((growMemViews(), HEAPU32)[pointer >> 2]); }
    var downcastPointer = (ptr, ptrClass, desiredClass) => { if (ptrClass === desiredClass) {
        return ptr;
    } if (undefined === desiredClass.baseClass) {
        return null;
    } var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass); if (rv === null) {
        return null;
    } return desiredClass.downcast(rv); };
    var registeredInstances = {};
    var getBasestPointer = (class_, ptr) => { if (ptr === undefined) {
        throwBindingError("ptr should not be undefined");
    } while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass;
    } return ptr; };
    var getInheritedInstance = (class_, ptr) => { ptr = getBasestPointer(class_, ptr); return registeredInstances[ptr]; };
    var InternalError = class InternalError extends Error {
        constructor(message) { super(message); this.name = "InternalError"; }
    };
    var throwInternalError = message => { throw new InternalError(message); };
    var makeClassHandle = (prototype, record) => { if (!record.ptrType || !record.ptr) {
        throwInternalError("makeClassHandle requires ptr and ptrType");
    } var hasSmartPtrType = !!record.smartPtrType; var hasSmartPtr = !!record.smartPtr; if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError("Both smartPtrType and smartPtr must be specified");
    } record.count = { value: 1 }; return attachFinalizer(Object.create(prototype, { $$: { value: record, writable: true } })); };
    function RegisteredPointer_fromWireType(ptr) { var rawPointer = this.getPointee(ptr); if (!rawPointer) {
        this.destructor(ptr);
        return null;
    } var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer); if (undefined !== registeredInstance) {
        if (0 === registeredInstance.$$.count.value) {
            registeredInstance.$$.ptr = rawPointer;
            registeredInstance.$$.smartPtr = ptr;
            return registeredInstance["clone"]();
        }
        else {
            var rv = registeredInstance["clone"]();
            this.destructor(ptr);
            return rv;
        }
    } function makeDefaultHandle() { if (this.isSmartPointer) {
        return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this.pointeeType, ptr: rawPointer, smartPtrType: this, smartPtr: ptr });
    }
    else {
        return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this, ptr });
    } } var actualType = this.registeredClass.getActualType(rawPointer); var registeredPointerRecord = registeredPointers[actualType]; if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
    } var toType; if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
    }
    else {
        toType = registeredPointerRecord.pointerType;
    } var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass); if (dp === null) {
        return makeDefaultHandle.call(this);
    } if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp, smartPtrType: this, smartPtr: ptr });
    }
    else {
        return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp });
    } }
    var init_RegisteredPointer = () => { Object.assign(RegisteredPointer.prototype, { getPointee(ptr) { if (this.rawGetPointee) {
            ptr = this.rawGetPointee(ptr);
        } return ptr; }, destructor(ptr) { this.rawDestructor?.(ptr); }, readValueFromPointer: readPointer, fromWireType: RegisteredPointer_fromWireType }); };
    function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) { this.name = name; this.registeredClass = registeredClass; this.isReference = isReference; this.isConst = isConst; this.isSmartPointer = isSmartPointer; this.pointeeType = pointeeType; this.sharingPolicy = sharingPolicy; this.rawGetPointee = rawGetPointee; this.rawConstructor = rawConstructor; this.rawShare = rawShare; this.rawDestructor = rawDestructor; if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
            this.toWireType = constNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null;
        }
        else {
            this.toWireType = nonConstNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null;
        }
    }
    else {
        this.toWireType = genericPointerToWireType;
    } }
    var replacePublicSymbol = (name, value, numArguments) => { if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistent public symbol");
    } if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
    }
    else {
        Module[name] = value;
        Module[name].argCount = numArguments;
    } };
    var embind__requireFunction = (signature, rawFunction, isAsync = false) => { signature = AsciiToString(signature); function makeDynCaller() { var rtn = getWasmTableEntry(rawFunction); return rtn; } var fp = makeDynCaller(); if (typeof fp != "function") {
        throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
    } return fp; };
    class UnboundTypeError extends Error {
    }
    var getTypeName = type => { var ptr = ___getTypeName(type); var rv = AsciiToString(ptr); _free(ptr); return rv; };
    var throwUnboundTypeError = (message, types) => { var unboundTypes = []; var seen = {}; function visit(type) { if (seen[type]) {
        return;
    } if (registeredTypes[type]) {
        return;
    } if (typeDependencies[type]) {
        typeDependencies[type].forEach(visit);
        return;
    } unboundTypes.push(type); seen[type] = true; } types.forEach(visit); throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([", "])); };
    var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => { myTypes.forEach(type => typeDependencies[type] = dependentTypes); function onComplete(typeConverters) { var myTypeConverters = getTypeConverters(typeConverters); if (myTypeConverters.length !== myTypes.length) {
        throwInternalError("Mismatched type converter count");
    } for (var i = 0; i < myTypes.length; ++i) {
        registerType(myTypes[i], myTypeConverters[i]);
    } } var typeConverters = new Array(dependentTypes.length); var unregisteredTypes = []; var registered = 0; for (let [i, dt] of dependentTypes.entries()) {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt];
        }
        else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = [];
            }
            awaitingDependencies[dt].push(() => { typeConverters[i] = registeredTypes[dt]; ++registered; if (registered === unregisteredTypes.length) {
                onComplete(typeConverters);
            } });
        }
    } if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
    } };
    var __embind_register_class = (rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) => { name = AsciiToString(name); getActualType = embind__requireFunction(getActualTypeSignature, getActualType); upcast &&= embind__requireFunction(upcastSignature, upcast); downcast &&= embind__requireFunction(downcastSignature, downcast); rawDestructor = embind__requireFunction(destructorSignature, rawDestructor); var legalFunctionName = makeLegalFunctionName(name); exposePublicSymbol(legalFunctionName, function () { throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]); }); whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], base => { base = base[0]; var baseClass; var basePrototype; if (baseClassRawType) {
        baseClass = base.registeredClass;
        basePrototype = baseClass.instancePrototype;
    }
    else {
        basePrototype = ClassHandle.prototype;
    } var constructor = createNamedFunction(name, function (...args) { if (Object.getPrototypeOf(this) !== instancePrototype) {
        throw new BindingError(`Use 'new' to construct ${name}`);
    } if (undefined === registeredClass.constructor_body) {
        throw new BindingError(`${name} has no accessible constructor`);
    } var body = registeredClass.constructor_body[args.length]; if (undefined === body) {
        throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
    } return body.apply(this, args); }); var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } }); constructor.prototype = instancePrototype; var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast); if (registeredClass.baseClass) {
        registeredClass.baseClass.__derivedClasses ??= [];
        registeredClass.baseClass.__derivedClasses.push(registeredClass);
    } var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false); var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false); var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false); registeredPointers[rawType] = { pointerType: pointerConverter, constPointerType: constPointerConverter }; replacePublicSymbol(legalFunctionName, constructor); return [referenceConverter, pointerConverter, constPointerConverter]; }); };
    var heap32VectorToArray = (count, firstElement) => { var array = []; for (var i = 0; i < count; i++) {
        array.push((growMemViews(), HEAPU32)[firstElement + i * 4 >> 2]);
    } return array; };
    var runDestructors = destructors => { while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
    } };
    function usesDestructorStack(argTypes) { for (var i = 1; i < argTypes.length; ++i) {
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
            return true;
        }
    } return false; }
    var InvokerFunctions = { ftfnnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire, toArg1Wire, toArg2Wire) { return function (arg0, arg1, arg2) { var arg0Wired = toArg0Wire(null, arg0); var arg1Wired = toArg1Wire(null, arg1); var arg2Wired = toArg2Wire(null, arg2); var rv = invoker(fn, arg0Wired, arg1Wired, arg2Wired); var ret = fromRetWire(rv); return ret; }; }, tffn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire) { return function () { var thisWired = toClassParamWire(null, this); invoker(fn, thisWired); }; }, tffnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire) { return function (arg0) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); invoker(fn, thisWired, arg0Wired); }; }, tffnnnnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire, toArg1Wire, toArg2Wire, toArg3Wire) { return function (arg0, arg1, arg2, arg3) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); var arg1Wired = toArg1Wire(null, arg1); var arg2Wired = toArg2Wire(null, arg2); var arg3Wired = toArg3Wire(null, arg3); invoker(fn, thisWired, arg0Wired, arg1Wired, arg2Wired, arg3Wired); }; }, tffnnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire, toArg1Wire) { return function (arg0, arg1) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); var arg1Wired = toArg1Wire(null, arg1); invoker(fn, thisWired, arg0Wired, arg1Wired); }; }, ttfnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire) { return function (arg0) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); var rv = invoker(fn, thisWired, arg0Wired); var ret = fromRetWire(rv); return ret; }; }, tffnt: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire, arg0Wired_dtor) { return function (arg0) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); invoker(fn, thisWired, arg0Wired); arg0Wired_dtor(arg0Wired); }; }, tffnnnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire, toArg1Wire, toArg2Wire) { return function (arg0, arg1, arg2) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); var arg1Wired = toArg1Wire(null, arg1); var arg2Wired = toArg2Wire(null, arg2); invoker(fn, thisWired, arg0Wired, arg1Wired, arg2Wired); }; }, ttfn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire) { return function () { var thisWired = toClassParamWire(null, this); var rv = invoker(fn, thisWired); var ret = fromRetWire(rv); return ret; }; }, ttfnnn: function anonymous(humanName, throwBindingError, invoker, fn, runDestructors, fromRetWire, toClassParamWire, toArg0Wire, toArg1Wire) { return function (arg0, arg1) { var thisWired = toClassParamWire(null, this); var arg0Wired = toArg0Wire(null, arg0); var arg1Wired = toArg1Wire(null, arg1); var rv = invoker(fn, thisWired, arg0Wired, arg1Wired); var ret = fromRetWire(rv); return ret; }; } };
    function createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync) { const signature = [isClassMethodFunc ? "t" : "f", returns ? "t" : "f", isAsync ? "t" : "f"]; for (let i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
        const arg = argTypes[i];
        let destructorSig = "";
        if (arg.destructorFunction === undefined) {
            destructorSig = "u";
        }
        else if (arg.destructorFunction === null) {
            destructorSig = "n";
        }
        else {
            destructorSig = "t";
        }
        signature.push(destructorSig);
    } return signature.join(""); }
    function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) { var argCount = argTypes.length; if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
    } var isClassMethodFunc = argTypes[1] !== null && classType !== null; var needsDestructorStack = usesDestructorStack(argTypes); var returns = !argTypes[0].isVoid; var retType = argTypes[0]; var instType = argTypes[1]; var closureArgs = [humanName, throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, retType.fromWireType.bind(retType), instType?.toWireType.bind(instType)]; for (var i = 2; i < argCount; ++i) {
        var argType = argTypes[i];
        closureArgs.push(argType.toWireType.bind(argType));
    } if (!needsDestructorStack) {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
            if (argTypes[i].destructorFunction !== null) {
                closureArgs.push(argTypes[i].destructorFunction);
            }
        }
    } var signature = createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync); var invokerFn = InvokerFunctions[signature](...closureArgs); return createNamedFunction(humanName, invokerFn); }
    var __embind_register_class_constructor = (rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) => { var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr); invoker = embind__requireFunction(invokerSignature, invoker); whenDependentTypesAreResolved([], [rawClassType], classType => { classType = classType[0]; var humanName = `constructor ${classType.name}`; if (undefined === classType.registeredClass.constructor_body) {
        classType.registeredClass.constructor_body = [];
    } if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
        throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount - 1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
    } classType.registeredClass.constructor_body[argCount - 1] = () => { throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes); }; whenDependentTypesAreResolved([], rawArgTypes, argTypes => { argTypes.splice(1, 0, null); classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor); return []; }); return []; }); };
    var getFunctionName = signature => { signature = signature.trim(); const argsIndex = signature.indexOf("("); if (argsIndex === -1)
        return signature; return signature.slice(0, argsIndex); };
    var __embind_register_class_function = (rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual, isAsync, isNonnullReturn) => { var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr); methodName = AsciiToString(methodName); methodName = getFunctionName(methodName); rawInvoker = embind__requireFunction(invokerSignature, rawInvoker, isAsync); whenDependentTypesAreResolved([], [rawClassType], classType => { classType = classType[0]; var humanName = `${classType.name}.${methodName}`; if (methodName.startsWith("@@")) {
        methodName = Symbol[methodName.substring(2)];
    } if (isPureVirtual) {
        classType.registeredClass.pureVirtualFunctions.push(methodName);
    } function unboundTypesHandler() { throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes); } var proto = classType.registeredClass.instancePrototype; var method = proto[methodName]; if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
        unboundTypesHandler.argCount = argCount - 2;
        unboundTypesHandler.className = classType.name;
        proto[methodName] = unboundTypesHandler;
    }
    else {
        ensureOverloadTable(proto, methodName, humanName);
        proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
    } whenDependentTypesAreResolved([], rawArgTypes, argTypes => { var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync); if (undefined === proto[methodName].overloadTable) {
        memberFunction.argCount = argCount - 2;
        proto[methodName] = memberFunction;
    }
    else {
        proto[methodName].overloadTable[argCount - 2] = memberFunction;
    } return []; }); return []; }); };
    var validateThis = (this_, classType, humanName) => { if (!(this_ instanceof Object)) {
        throwBindingError(`${humanName} with invalid "this": ${this_}`);
    } if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(`${humanName} incompatible with "this" of type ${this_.constructor.name}`);
    } if (!this_.$$.ptr) {
        throwBindingError(`cannot call emscripten binding method ${humanName} on deleted object`);
    } return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass); };
    var __embind_register_class_property = (classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) => { fieldName = AsciiToString(fieldName); getter = embind__requireFunction(getterSignature, getter); whenDependentTypesAreResolved([], [classType], classType => { classType = classType[0]; var humanName = `${classType.name}.${fieldName}`; var desc = { get() { throwUnboundTypeError(`Cannot access ${humanName} due to unbound types`, [getterReturnType, setterArgumentType]); }, enumerable: true, configurable: true }; if (setter) {
        desc.set = () => throwUnboundTypeError(`Cannot access ${humanName} due to unbound types`, [getterReturnType, setterArgumentType]);
    }
    else {
        desc.set = v => throwBindingError(humanName + " is a read-only property");
    } Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc); whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], types => { var getterReturnType = types[0]; var desc = { get() { var ptr = validateThis(this, classType, humanName + " getter"); return getterReturnType.fromWireType(getter(getterContext, ptr)); }, enumerable: true }; if (setter) {
        setter = embind__requireFunction(setterSignature, setter);
        var setterArgumentType = types[1];
        desc.set = function (v) { var ptr = validateThis(this, classType, humanName + " setter"); var destructors = []; setter(setterContext, ptr, setterArgumentType.toWireType(destructors, v)); runDestructors(destructors); };
    } Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc); return []; }); return []; }); };
    var emval_freelist = [];
    var emval_handles = [0, 1, , 1, null, 1, true, 1, false, 1];
    var __emval_decref = handle => { if (handle > 9 && 0 === --emval_handles[handle + 1]) {
        var value = emval_handles[handle];
        emval_handles[handle] = undefined;
        emval_freelist.push(handle);
    } };
    var Emval = { toValue: handle => { if (!handle) {
            throwBindingError(`Cannot use deleted val. handle = ${handle}`);
        } return emval_handles[handle]; }, toHandle: value => { switch (value) {
            case undefined: return 2;
            case null: return 4;
            case true: return 6;
            case false: return 8;
            default: {
                const handle = emval_freelist.pop() || emval_handles.length;
                emval_handles[handle] = value;
                emval_handles[handle + 1] = 1;
                return handle;
            }
        } } };
    var EmValType = { name: "emscripten::val", fromWireType: handle => { var rv = Emval.toValue(handle); __emval_decref(handle); return rv; }, toWireType: (destructors, value) => Emval.toHandle(value), readValueFromPointer: readPointer, destructorFunction: null };
    var __embind_register_emval = rawType => registerType(rawType, EmValType);
    var floatReadValueFromPointer = (name, width) => { switch (width) {
        case 4: return function (pointer) { return this.fromWireType((growMemViews(), HEAPF32)[pointer >> 2]); };
        case 8: return function (pointer) { return this.fromWireType((growMemViews(), HEAPF64)[pointer >> 3]); };
        default: throw new TypeError(`invalid float width (${width}): ${name}`);
    } };
    var __embind_register_float = (rawType, name, size) => { name = AsciiToString(name); registerType(rawType, { name, fromWireType: value => value, toWireType: (destructors, value) => value, readValueFromPointer: floatReadValueFromPointer(name, size), destructorFunction: null }); };
    var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => { name = AsciiToString(name); const isUnsignedType = minRange === 0; let fromWireType = value => value; if (isUnsignedType) {
        var bitshift = 32 - 8 * size;
        fromWireType = value => value << bitshift >>> bitshift;
        maxRange = fromWireType(maxRange);
    } registerType(primitiveType, { name, fromWireType, toWireType: (destructors, value) => value, readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0), destructorFunction: null }); };
    var __embind_register_memory_view = (rawType, dataTypeIndex, name) => { var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array]; var TA = typeMapping[dataTypeIndex]; function decodeMemoryView(handle) { var size = (growMemViews(), HEAPU32)[handle >> 2]; var data = (growMemViews(), HEAPU32)[handle + 4 >> 2]; return new TA((growMemViews(), HEAP8).buffer, data, size); } name = AsciiToString(name); registerType(rawType, { name, fromWireType: decodeMemoryView, readValueFromPointer: decodeMemoryView }, { ignoreDuplicateRegistrations: true }); };
    var __embind_register_std_string = (rawType, name) => { name = AsciiToString(name); var stdStringIsUTF8 = true; registerType(rawType, { name, fromWireType(value) { var length = (growMemViews(), HEAPU32)[value >> 2]; var payload = value + 4; var str; if (stdStringIsUTF8) {
            str = UTF8ToString(payload, length, true);
        }
        else {
            str = "";
            for (var i = 0; i < length; ++i) {
                str += String.fromCharCode((growMemViews(), HEAPU8)[payload + i]);
            }
        } _free(value); return str; }, toWireType(destructors, value) { if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
        } var length; var valueIsOfTypeString = typeof value == "string"; if (!(valueIsOfTypeString || ArrayBuffer.isView(value) && value.BYTES_PER_ELEMENT == 1)) {
            throwBindingError("Cannot pass non-string to std::string");
        } if (stdStringIsUTF8 && valueIsOfTypeString) {
            length = lengthBytesUTF8(value);
        }
        else {
            length = value.length;
        } var base = _malloc(4 + length + 1); var ptr = base + 4; (growMemViews(), HEAPU32)[base >> 2] = length; if (valueIsOfTypeString) {
            if (stdStringIsUTF8) {
                stringToUTF8(value, ptr, length + 1);
            }
            else {
                for (var i = 0; i < length; ++i) {
                    var charCode = value.charCodeAt(i);
                    if (charCode > 255) {
                        _free(base);
                        throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
                    }
                    (growMemViews(), HEAPU8)[ptr + i] = charCode;
                }
            }
        }
        else {
            (growMemViews(), HEAPU8).set(value, ptr);
        } if (destructors !== null) {
            destructors.push(_free, base);
        } return base; }, readValueFromPointer: readPointer, destructorFunction(ptr) { _free(ptr); } }); };
    var UTF16Decoder = new TextDecoder("utf-16le");
    var UTF16ToString = (ptr, maxBytesToRead, ignoreNul) => { var idx = ptr >> 1; var endIdx = findStringEnd((growMemViews(), HEAPU16), idx, maxBytesToRead / 2, ignoreNul); return UTF16Decoder.decode((growMemViews(), HEAPU16).slice(idx, endIdx)); };
    var stringToUTF16 = (str, outPtr, maxBytesToWrite) => { maxBytesToWrite ??= 2147483647; if (maxBytesToWrite < 2)
        return 0; maxBytesToWrite -= 2; var startPtr = outPtr; var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length; for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        (growMemViews(), HEAP16)[outPtr >> 1] = codeUnit;
        outPtr += 2;
    } (growMemViews(), HEAP16)[outPtr >> 1] = 0; return outPtr - startPtr; };
    var lengthBytesUTF16 = str => str.length * 2;
    var UTF32ToString = (ptr, maxBytesToRead, ignoreNul) => { var str = ""; var startIdx = ptr >> 2; for (var i = 0; !(i >= maxBytesToRead / 4); i++) {
        var utf32 = (growMemViews(), HEAPU32)[startIdx + i];
        if (!utf32 && !ignoreNul)
            break;
        str += String.fromCodePoint(utf32);
    } return str; };
    var stringToUTF32 = (str, outPtr, maxBytesToWrite) => { maxBytesToWrite ??= 2147483647; if (maxBytesToWrite < 4)
        return 0; var startPtr = outPtr; var endPtr = startPtr + maxBytesToWrite - 4; for (var i = 0; i < str.length; ++i) {
        var codePoint = str.codePointAt(i);
        if (codePoint > 65535) {
            i++;
        }
        (growMemViews(), HEAP32)[outPtr >> 2] = codePoint;
        outPtr += 4;
        if (outPtr + 4 > endPtr)
            break;
    } (growMemViews(), HEAP32)[outPtr >> 2] = 0; return outPtr - startPtr; };
    var lengthBytesUTF32 = str => { var len = 0; for (var i = 0; i < str.length; ++i) {
        var codePoint = str.codePointAt(i);
        if (codePoint > 65535) {
            i++;
        }
        len += 4;
    } return len; };
    var __embind_register_std_wstring = (rawType, charSize, name) => { name = AsciiToString(name); var decodeString, encodeString, lengthBytesUTF; if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
    }
    else {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
    } registerType(rawType, { name, fromWireType: value => { var length = (growMemViews(), HEAPU32)[value >> 2]; var str = decodeString(value + 4, length * charSize, true); _free(value); return str; }, toWireType: (destructors, value) => { if (!(typeof value == "string")) {
            throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
        } var length = lengthBytesUTF(value); var ptr = _malloc(4 + length + charSize); (growMemViews(), HEAPU32)[ptr >> 2] = length / charSize; encodeString(value, ptr + 4, length + charSize); if (destructors !== null) {
            destructors.push(_free, ptr);
        } return ptr; }, readValueFromPointer: readPointer, destructorFunction(ptr) { _free(ptr); } }); };
    var __embind_register_void = (rawType, name) => { name = AsciiToString(name); registerType(rawType, { isVoid: true, name, fromWireType: () => undefined, toWireType: (destructors, o) => undefined }); };
    var __emscripten_init_main_thread_js = tb => { __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB, 262144, false); PThread.threadInitTLS(); };
    var callUserCallback = func => { func(); };
    var __emscripten_thread_mailbox_await = pthread_ptr => { if (!waitAsyncPolyfilled) {
        var wait = Atomics.waitAsync((growMemViews(), HEAP32), pthread_ptr >> 2, pthread_ptr);
        wait.value.then(checkMailbox);
        var waitingAsync = pthread_ptr + 120;
        Atomics.store((growMemViews(), HEAP32), waitingAsync >> 2, 1);
    } };
    var checkMailbox = () => { var pthread_ptr = _pthread_self(); if (!pthread_ptr)
        return; callUserCallback(() => { __emscripten_thread_mailbox_await(pthread_ptr); __emscripten_check_mailbox(); }); };
    var __emscripten_notify_mailbox_postmessage = (targetThread, currThreadId) => { if (targetThread == currThreadId) {
        setTimeout(checkMailbox);
    }
    else if (ENVIRONMENT_IS_PTHREAD) {
        postMessage({ targetThread, cmd: "checkMailbox" });
    }
    else {
        var worker = PThread.pthreads[targetThread];
        if (!worker) {
            return;
        }
        worker.postMessage({ cmd: "checkMailbox" });
    } };
    var proxiedJSCallArgs = [];
    var __emscripten_receive_on_main_thread_js = (funcIndex, emAsmAddr, callingThread, bufSize, args, ctx, ctxArgs) => { proxiedJSCallArgs.length = 0; var b = args >> 3; var end = args + bufSize >> 3; while (b < end) {
        var arg;
        if ((growMemViews(), HEAP64)[b++]) {
            arg = (growMemViews(), HEAP64)[b++];
        }
        else {
            arg = (growMemViews(), HEAPF64)[b++];
        }
        proxiedJSCallArgs.push(arg);
    } var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex]; PThread.currentProxiedOperationCallerThread = callingThread; var rtn = func(...proxiedJSCallArgs); PThread.currentProxiedOperationCallerThread = 0; if (ctx) {
        rtn.then(rtn => __emscripten_run_js_on_main_thread_done(ctx, ctxArgs, rtn));
        return;
    } return rtn; };
    var __emscripten_runtime_keepalive_clear = () => { };
    var __emscripten_thread_cleanup = thread => { if (!ENVIRONMENT_IS_PTHREAD)
        cleanupThread(thread);
    else
        postMessage({ cmd: "cleanupThread", thread }); };
    var __emscripten_thread_set_strongref = thread => { };
    var __emscripten_throw_longjmp = () => { throw new EmscriptenSjLj; };
    var emval_methodCallers = [];
    var emval_addMethodCaller = caller => { var id = emval_methodCallers.length; emval_methodCallers.push(caller); return id; };
    var requireRegisteredType = (rawType, humanName) => { var impl = registeredTypes[rawType]; if (undefined === impl) {
        throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
    } return impl; };
    var emval_lookupTypes = (argCount, argTypes) => { var a = new Array(argCount); for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType((growMemViews(), HEAPU32)[argTypes + i * 4 >> 2], `parameter ${i}`);
    } return a; };
    var emval_returnValue = (toReturnWire, destructorsRef, handle) => { var destructors = []; var result = toReturnWire(destructors, handle); if (destructors.length) {
        (growMemViews(), HEAPU32)[destructorsRef >> 2] = Emval.toHandle(destructors);
    } return result; };
    var emval_symbols = {};
    var getStringOrSymbol = address => { var symbol = emval_symbols[address]; if (symbol === undefined) {
        return AsciiToString(address);
    } return symbol; };
    var __emval_create_invoker = (argCount, argTypesPtr, kind) => { var GenericWireTypeSize = 8; var [retType, ...argTypes] = emval_lookupTypes(argCount, argTypesPtr); var toReturnWire = retType.toWireType.bind(retType); var argFromPtr = argTypes.map(type => type.readValueFromPointer.bind(type)); argCount--; var argN = new Array(argCount); var invokerFunction = (handle, methodName, destructorsRef, args) => { var offset = 0; for (var i = 0; i < argCount; ++i) {
        argN[i] = argFromPtr[i](args + offset);
        offset += GenericWireTypeSize;
    } var rv; switch (kind) {
        case 0:
            rv = Emval.toValue(handle).apply(null, argN);
            break;
        case 2:
            rv = Reflect.construct(Emval.toValue(handle), argN);
            break;
        case 3:
            rv = argN[0];
            break;
        case 1:
            rv = Emval.toValue(handle)[getStringOrSymbol(methodName)](...argN);
            break;
    } return emval_returnValue(toReturnWire, destructorsRef, rv); }; var functionName = `methodCaller<(${argTypes.map(t => t.name)}) => ${retType.name}>`; return emval_addMethodCaller(createNamedFunction(functionName, invokerFunction)); };
    var __emval_get_property = (handle, key) => { handle = Emval.toValue(handle); key = Emval.toValue(key); return Emval.toHandle(handle[key]); };
    var __emval_incref = handle => { if (handle > 9) {
        emval_handles[handle + 1] += 1;
    } };
    var __emval_invoke = (caller, handle, methodName, destructorsRef, args) => emval_methodCallers[caller](handle, methodName, destructorsRef, args);
    var __emval_new_array = () => Emval.toHandle([]);
    var __emval_new_cstring = v => Emval.toHandle(getStringOrSymbol(v));
    var __emval_new_object = () => Emval.toHandle({});
    var __emval_run_destructors = handle => { var destructors = Emval.toValue(handle); runDestructors(destructors); __emval_decref(handle); };
    var __emval_set_property = (handle, key, value) => { handle = Emval.toValue(handle); key = Emval.toValue(key); value = Emval.toValue(value); handle[key] = value; };
    var timers = {};
    var _emscripten_get_now = () => performance.timeOrigin + performance.now();
    function __setitimer_js(which, timeout_ms) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(6, 0, 1, which, timeout_ms); if (timers[which]) {
        clearTimeout(timers[which].id);
        delete timers[which];
    } if (!timeout_ms)
        return 0; var id = setTimeout(() => { delete timers[which]; callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now())); }, timeout_ms); timers[which] = { id, timeout_ms }; return 0; }
    var _emscripten_date_now = () => Date.now();
    var INT53_MAX = 9007199254740992;
    var INT53_MIN = -9007199254740992;
    var bigintToI53Checked = num => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
    var readEmAsmArgsArray = [];
    var readEmAsmArgs = (sigPtr, buf) => { readEmAsmArgsArray.length = 0; var ch; while (ch = (growMemViews(), HEAPU8)[sigPtr++]) {
        var wide = ch != 105;
        wide &= ch != 112;
        buf += wide && buf % 8 ? 4 : 0;
        readEmAsmArgsArray.push(ch == 112 ? (growMemViews(), HEAPU32)[buf >> 2] : ch == 106 ? (growMemViews(), HEAP64)[buf >> 3] : ch == 105 ? (growMemViews(), HEAP32)[buf >> 2] : (growMemViews(), HEAPF64)[buf >> 3]);
        buf += wide ? 8 : 4;
    } return readEmAsmArgsArray; };
    var runEmAsmFunction = (code, sigPtr, argbuf) => { var args = readEmAsmArgs(sigPtr, argbuf); return ASM_CONSTS[code](...args); };
    var _emscripten_asm_const_ptr = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);
    var _emscripten_check_blocking_allowed = () => { };
    var _emscripten_err = str => err(UTF8ToString(str));
    var _emscripten_exit_with_live_runtime = () => { throw "unwind"; };
    var getHeapMax = () => 2147483648;
    var _emscripten_get_heap_max = () => getHeapMax();
    var _emscripten_num_logical_cores = () => navigator["hardwareConcurrency"];
    var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
    var growMemory = size => { var oldHeapSize = wasmMemory.buffer.byteLength; var pages = (size - oldHeapSize + 65535) / 65536 | 0; try {
        wasmMemory.grow(pages);
        updateMemoryViews();
        return 1;
    }
    catch (e) { } };
    var _emscripten_resize_heap = requestedSize => { var oldSize = (growMemViews(), HEAPU8).length; requestedSize >>>= 0; if (requestedSize <= oldSize) {
        return false;
    } var maxHeapSize = getHeapMax(); if (requestedSize > maxHeapSize) {
        return false;
    } for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = growMemory(newSize);
        if (replacement) {
            return true;
        }
    } return false; };
    var ENV = {};
    var getExecutableName = () => "./this.program";
    var getEnvStrings = () => { if (!getEnvStrings.strings) {
        var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
        var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
        for (var x in ENV) {
            if (ENV[x] === undefined)
                delete env[x];
            else
                env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
            strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
    } return getEnvStrings.strings; };
    function _environ_get(__environ, environ_buf) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(7, 0, 1, __environ, environ_buf); var bufSize = 0; var envp = 0; for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        (growMemViews(), HEAPU32)[__environ + envp >> 2] = ptr;
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 4;
    } return 0; }
    function _environ_sizes_get(penviron_count, penviron_buf_size) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(8, 0, 1, penviron_count, penviron_buf_size); var strings = getEnvStrings(); (growMemViews(), HEAPU32)[penviron_count >> 2] = strings.length; var bufSize = 0; for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
    } (growMemViews(), HEAPU32)[penviron_buf_size >> 2] = bufSize; return 0; }
    function _fd_close(fd) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(9, 0, 1, fd); return 52; }
    function _fd_read(fd, iov, iovcnt, pnum) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(10, 0, 1, fd, iov, iovcnt, pnum); return 52; }
    function _fd_seek(fd, offset, whence, newOffset) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(11, 0, 1, fd, offset, whence, newOffset); offset = bigintToI53Checked(offset); return 70; }
    var printCharBuffers = [null, [], []];
    var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => { var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul); return UTF8Decoder.decode(heapOrArray.buffer ? heapOrArray.buffer instanceof ArrayBuffer ? heapOrArray.subarray(idx, endPtr) : heapOrArray.slice(idx, endPtr) : new Uint8Array(heapOrArray.slice(idx, endPtr))); };
    var printChar = (stream, curr) => { var buffer = printCharBuffers[stream]; if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
        buffer.length = 0;
    }
    else {
        buffer.push(curr);
    } };
    function _fd_write(fd, iov, iovcnt, pnum) { if (ENVIRONMENT_IS_PTHREAD)
        return proxyToMainThread(12, 0, 1, fd, iov, iovcnt, pnum); var num = 0; for (var i = 0; i < iovcnt; i++) {
        var ptr = (growMemViews(), HEAPU32)[iov >> 2];
        var len = (growMemViews(), HEAPU32)[iov + 4 >> 2];
        iov += 8;
        for (var j = 0; j < len; j++) {
            printChar(fd, (growMemViews(), HEAPU8)[ptr + j]);
        }
        num += len;
    } (growMemViews(), HEAPU32)[pnum >> 2] = num; return 0; }
    var initRandomFill = () => view => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 0);
    var randomFill = view => (randomFill = initRandomFill())(view);
    var _random_get = (buffer, size) => randomFill((growMemViews(), HEAPU8).subarray(buffer, buffer + size));
    PThread.init();
    init_ClassHandle();
    init_RegisteredPointer();
    var proxiedFunctionTable = [_proc_exit, pthreadCreateProxied, ___syscall_fcntl64, ___syscall_getdents64, ___syscall_ioctl, ___syscall_openat, __setitimer_js, _environ_get, _environ_sizes_get, _fd_close, _fd_read, _fd_seek, _fd_write];
    var ASM_CONSTS = { 613693: $0 => stringToNewUTF8(Emval.toValue($0)) };
    var __ZdlPvm, _pthread_self, __Znwm, _free, _malloc, _calloc, ___getTypeName, __embind_initialize_bindings, _emscripten_builtin_free, __emscripten_tls_init, __emscripten_thread_init, ___set_thread_state, __emscripten_thread_crashed, ___libc_free, _emscripten_builtin_malloc, ___libc_malloc, __emscripten_run_js_on_main_thread_done, __emscripten_run_js_on_main_thread, __emscripten_thread_free_data, __emscripten_thread_exit, __emscripten_timeout, __emscripten_check_mailbox, __ZdaPv, __ZdaPvm, __ZdlPv, __Znam, __ZnamSt11align_val_t, __ZnwmSt11align_val_t, ___libc_calloc, ___libc_realloc, _emscripten_builtin_calloc, _emscripten_builtin_realloc, _malloc_size, _malloc_usable_size, _reallocf, _setThrew, _emscripten_stack_set_limits, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, __indirect_function_table, wasmTable;
    function assignWasmExports(wasmExports) { __ZdlPvm = Module["__ZdlPvm"] = wasmExports["ia"]; _pthread_self = wasmExports["ja"]; __Znwm = Module["__Znwm"] = wasmExports["ka"]; _free = wasmExports["la"]; _malloc = Module["_malloc"] = wasmExports["ma"]; _calloc = Module["_calloc"] = wasmExports["na"]; ___getTypeName = wasmExports["oa"]; __embind_initialize_bindings = wasmExports["pa"]; _emscripten_builtin_free = Module["_emscripten_builtin_free"] = wasmExports["qa"]; __emscripten_tls_init = wasmExports["ra"]; __emscripten_thread_init = wasmExports["ta"]; ___set_thread_state = wasmExports["ua"]; __emscripten_thread_crashed = wasmExports["va"]; ___libc_free = Module["___libc_free"] = wasmExports["wa"]; _emscripten_builtin_malloc = Module["_emscripten_builtin_malloc"] = wasmExports["xa"]; ___libc_malloc = Module["___libc_malloc"] = wasmExports["ya"]; __emscripten_run_js_on_main_thread_done = wasmExports["za"]; __emscripten_run_js_on_main_thread = wasmExports["Aa"]; __emscripten_thread_free_data = wasmExports["Ba"]; __emscripten_thread_exit = wasmExports["Ca"]; __emscripten_timeout = wasmExports["Da"]; __emscripten_check_mailbox = wasmExports["Ea"]; __ZdaPv = Module["__ZdaPv"] = wasmExports["Fa"]; __ZdaPvm = Module["__ZdaPvm"] = wasmExports["Ga"]; __ZdlPv = Module["__ZdlPv"] = wasmExports["Ha"]; __Znam = Module["__Znam"] = wasmExports["Ia"]; __ZnamSt11align_val_t = Module["__ZnamSt11align_val_t"] = wasmExports["Ja"]; __ZnwmSt11align_val_t = Module["__ZnwmSt11align_val_t"] = wasmExports["Ka"]; ___libc_calloc = Module["___libc_calloc"] = wasmExports["La"]; ___libc_realloc = Module["___libc_realloc"] = wasmExports["Ma"]; _emscripten_builtin_calloc = Module["_emscripten_builtin_calloc"] = wasmExports["Na"]; _emscripten_builtin_realloc = Module["_emscripten_builtin_realloc"] = wasmExports["Oa"]; _malloc_size = Module["_malloc_size"] = wasmExports["Pa"]; _malloc_usable_size = Module["_malloc_usable_size"] = wasmExports["Qa"]; _reallocf = Module["_reallocf"] = wasmExports["Ra"]; _setThrew = wasmExports["Sa"]; _emscripten_stack_set_limits = wasmExports["Ta"]; __emscripten_stack_restore = wasmExports["Ua"]; __emscripten_stack_alloc = wasmExports["Va"]; _emscripten_stack_get_current = wasmExports["Wa"]; __indirect_function_table = wasmTable = wasmExports["sa"]; }
    var wasmImports;
    function assignWasmImports() { wasmImports = { b: ___assert_fail, Q: ___pthread_create_js, y: ___syscall_fcntl64, P: ___syscall_getdents64, Y: ___syscall_ioctl, z: ___syscall_openat, L: __abort_js, B: __embind_register_bigint, ba: __embind_register_bool, ga: __embind_register_class, fa: __embind_register_class_constructor, d: __embind_register_class_function, da: __embind_register_class_property, $: __embind_register_emval, A: __embind_register_float, l: __embind_register_integer, e: __embind_register_memory_view, aa: __embind_register_std_string, t: __embind_register_std_wstring, ca: __embind_register_void, T: __emscripten_init_main_thread_js, M: __emscripten_notify_mailbox_postmessage, x: __emscripten_receive_on_main_thread_js, H: __emscripten_runtime_keepalive_clear, v: __emscripten_thread_cleanup, S: __emscripten_thread_mailbox_await, _: __emscripten_thread_set_strongref, F: __emscripten_throw_longjmp, h: __emval_create_invoker, c: __emval_decref, ea: __emval_get_property, i: __emval_incref, g: __emval_invoke, p: __emval_new_array, j: __emval_new_cstring, s: __emval_new_object, f: __emval_run_destructors, k: __emval_set_property, I: __setitimer_js, n: _emscripten_asm_const_ptr, w: _emscripten_check_blocking_allowed, m: _emscripten_date_now, u: _emscripten_err, Z: _emscripten_exit_with_live_runtime, N: _emscripten_get_heap_max, o: _emscripten_get_now, O: _emscripten_num_logical_cores, J: _emscripten_resize_heap, U: _environ_get, V: _environ_sizes_get, q: _exit, r: _fd_close, X: _fd_read, R: _fd_seek, W: _fd_write, E: invoke_iii, C: invoke_iiii, D: invoke_iiiii, a: wasmMemory, G: _proc_exit, K: _random_get }; }
    function invoke_iii(index, a1, a2) { var sp = stackSave(); try {
        return getWasmTableEntry(index)(a1, a2);
    }
    catch (e) {
        stackRestore(sp);
        if (!(e instanceof EmscriptenEH))
            throw e;
        _setThrew(1, 0);
    } }
    function invoke_iiiii(index, a1, a2, a3, a4) { var sp = stackSave(); try {
        return getWasmTableEntry(index)(a1, a2, a3, a4);
    }
    catch (e) {
        stackRestore(sp);
        if (!(e instanceof EmscriptenEH))
            throw e;
        _setThrew(1, 0);
    } }
    function invoke_iiii(index, a1, a2, a3) { var sp = stackSave(); try {
        return getWasmTableEntry(index)(a1, a2, a3);
    }
    catch (e) {
        stackRestore(sp);
        if (!(e instanceof EmscriptenEH))
            throw e;
        _setThrew(1, 0);
    } }
    function initRuntime(wasmExports) { runtimeInitialized = true; PThread.tlsInitFunctions.push(wasmExports["ra"]); if (ENVIRONMENT_IS_PTHREAD)
        return; wasmExports["ha"](); }
    var wasmModule;
    function loadModule() { assignWasmImports(); var imports = { a: wasmImports }; WebAssembly.instantiateStreaming(fetch(new URL(/* asset import */ __webpack_require__(596), __webpack_require__.b)), imports).then(output => { var wasmExports = (output.instance || output).exports; wasmModule = output.module || Module["wasm"]; assignWasmExports(wasmExports); callRuntimeCallbacks(onPreRuns); initRuntime(wasmExports); PThread.loadWasmModuleToAllWorkers().then(ready); }); }
    if (!ENVIRONMENT_IS_PTHREAD) {
        loadModule();
    }
    if (runtimeInitialized) {
        moduleRtn = Module;
    }
    else {
        moduleRtn = new Promise((resolve, reject) => { readyPromiseResolve = resolve; readyPromiseReject = reject; });
    }
    ;
    return moduleRtn;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Module);
var isPthread = globalThis.name == "em-pthread";
isPthread && Module();
//# sourceMappingURL=jassub-worker.js.map

/***/ }),

/***/ 596:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "bbff2fe8d5761339ab88.wasm";

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/******/ // expose the modules object (__webpack_modules__)
/******/ __webpack_require__.m = __webpack_modules__;
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/create fake namespace object */
/******/ (() => {
/******/ 	var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 	var leafPrototypes;
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 16: return value when it's Promise-like
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = this(value);
/******/ 		if(mode & 8) return value;
/******/ 		if(typeof value === 'object' && value) {
/******/ 			if((mode & 4) && value.__esModule) return value;
/******/ 			if((mode & 16) && typeof value.then === 'function') return value;
/******/ 		}
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		var def = {};
/******/ 		leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 		for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 			Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 		}
/******/ 		def['default'] = () => (value);
/******/ 		__webpack_require__.d(ns, def);
/******/ 		return ns;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/ensure chunk */
/******/ (() => {
/******/ 	__webpack_require__.f = {};
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = (chunkId) => {
/******/ 		return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 			__webpack_require__.f[key](chunkId, promises);
/******/ 			return promises;
/******/ 		}, []));
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/get javascript chunk filename */
/******/ (() => {
/******/ 	// This function allow to reference async chunks
/******/ 	__webpack_require__.u = (chunkId) => {
/******/ 		// return url for filenames based on template
/******/ 		return "" + chunkId + ".jassub-worker.bundle.js";
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/publicPath */
/******/ (() => {
/******/ 	var scriptUrl;
/******/ 	if (typeof import.meta.url === "string") scriptUrl = import.meta.url
/******/ 	// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 	// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 	if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 	scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 	__webpack_require__.p = scriptUrl;
/******/ })();
/******/ 
/******/ /* webpack/runtime/import chunk loading */
/******/ (() => {
/******/ 	__webpack_require__.b = new URL("./", import.meta.url);
/******/ 	
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// [resolve, Promise] = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		602: 0,
/******/ 		792: 0
/******/ 	};
/******/ 	
/******/ 	var installChunk = (data) => {
/******/ 		var {__webpack_ids__, __webpack_modules__, __webpack_runtime__} = data;
/******/ 		// add "modules" to the modules object,
/******/ 		// then flag all "ids" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0;
/******/ 		for(moduleId in __webpack_modules__) {
/******/ 			if(__webpack_require__.o(__webpack_modules__, moduleId)) {
/******/ 				__webpack_require__.m[moduleId] = __webpack_modules__[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(__webpack_runtime__) __webpack_runtime__(__webpack_require__);
/******/ 		for(;i < __webpack_ids__.length; i++) {
/******/ 			chunkId = __webpack_ids__[i];
/******/ 			if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				installedChunks[chunkId][0]();
/******/ 			}
/******/ 			installedChunks[__webpack_ids__[i]] = 0;
/******/ 		}
/******/ 	
/******/ 	}
/******/ 	
/******/ 	__webpack_require__.f.j = (chunkId, promises) => {
/******/ 			// import() chunk loading for javascript
/******/ 			var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 			if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 	
/******/ 				// a Promise means "currently loading".
/******/ 				if(installedChunkData) {
/******/ 					promises.push(installedChunkData[1]);
/******/ 				} else {
/******/ 					if(true) { // all chunks have JS
/******/ 						// setup Promise in chunk cache
/******/ 						var promise = import("./" + __webpack_require__.u(chunkId)).then(installChunk, (e) => {
/******/ 							if(installedChunks[chunkId] !== 0) installedChunks[chunkId] = undefined;
/******/ 							throw e;
/******/ 						});
/******/ 						var promise = Promise.race([promise, new Promise((resolve) => (installedChunkData = installedChunks[chunkId] = [resolve]))])
/******/ 						promises.push(installedChunkData[1] = promise);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 	};
/******/ 	
/******/ 	// no prefetching
/******/ 	
/******/ 	// no preloaded
/******/ 	
/******/ 	// no external install chunk
/******/ 	
/******/ 	// no on chunks loaded
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  z: () => (/* binding */ ASSRenderer)
});

;// ./node_modules/abslink/src/types.js
const WireValueType = {
    RAW: 'RAW',
    PROXY: 'PROXY',
    THROW: 'THROW',
    HANDLER: 'HANDLER'
};
const MessageType = {
    GET: 'GET',
    SET: 'SET',
    APPLY: 'APPLY',
    CONSTRUCT: 'CONSTRUCT',
    RELEASE: 'RELEASE'
};
//# sourceMappingURL=types.js.map
;// ./node_modules/abslink/src/abslink.js
/* eslint-disable @typescript-eslint/no-unsafe-function-type */


const proxyMarker = Symbol('Abslink.proxy');
const releaseProxy = Symbol('Abslink.releaseProxy');
const finalizer = Symbol('Abslink.finalizer');
const throwMarker = Symbol('Abslink.thrown');
const isObject = (val) => (typeof val === 'object' && val !== null) || typeof val === 'function';
/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && proxyMarker in val,
    serialize(obj, ep) {
        const markerID = obj[proxyMarker];
        expose(obj, ep, markerID);
        return [markerID, []];
    },
    deserialize(markerID, ep) {
        return wrap(ep, markerID);
    }
};
/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack
                }
            };
        }
        else {
            serialized = { isError: false, value };
        }
        return [serialized, []];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        // eslint-disable-next-line no-throw-literal
        throw serialized.value;
    }
};
/**
 * Allows customizing the serialization of certain values.
 */
const transferHandlers = new Map([
    ['proxy', proxyTransferHandler],
    ['throw', throwTransferHandler]
]);
function filterPath(path, obj) {
    let parent = obj;
    const parentPath = path.slice(0, -1);
    for (const segment of parentPath) {
        // Object.hasOwn() would work, but backwards compatibility...
        if (Object.prototype.hasOwnProperty.call(parent, segment)) {
            parent = parent[segment];
        }
    }
    const lastSegment = path[path.length - 1];
    const RawValue = lastSegment ? parent[lastSegment] : parent;
    return { parent, RawValue, lastSegment };
}
function expose(obj, ep, rootMarkerID) {
    ep.on('message', function callback(data) {
        if (!data)
            return;
        const { id, type, path, markerID } = {
            path: [],
            ...data
        };
        if (markerID !== rootMarkerID)
            return;
        const argumentList = (data.argumentList ?? []).map((v) => fromWireValue(v, ep));
        let returnValue;
        try {
            const { parent, RawValue, lastSegment } = filterPath(path, obj);
            switch (type) {
                case MessageType.GET:
                    returnValue = RawValue;
                    break;
                case MessageType.SET:
                    parent[lastSegment] = fromWireValue(data.value, ep);
                    returnValue = true;
                    break;
                case MessageType.APPLY:
                    returnValue = RawValue.apply(parent, argumentList);
                    break;
                case MessageType.CONSTRUCT:
                    returnValue = new RawValue(...argumentList);
                    break;
                case MessageType.RELEASE:
                    returnValue = undefined;
                    break;
                default:
                    return;
            }
        }
        catch (value) {
            returnValue = { value, [throwMarker]: 0 };
        }
        Promise.resolve(returnValue)
            .catch((value) => {
            return { value, [throwMarker]: 0 };
        })
            .then((returnValue) => {
            // support async constructors
            // A thrown value must reach the caller as an error. Do not proxy it.
            if (type === MessageType.CONSTRUCT && !(isObject(returnValue) && throwMarker in returnValue)) {
                returnValue = proxy(returnValue);
            }
            const [wireValue, transfer] = toWireValue(returnValue, ep);
            ep.postMessage({ ...wireValue, id, markerID: rootMarkerID }, transfer);
            if (type === MessageType.RELEASE) {
                // detach and deactive after sending release response above.
                ep.off('message', callback);
                obj[finalizer]?.();
            }
        })
            .catch(_ => {
            // Send Serialization Error To Caller
            const [wireValue, transfer] = toWireValue({
                value: new TypeError('Unserializable return value'),
                [throwMarker]: 0
            }, ep);
            ep.postMessage({ ...wireValue, id, markerID: rootMarkerID }, transfer);
        });
    });
    return obj;
}
function wrap(endpoint, rootMarkerID) {
    const pendingListeners = new Map();
    endpoint.on('message', (data) => {
        if (!data?.id) {
            return;
        }
        const resolver = pendingListeners.get(data.id);
        if (!resolver) {
            return;
        }
        try {
            resolver(data);
        }
        finally {
            pendingListeners.delete(data.id);
        }
    });
    return createProxy({ endpoint, pendingListeners, rootMarkerID });
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error('Proxy has been released and is not useable');
    }
}
async function releaseEndpoint(epWithPendingListeners) {
    await requestResponseMessage(epWithPendingListeners, { type: MessageType.RELEASE });
}
const proxyCounter = new WeakMap();
const proxyFinalizers = 'FinalizationRegistry' in globalThis &&
    new FinalizationRegistry((epWithPendingListeners) => {
        const newCount = (proxyCounter.get(epWithPendingListeners) ?? 0) - 1;
        proxyCounter.set(epWithPendingListeners, newCount);
        if (newCount === 0) {
            releaseEndpoint(epWithPendingListeners).finally(() => {
                epWithPendingListeners.pendingListeners.clear();
            });
        }
    });
function registerProxy(proxy, epWithPendingListeners) {
    const newCount = (proxyCounter.get(epWithPendingListeners) ?? 0) + 1;
    proxyCounter.set(epWithPendingListeners, newCount);
    if (proxyFinalizers) {
        proxyFinalizers.register(proxy, epWithPendingListeners, proxy);
    }
}
function unregisterProxy(proxy) {
    if (proxyFinalizers) {
        proxyFinalizers.unregister(proxy);
    }
}
function createProxy(epWithPendingListeners, path = []) {
    let isProxyReleased = false;
    const propProxyCache = new Map();
    const proxy = new Proxy(function () { }, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return async () => {
                    for (const subProxy of propProxyCache.values()) {
                        subProxy[releaseProxy]();
                    }
                    propProxyCache.clear();
                    unregisterProxy(proxy);
                    releaseEndpoint(epWithPendingListeners).finally(() => {
                        epWithPendingListeners.pendingListeners.clear();
                    });
                    isProxyReleased = true;
                };
            }
            if (prop === 'then') {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(epWithPendingListeners, {
                    type: MessageType.GET,
                    path: path.map((p) => p.toString())
                }).then(v => fromWireValue(v, epWithPendingListeners.endpoint));
                return r.then.bind(r);
            }
            const cachedProxy = propProxyCache.get(prop);
            if (cachedProxy) {
                return cachedProxy;
            }
            const propProxy = createProxy(epWithPendingListeners, [...path, prop]);
            propProxyCache.set(prop, propProxy);
            return propProxy;
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transfer] = toWireValue(rawValue, epWithPendingListeners.endpoint);
            return requestResponseMessage(epWithPendingListeners, {
                type: MessageType.SET,
                path: [...path, prop].map((p) => p.toString()),
                value
            }, transfer).then(v => fromWireValue(v, epWithPendingListeners.endpoint));
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            // We just pretend that `bind()` didn’t happen.
            if (last === 'bind') {
                return createProxy(epWithPendingListeners, path.slice(0, -1));
            }
            const [argumentList, transfer] = processArguments(rawArgumentList, epWithPendingListeners);
            return requestResponseMessage(epWithPendingListeners, {
                type: MessageType.APPLY,
                path: path.map((p) => p.toString()),
                argumentList
            }, transfer).then(v => fromWireValue(v, epWithPendingListeners.endpoint));
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transfer] = processArguments(rawArgumentList, epWithPendingListeners);
            return requestResponseMessage(epWithPendingListeners, {
                type: MessageType.CONSTRUCT,
                path: path.map((p) => p.toString()),
                argumentList
            }, transfer).then(v => fromWireValue(v, epWithPendingListeners.endpoint));
        }
    });
    registerProxy(proxy, epWithPendingListeners);
    return proxy;
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function processArguments(argumentList, epWithPendingListeners) {
    const wireValues = [];
    const transferables = [];
    for (const argument of argumentList) {
        const [wireValue, transfer] = toWireValue(argument, epWithPendingListeners.endpoint);
        wireValues.push(wireValue);
        transferables.push(...transfer);
    }
    return [wireValues, transferables];
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: randomId() });
}
function toWireValue(value, ep) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transfer] = handler.serialize(value, ep);
            return [{
                    type: WireValueType.HANDLER,
                    name,
                    value: serializedValue
                }, transfer];
        }
    }
    return [{
            type: WireValueType.RAW,
            value
        }, transferCache.get(value) ?? []];
}
function fromWireValue(value, ep) {
    switch (value.type) {
        case WireValueType.HANDLER:
            return transferHandlers.get(value.name).deserialize(value.value, ep);
        case WireValueType.RAW:
            return value.value;
    }
}
function requestResponseMessage(ep, msg, transfer = []) {
    return new Promise((resolve) => {
        const id = randomId();
        ep.pendingListeners.set(id, resolve);
        ep.endpoint.postMessage({ id, ...msg, markerID: ep.rootMarkerID }, transfer);
    });
}
const hex = [];
const alphabet = '0123456789abcdef';
for (let i = 0; i < 256; i++) {
    hex[i] = alphabet[i >> 4 & 0xf] + alphabet[i & 0xf];
}
let step = 0;
let buffer = '';
function randomId() {
    let i = 0;
    if (!buffer || ((step + 16) > 256 * 2)) {
        for (buffer = '', step = 0; i < 256; ++i) {
            buffer += hex[Math.random() * 256 | 0];
        }
    }
    return buffer.substring(step, ++step + 16);
}
//# sourceMappingURL=abslink.js.map
;// ./node_modules/abslink/adapters/w3c.js

function createWrapper(channel, messageable) {
    const listeners = new WeakMap();
    channel.start?.();
    messageable.start?.();
    return {
        on(event, listener) {
            const unwrapped = (event) => listener(event.data);
            if ('addEventListener' in channel) {
                channel.addEventListener(event, unwrapped);
            }
            else if ('addListener' in channel) {
                channel.addListener(event, unwrapped);
            }
            else {
                channel.on(event, unwrapped);
            }
            listeners.set(listener, unwrapped);
        },
        off(event, listener) {
            const unwrapped = listeners.get(listener);
            if ('removeEventListener' in channel) {
                channel.removeEventListener(event, unwrapped);
            }
            else if ('removeListener' in channel) {
                channel.removeListener(event, unwrapped);
            }
            else {
                channel.off(event, unwrapped);
            }
            listeners.delete(listener);
        },
        postMessage(message, transfer = []) {
            messageable.postMessage(message, transfer);
        }
    };
}
function w3c_wrap(channel, messageable = channel) {
    return _wrap(createWrapper(channel, messageable));
}
function w3c_expose(obj, channel = globalThis, messageable = channel) {
    return expose(obj, createWrapper(channel, messageable));
}
//# sourceMappingURL=w3c.js.map
;// ./node_modules/lfa-ponyfill/index.js
// @ts-expect-error non-standard api
const SUPPORTS = 'queryLocalFonts' in globalThis && globalThis.queryLocalFonts

/** @type {{[weight: number]: string}} */
const WEIGHT_MAP = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular', // Normal isn't used
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
  1000: 'UltraBlack'
}

class FontData {
  family
  fullName
  postscriptName
  style

  #weight
  #isItalic

  /** @param {{family: string, weight: string, isItalic: boolean, weightName: string}} param0 */
  constructor ({ family, weight, isItalic, weightName }) {
    this.family = family
    this.#weight = weight
    this.#isItalic = isItalic

    // general name fuckery
    const isRegular = weightName === 'Regular'
    // Regular Italic => Italic
    // Regular => Regular
    // Medium => Medium
    // Medium Italic => Medium Italic
    if (isRegular) {
      if (isItalic) {
        this.style = 'Italic'
      } else {
        this.style = 'Regular'
      }
    } else {
      this.style = weightName + (isItalic ? ' Italic' : '')
    }
    // Arial Regular => Arial
    // Arial Regular Italic => Arial Italic
    // Arial Medium => Arial Medium
    // Arial Medium Italic => Arial Medium Italic
    if (this.style === 'Regular') {
      this.fullName = family
    } else {
      this.fullName = `${family} ${this.style}`
    }
    this.postscriptName = this.fullName.replace(/ /g, '-')
  }

  async blob () {
    const response = await fetch(`https://fonts.googleapis.com/css2?family=${this.family}:${this.#isItalic ? 'ital,' : ''}wght@${this.#isItalic ? '1,' : ''}${this.#weight}`)
    const css = await response.text()
    const matches = [
      /\/\* latin-ext \*\/[\s\S]+url\(([^)]+)\)/, // get first latin woff2 url from css
      /\/\* latin \*\/[\s\S]+url\(([^)]+)\)/, // TODO: what if some1 wants a japanse font but it includes latin? "Noto Sans JP"
      /url\(([^)]+)\)/
    ]
    for (const match of matches) {
      const url = css.match(match)?.[1]
      if (url) {
        const response = await fetch(url)
        if (response.ok) return response.blob()
      }
    }
    throw new Error('Failed to load font blob')
  }
}

/** @param {import('./typedef.d.ts').FamilyMetadata} familyMetadata */
function fromMetadata ([family, sizes]) {
  const fontData = []
  for (const _type of sizes) {
    // google likes to split their fonts into minimal parts, we'll try to get as wide of a range as possible, so if someone requests 'normal', they'll get all weights [if available]
    // 1 or '1i' or '1a10' or '1a10i'
    const type = '' + _type
    const isItalic = type.endsWith('i')
    const weight = type.replace('i', '')
    if (weight.includes('a')) {
      const [min, max] = weight.split('a').map(a => parseInt(a) * 100)
      for (let i = min; i <= max; i += 100) {
        fontData.push(new FontData({ family: family, weight: `${min}..${max}`, isItalic, weightName: WEIGHT_MAP[i] }))
      }
    } else {
      fontData.push(new FontData({ family: family, weight: `${weight}00`, isItalic, weightName: WEIGHT_MAP[parseInt(weight) * 100] }))
    }
  }
  return fontData
}

/** @type {Map<any, FontData>} */
let fontCache = new Map()

async function getFontCache () {
  if (fontCache.size === 0) {
    // import async, as this is absolutely massive and potentially laggy
    // also allows for code splitting
    // storing hardcoded objects is faster as json, https://v8.dev/blog/cost-of-javascript-2019#json
    /** @type {{default: import('./typedef.d.ts').FamilyMetadata[]}} */
    // @ts-expect-error override
    const fonts = await __webpack_require__.e(/* import() */ 913).then(__webpack_require__.t.bind(__webpack_require__, 913, 17))
    for (const font of fonts.default.flatMap(familyMetadata => fromMetadata(familyMetadata))) {
      fontCache.set(font.postscriptName.toLowerCase().replace(/-/g, ''), font)
    }
  }
  return fontCache
}

/**
 * @param {{postscriptNames?: string[]}} param0
 * @returns {Promise<FontData[]>}
 */
async function queryRemoteFonts ({ postscriptNames } = {}) {
  const fontCache = await getFontCache()

  if (!postscriptNames) return [...fontCache.values()]
  if (postscriptNames.length === 0) return []

  return postscriptNames.reduce((acc, postscriptName) => {
    const font = fontCache.get(postscriptName.toLowerCase().replace(/regular$/, '').replace(/-reg$/, '').replace(/[- ]/g, ''))
    if (font) acc.push(font)
    return acc
  }, /** @type {FontData[]} */([]))
}

/**
 * @param {{postscriptNames?: string[]}} param0
 * @returns {Promise<FontData[]>}
 */
async function queryLocalFonts ({ postscriptNames } = {}) {
  if (SUPPORTS) return SUPPORTS({ postscriptNames })
  return queryRemoteFonts({ postscriptNames })
}

// EXTERNAL MODULE: ./node_modules/jassub/dist/wasm/jassub-worker.js
var jassub_worker = __webpack_require__(407);
;// ./node_modules/jassub/dist/worker/renderers/2d-renderer.js
class Canvas2DRenderer {
    canvas = null;
    ctx = null;
    bufferCanvas = new OffscreenCanvas(1, 1);
    bufferCtx = this.bufferCanvas.getContext('2d', {
        alpha: true,
        desynchronized: true,
        willReadFrequently: false
    });
    _scheduledResize;
    resizeCanvas(width, height) {
        if (!width || !height)
            return;
        if (this.canvas?.width === width && this.canvas?.height === height)
            return;
        this._scheduledResize = { width, height };
    }
    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        if (!this.ctx)
            throw new Error('Could not get 2D context');
    }
    // not supported
    // https://issues.chromium.org/u/1/issues/40910142
    setColorMatrix(subtitleColorSpace, videoColorSpace) { }
    // this is horribly inefficient, but it's a fallback for systems without a GPU, this is the least of their problems
    render(images, heap) {
        if (!this.ctx || !this.canvas)
            return;
        if (this._scheduledResize) {
            const { width, height } = this._scheduledResize;
            this._scheduledResize = undefined;
            this.canvas.width = width;
            this.canvas.height = height;
        }
        else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        for (const img of images) {
            if (img.w <= 0 || img.h <= 0)
                continue;
            const imageData = new ImageData(img.w, img.h);
            const pixels = new Uint32Array(imageData.data.buffer);
            const color = ((img.color << 8) & 0xff0000) | ((img.color >> 8) & 0xff00) | ((img.color >> 24) & 0xff);
            const alpha = (255 - (img.color & 255)) / 255;
            const stride = img.stride;
            const h = img.h;
            const w = img.w;
            for (let y = h + 1, pos = img.bitmap, res = 0; --y; pos += stride) {
                for (let z = 0; z < w; ++z, ++res) {
                    const k = heap[pos + z];
                    if (k !== 0)
                        pixels[res] = ((alpha * k) << 24) | color;
                }
            }
            // Draw the ImageData to canvas at the destination position
            this.bufferCanvas.width = w;
            this.bufferCanvas.height = h;
            this.bufferCtx.putImageData(imageData, 0, 0);
            this.ctx.drawImage(this.bufferCanvas, img.dst_x, img.dst_y);
        }
    }
    destroy() {
        this.ctx = null;
        this.canvas = null;
        this.bufferCtx = null;
        this.bufferCanvas = null;
    }
}
//# sourceMappingURL=2d-renderer.js.map
;// ./node_modules/jassub/dist/worker/util.js
// offset by 1, 0 = 1, to match CSS font-weight values, but dividing by 100 gives the correct index
const util_WEIGHT_MAP = [
    'thin',
    'extralight',
    'light',
    'regular', // Normal isn't used
    'medium',
    'semibold',
    'bold',
    'extrabold',
    'black',
    'ultrablack'
];
const UA = navigator.userAgent.toLowerCase();
const IS_FIREFOX = UA.includes('firefox');
const IS_SAFARI = /applewebkit\/[\d.]+ \(khtml, like gecko\)(?!.*chrome\/)/.test(UA);
const a = 'BT601';
const b = 'BT709';
const c = 'SMPTE240M';
const d = 'FCC';
const LIBASS_YCBCR_MAP = [null, a, null, a, a, b, b, c, c, d, d];
const _fetch = globalThis.fetch;
async function fetchtext(url) {
    const res = await _fetch(url);
    return await res.text();
}
const THREAD_COUNT = !IS_FIREFOX && self.crossOriginIsolated ? Math.min(Math.max(1, navigator.hardwareConcurrency - 2), 8) : 1;
const SUPPORTS_GROWTH = !!WebAssembly.Memory.prototype.toResizableBuffer;
// HACK: 3 memory hacks to support here:
// 1. Chrome WASM Growable memory which can use a reference to the buffer to fix visual artifacts, which happen both with multithreading or without [fastest]
// 2. Chrome WASM non-growable, but mult-threaded only memory which needs to re-create the HEAPU8 on growth because of race conditions [medium]
// 3. Firefox non-growable memory which needs a copy of the data into a non-resizable buffer and can't use a reference [fastest single threaded, but only on Firefox, on Chrome this is slowest]
// Additionally safari is inconsistent with this, sometimes it works with sharedarraybuffers, and sometimes it doesn't, probably some version compat diffs?
const SHOULD_REFERENCE_MEMORY = !IS_FIREFOX && !IS_SAFARI && (SUPPORTS_GROWTH || THREAD_COUNT > 1);
const IDENTITY_MATRIX = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
]);
// Color matrix conversion map - mat3x3 for WebGL2
// Each matrix converts FROM the key color space TO the nested key color space
const colorMatrixConversionMap = {
    BT601: {
        BT709: new Float32Array([
            1.0863, 0.0965, -0.01411,
            -0.0723, 0.8451, -0.0277,
            -0.0141, 0.0584, 1.0418
        ]),
        BT601: IDENTITY_MATRIX
    },
    BT709: {
        BT601: new Float32Array([
            0.9137, 0.0784, 0.0079,
            -0.1049, 1.1722, -0.0671,
            0.0096, 0.0322, 0.9582
        ]),
        BT709: IDENTITY_MATRIX
    },
    FCC: {
        BT709: new Float32Array([
            1.0873, -0.0736, -0.0137,
            0.0974, 0.8494, 0.0531,
            -0.0127, -0.0251, 1.0378
        ]),
        BT601: new Float32Array([
            1.001, -0.0008, -0.0002,
            0.0009, 1.005, -0.006,
            0.0013, 0.0027, 0.996
        ])
    },
    SMPTE240M: {
        BT709: new Float32Array([
            0.9993, 0.0006, 0.0001,
            -0.0004, 0.9812, 0.0192,
            -0.0034, -0.0114, 1.0148
        ]),
        BT601: new Float32Array([
            0.913, 0.0774, 0.0096,
            -0.1051, 1.1508, -0.0456,
            0.0063, 0.0207, 0.973
        ])
    }
};
//# sourceMappingURL=util.js.map
;// ./node_modules/jassub/dist/worker/renderers/webgl1-renderer.js

// GLSL ES 1.0 Vertex Shader with Instancing (using extension)
const VERTEX_SHADER = /* glsl */ `
precision mediump float;

// Quad position attribute (0,0), (1,0), (0,1), (1,0), (1,1), (0,1)
attribute vec2 a_quadPos;

uniform vec2 u_resolution;

// Instance attributes
attribute vec4 a_destRect;  // x, y, w, h
attribute vec4 a_color;     // r, g, b, a
attribute float a_texLayer;

varying vec2 v_destXY;
varying vec4 v_color;
varying vec2 v_texSize;
varying float v_texLayer;
varying vec2 v_texCoord;
varying vec2 v_normalizedImageSize;

uniform vec2 u_texDimensions;

void main() {
  vec2 pixelPos = a_destRect.xy + a_quadPos * a_destRect.zw;
  vec2 clipPos = (pixelPos / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;

  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_destXY = a_destRect.xy;
  v_color = a_color;
  v_texSize = a_destRect.zw;
  v_texLayer = a_texLayer;
  v_texCoord = a_quadPos;
  v_normalizedImageSize = a_destRect.zw / u_texDimensions;
}
`;
// GLSL ES 1.0 Fragment Shader
// WebGL1 doesn't support texture arrays or texelFetch, so we use individual textures
const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform sampler2D u_tex;
uniform mat3 u_colorMatrix;
uniform vec2 u_resolution;

varying vec2 v_destXY;
varying vec4 v_color;
varying vec2 v_texSize;
varying float v_texLayer;
varying vec2 v_texCoord;
varying vec2 v_normalizedImageSize;

void main() {
  // Sample texture (r channel contains mask)
  float mask = texture2D(u_tex, v_texCoord * v_normalizedImageSize).r;

  // Apply color matrix conversion (identity if no conversion needed)
  vec3 correctedColor = u_colorMatrix * v_color.rgb;

  // libass color alpha: 0 = opaque, 255 = transparent (inverted)
  float colorAlpha = 1.0 - v_color.a;

  // Final alpha = colorAlpha * mask
  float a = colorAlpha * mask;

  // Premultiplied alpha output
  gl_FragColor = vec4(correctedColor * a, a);
}
`;
// Configuration
const MAX_INSTANCES = 256; // Maximum instances per draw call
class WebGL1Renderer {
    canvas = null;
    gl = null;
    program = null;
    // Extensions
    instancedArraysExt = null;
    // Uniform locations
    u_resolution = null;
    u_tex = null;
    u_colorMatrix = null;
    u_texDimensions = null;
    // Attribute locations
    a_quadPos = -1;
    a_destRect = -1;
    a_color = -1;
    a_texLayer = -1;
    // Quad vertex buffer (shared for all instances)
    quadPosBuffer = null;
    // Instance attribute buffers
    instanceDestRectBuffer = null;
    instanceColorBuffer = null;
    instanceTexLayerBuffer = null;
    // Instance data arrays
    instanceDestRectData;
    instanceColorData;
    instanceTexLayerData;
    // Texture cache (since WebGL1 doesn't support texture arrays)
    textureCache = new Map();
    textureWidth = 0;
    textureHeight = 0;
    colorMatrix = IDENTITY_MATRIX;
    constructor() {
        this.instanceDestRectData = new Float32Array(MAX_INSTANCES * 4);
        this.instanceColorData = new Float32Array(MAX_INSTANCES * 4);
        this.instanceTexLayerData = new Float32Array(MAX_INSTANCES);
    }
    _scheduledResize;
    resizeCanvas(width, height) {
        // WebGL doesn't allow 0-sized canvases
        if (!width || !height)
            return;
        if (this.canvas?.width === width && this.canvas?.height === height)
            return;
        this._scheduledResize = { width, height };
    }
    setCanvas(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            preserveDrawingBuffer: false,
            stencil: false,
            desynchronized: true,
            powerPreference: 'high-performance'
        });
        if (!this.gl) {
            throw new Error('Could not get WebGL context');
        }
        // Get instanced arrays extension (required for instancing in WebGL1)
        this.instancedArraysExt = this.gl.getExtension('ANGLE_instanced_arrays');
        if (!this.instancedArraysExt) {
            throw new Error('ANGLE_instanced_arrays extension not supported');
        }
        // Create shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to create shaders');
        }
        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(this.program);
            throw new Error('Failed to link program: ' + info);
        }
        // Get uniform locations
        this.u_resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.u_tex = this.gl.getUniformLocation(this.program, 'u_tex');
        this.u_colorMatrix = this.gl.getUniformLocation(this.program, 'u_colorMatrix');
        this.u_texDimensions = this.gl.getUniformLocation(this.program, 'u_texDimensions');
        // Get attribute locations
        this.a_quadPos = this.gl.getAttribLocation(this.program, 'a_quadPos');
        this.a_destRect = this.gl.getAttribLocation(this.program, 'a_destRect');
        this.a_color = this.gl.getAttribLocation(this.program, 'a_color');
        this.a_texLayer = this.gl.getAttribLocation(this.program, 'a_texLayer');
        // Create quad position buffer (6 vertices for 2 triangles)
        this.quadPosBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadPosBuffer);
        const quadPositions = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, quadPositions, this.gl.STATIC_DRAW);
        // Create instance attribute buffers
        this.instanceDestRectBuffer = this.gl.createBuffer();
        this.instanceColorBuffer = this.gl.createBuffer();
        this.instanceTexLayerBuffer = this.gl.createBuffer();
        // Set up vertex attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadPosBuffer);
        this.gl.enableVertexAttribArray(this.a_quadPos);
        this.gl.vertexAttribPointer(this.a_quadPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceDestRectBuffer);
        this.gl.enableVertexAttribArray(this.a_destRect);
        this.gl.vertexAttribPointer(this.a_destRect, 4, this.gl.FLOAT, false, 0, 0);
        this.instancedArraysExt.vertexAttribDivisorANGLE(this.a_destRect, 1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceColorBuffer);
        this.gl.enableVertexAttribArray(this.a_color);
        this.gl.vertexAttribPointer(this.a_color, 4, this.gl.FLOAT, false, 0, 0);
        this.instancedArraysExt.vertexAttribDivisorANGLE(this.a_color, 1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceTexLayerBuffer);
        this.gl.enableVertexAttribArray(this.a_texLayer);
        this.gl.vertexAttribPointer(this.a_texLayer, 1, this.gl.FLOAT, false, 0, 0);
        this.instancedArraysExt.vertexAttribDivisorANGLE(this.a_texLayer, 1);
        // Set up blending for premultiplied alpha
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        // Use the program
        this.gl.useProgram(this.program);
        // Set texture unit
        this.gl.uniform1i(this.u_tex, 0);
        // Set initial color matrix
        this.gl.uniformMatrix3fv(this.u_colorMatrix, false, this.colorMatrix);
        // Set one-time GL state
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.activeTexture(this.gl.TEXTURE0);
    }
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            console.log(info);
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    // Set the color matrix for color space conversion.
    // Pass null or undefined to use identity (no conversion).
    setColorMatrix(subtitleColorSpace, videoColorSpace) {
        this.colorMatrix = (subtitleColorSpace && videoColorSpace && colorMatrixConversionMap[subtitleColorSpace]?.[videoColorSpace]) ?? IDENTITY_MATRIX;
        if (this.gl && this.u_colorMatrix && this.program) {
            this.gl.useProgram(this.program);
            this.gl.uniformMatrix3fv(this.u_colorMatrix, false, this.colorMatrix);
        }
    }
    createTexture(width, height) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        // Allocate storage for texture (WebGL1 uses LUMINANCE instead of R8)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, width, height, 0, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, null);
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        return texture;
    }
    render(images, heap) {
        if (!this.gl || !this.program || !this.instancedArraysExt)
            return;
        // we scheduled a resize because changing the canvas size clears it, and we don't want it to flicker
        // so we do it here, right before rendering
        if (this._scheduledResize) {
            const { width, height } = this._scheduledResize;
            this._scheduledResize = undefined;
            this.canvas.width = width;
            this.canvas.height = height;
            // Update viewport and resolution uniform
            this.gl.viewport(0, 0, width, height);
            this.gl.uniform2f(this.u_resolution, width, height);
        }
        else {
            // Clear canvas
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
        // Find max dimensions needed and filter valid images
        let maxW = this.textureWidth;
        let maxH = this.textureHeight;
        const validImages = [];
        for (const img of images) {
            if (img.w <= 0 || img.h <= 0)
                continue;
            validImages.push(img);
            if (img.w > maxW)
                maxW = img.w;
            if (img.h > maxH)
                maxH = img.h;
        }
        if (validImages.length === 0)
            return;
        // Update texture dimensions if needed
        if (maxW > this.textureWidth || maxH > this.textureHeight) {
            this.textureWidth = maxW;
            this.textureHeight = maxH;
            // Clear texture cache as we need to recreate textures
            for (const texture of this.textureCache.values()) {
                this.gl.deleteTexture(texture);
            }
            this.textureCache.clear();
        }
        // Process images individually (WebGL1 limitation: no texture arrays)
        // We'll render them one by one instead of in batches
        for (let i = 0; i < validImages.length; i++) {
            const img = validImages[i];
            // Get or create texture for this image
            let texture = this.textureCache.get(i);
            if (!texture) {
                texture = this.createTexture(this.textureWidth, this.textureHeight);
                this.textureCache.set(i, texture);
            }
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            // Upload bitmap data to texture
            // WebGL1 doesn't support UNPACK_ROW_LENGTH, so we need to handle strided data manually
            // Strided data - need to copy row by row to remove padding
            const sourceView = new Uint8Array(heap.buffer, img.bitmap, img.stride * img.h);
            const tightData = new Uint8Array(img.w * img.h);
            for (let y = 0; y < img.h; y++) {
                const srcOffset = y * img.stride;
                const dstOffset = y * img.w;
                tightData.set(sourceView.subarray(srcOffset, srcOffset + img.w), dstOffset);
            }
            this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, // x, y offset
            img.w, img.h, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, tightData);
            // Fill instance data (single instance)
            this.instanceDestRectData[0] = img.dst_x;
            this.instanceDestRectData[1] = img.dst_y;
            this.instanceDestRectData[2] = img.w;
            this.instanceDestRectData[3] = img.h;
            this.instanceColorData[0] = ((img.color >>> 24) & 0xFF) / 255;
            this.instanceColorData[1] = ((img.color >>> 16) & 0xFF) / 255;
            this.instanceColorData[2] = ((img.color >>> 8) & 0xFF) / 255;
            this.instanceColorData[3] = (img.color & 0xFF) / 255;
            this.instanceTexLayerData[0] = 0; // Not used in WebGL1 version
            // Upload instance data to buffers
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceDestRectBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.instanceDestRectData.subarray(0, 4), this.gl.DYNAMIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceColorBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.instanceColorData.subarray(0, 4), this.gl.DYNAMIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceTexLayerBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.instanceTexLayerData.subarray(0, 1), this.gl.DYNAMIC_DRAW);
            // Set texture dimensions uniform
            this.gl.uniform2f(this.u_texDimensions, this.textureWidth, this.textureHeight);
            // Single instanced draw call
            this.instancedArraysExt.drawArraysInstancedANGLE(this.gl.TRIANGLES, 0, 6, 1);
        }
    }
    destroy() {
        if (this.gl) {
            // Delete all cached textures
            for (const texture of this.textureCache.values()) {
                this.gl.deleteTexture(texture);
            }
            this.textureCache.clear();
            if (this.quadPosBuffer) {
                this.gl.deleteBuffer(this.quadPosBuffer);
                this.quadPosBuffer = null;
            }
            if (this.instanceDestRectBuffer) {
                this.gl.deleteBuffer(this.instanceDestRectBuffer);
                this.instanceDestRectBuffer = null;
            }
            if (this.instanceColorBuffer) {
                this.gl.deleteBuffer(this.instanceColorBuffer);
                this.instanceColorBuffer = null;
            }
            if (this.instanceTexLayerBuffer) {
                this.gl.deleteBuffer(this.instanceTexLayerBuffer);
                this.instanceTexLayerBuffer = null;
            }
            if (this.program) {
                this.gl.deleteProgram(this.program);
                this.program = null;
            }
            this.gl = null;
        }
    }
}
//# sourceMappingURL=webgl1-renderer.js.map
;// ./node_modules/jassub/dist/worker/renderers/webgl2-renderer.js
// fallback for browsers that don't support WebGL2

// GLSL ES 3.0 Vertex Shader with Instancing
const webgl2_renderer_VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

const vec2 QUAD_POSITIONS[6] = vec2[6](
  vec2(0.0, 0.0),
  vec2(1.0, 0.0),
  vec2(0.0, 1.0),
  vec2(1.0, 0.0),
  vec2(1.0, 1.0),
  vec2(0.0, 1.0)
);

uniform vec2 u_resolution;

// Instance attributes
in vec4 a_destRect;  // x, y, w, h
in vec4 a_color;     // r, g, b, a
in float a_texLayer;

flat out vec2 v_destXY;
flat out vec4 v_color;
flat out vec2 v_texSize;
flat out float v_texLayer;

void main() {
  vec2 quadPos = QUAD_POSITIONS[gl_VertexID];
  vec2 pixelPos = a_destRect.xy + quadPos * a_destRect.zw;
  vec2 clipPos = (pixelPos / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;

  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_destXY = a_destRect.xy;
  v_color = a_color;
  v_texSize = a_destRect.zw;
  v_texLayer = a_texLayer;
}
`;
// GLSL ES 3.0 Fragment Shader - use texelFetch for pixel-perfect sampling
const webgl2_renderer_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray u_texArray;
uniform mat3 u_colorMatrix;
uniform vec2 u_resolution;

flat in vec2 v_destXY;
flat in vec4 v_color;
flat in vec2 v_texSize;
flat in float v_texLayer;

out vec4 fragColor;

void main() {
  // Flip Y: WebGL's gl_FragCoord.y is 0 at bottom, but destXY.y is from top
  vec2 fragPos = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

  // Calculate local position within the quad (screen coords)
  vec2 localPos = fragPos - v_destXY;

  // Convert to integer texel coordinates for texelFetch
  ivec2 texCoord = ivec2(floor(localPos));

  // Bounds check (prevents out-of-bounds access)
  ivec2 texSizeI = ivec2(v_texSize);
  if (texCoord.x < 0 || texCoord.y < 0 || texCoord.x >= texSizeI.x || texCoord.y >= texSizeI.y) {
    discard;
  }

  // texelFetch: integer coords, no interpolation, no precision issues
  float mask = texelFetch(u_texArray, ivec3(texCoord, int(v_texLayer)), 0).r;

  // Apply color matrix conversion (identity if no conversion needed)
  vec3 correctedColor = u_colorMatrix * v_color.rgb;

  // libass color alpha: 0 = opaque, 255 = transparent (inverted)
  float colorAlpha = 1.0 - v_color.a;

  // Final alpha = colorAlpha * mask
  float a = colorAlpha * mask;

  // Premultiplied alpha output
  fragColor = vec4(correctedColor * a, a);
}
`;
// Texture array configuration
const TEX_ARRAY_SIZE = 64; // Fixed layer count
const TEX_INITIAL_SIZE = 256; // Initial width/height
const webgl2_renderer_MAX_INSTANCES = 256; // Maximum instances per draw call
class WebGL2Renderer {
    canvas = null;
    gl = null;
    program = null;
    vao = null;
    // Uniform locations
    u_resolution = null;
    u_texArray = null;
    u_colorMatrix = null;
    // Instance attribute buffers
    instanceDestRectBuffer = null;
    instanceColorBuffer = null;
    instanceTexLayerBuffer = null;
    // Instance data arrays
    instanceDestRectData;
    instanceColorData;
    instanceTexLayerData;
    texArray = null;
    texArrayWidth = 0;
    texArrayHeight = 0;
    colorMatrix = IDENTITY_MATRIX;
    constructor() {
        this.instanceDestRectData = new Float32Array(webgl2_renderer_MAX_INSTANCES * 4);
        this.instanceColorData = new Float32Array(webgl2_renderer_MAX_INSTANCES * 4);
        this.instanceTexLayerData = new Float32Array(webgl2_renderer_MAX_INSTANCES);
    }
    _scheduledResize;
    resizeCanvas(width, height) {
        // WebGL2 doesn't allow 0-sized canvases
        if (!width || !height)
            return;
        if (this.canvas?.width === width && this.canvas?.height === height)
            return;
        this._scheduledResize = { width, height };
    }
    setCanvas(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            preserveDrawingBuffer: false,
            stencil: false,
            desynchronized: true,
            powerPreference: 'high-performance'
        });
        if (!this.gl) {
            throw new Error('Could not get WebGL2 context');
        }
        // Create shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, webgl2_renderer_VERTEX_SHADER);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, webgl2_renderer_FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to create shaders');
        }
        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(this.program);
            throw new Error('Failed to link program: ' + info);
        }
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        // Get uniform locations
        this.u_resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.u_texArray = this.gl.getUniformLocation(this.program, 'u_texArray');
        this.u_colorMatrix = this.gl.getUniformLocation(this.program, 'u_colorMatrix');
        // Create instance attribute buffers
        this.instanceDestRectBuffer = this.gl.createBuffer();
        this.instanceColorBuffer = this.gl.createBuffer();
        this.instanceTexLayerBuffer = this.gl.createBuffer();
        // Create a VAO (required for WebGL2)
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);
        // Setup instance attributes
        const destRectLoc = this.gl.getAttribLocation(this.program, 'a_destRect');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceDestRectBuffer);
        this.gl.enableVertexAttribArray(destRectLoc);
        this.gl.vertexAttribPointer(destRectLoc, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.vertexAttribDivisor(destRectLoc, 1);
        const colorLoc = this.gl.getAttribLocation(this.program, 'a_color');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceColorBuffer);
        this.gl.enableVertexAttribArray(colorLoc);
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.vertexAttribDivisor(colorLoc, 1);
        const texLayerLoc = this.gl.getAttribLocation(this.program, 'a_texLayer');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceTexLayerBuffer);
        this.gl.enableVertexAttribArray(texLayerLoc);
        this.gl.vertexAttribPointer(texLayerLoc, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.vertexAttribDivisor(texLayerLoc, 1);
        // Set up blending for premultiplied alpha
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        // Use the program
        this.gl.useProgram(this.program);
        // Set texture unit
        this.gl.uniform1i(this.u_texArray, 0);
        // Set initial color matrix
        this.gl.uniformMatrix3fv(this.u_colorMatrix, false, this.colorMatrix);
        // Set one-time GL state
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.activeTexture(this.gl.TEXTURE0);
        // Create initial texture array
        this.createTexArray(TEX_INITIAL_SIZE, TEX_INITIAL_SIZE);
    }
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            console.log(info);
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    // Set the color matrix for color space conversion.
    // Pass null or undefined to use identity (no conversion).
    setColorMatrix(subtitleColorSpace, videoColorSpace) {
        this.colorMatrix = (subtitleColorSpace && videoColorSpace && colorMatrixConversionMap[subtitleColorSpace]?.[videoColorSpace]) ?? IDENTITY_MATRIX;
        if (this.gl && this.u_colorMatrix && this.program) {
            this.gl.useProgram(this.program);
            this.gl.uniformMatrix3fv(this.u_colorMatrix, false, this.colorMatrix);
        }
    }
    createTexArray(width, height) {
        if (this.texArray) {
            this.gl.deleteTexture(this.texArray);
        }
        this.texArray = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.texArray);
        // Allocate storage for texture array
        this.gl.texImage3D(this.gl.TEXTURE_2D_ARRAY, 0, this.gl.R8, width, height, TEX_ARRAY_SIZE, 0, this.gl.RED, this.gl.UNSIGNED_BYTE, null // Firefox cries about uninitialized data, but is slower with zero initialized data...
        );
        // Set texture parameters (no filtering needed for texelFetch, but set anyway)
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.texArrayWidth = width;
        this.texArrayHeight = height;
    }
    render(images, heap) {
        if (!this.gl || !this.program || !this.vao || !this.texArray)
            return;
        // HACK 1 and 2 [see above for explanation]
        if ((self.HEAPU8RAW.buffer !== self.WASMMEMORY.buffer) || SHOULD_REFERENCE_MEMORY) {
            heap = self.HEAPU8RAW = new Uint8Array(self.WASMMEMORY.buffer);
        }
        // we scheduled a resize because changing the canvas size clears it, and we don't want it to flicker
        // so we do it here, right before rendering
        if (this._scheduledResize) {
            const { width, height } = this._scheduledResize;
            this._scheduledResize = undefined;
            this.canvas.width = width;
            this.canvas.height = height;
            // Update viewport and resolution uniform
            this.gl.viewport(0, 0, width, height);
            this.gl.uniform2f(this.u_resolution, width, height);
        }
        else {
            // Clear canvas
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
        // Find max dimensions needed and filter valid images
        let maxW = this.texArrayWidth;
        let maxH = this.texArrayHeight;
        const validImages = [];
        for (const img of images) {
            if (img.w <= 0 || img.h <= 0)
                continue;
            validImages.push(img);
            if (img.w > maxW)
                maxW = img.w;
            if (img.h > maxH)
                maxH = img.h;
        }
        if (validImages.length === 0)
            return;
        // Resize texture array if needed
        if (maxW > this.texArrayWidth || maxH > this.texArrayHeight) {
            this.createTexArray(maxW, maxH);
        }
        // Process images in chunks that fit within texture array size
        const batchSize = Math.min(TEX_ARRAY_SIZE, webgl2_renderer_MAX_INSTANCES);
        for (let batchStart = 0; batchStart < validImages.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, validImages.length);
            let instanceCount = 0;
            // Upload textures for this batch
            for (let i = batchStart; i < batchEnd; i++) {
                const img = validImages[i];
                const layer = instanceCount;
                // Upload bitmap data to texture array layer
                this.gl.pixelStorei(this.gl.UNPACK_ROW_LENGTH, img.stride);
                if (IS_FIREFOX || IS_SAFARI) {
                    // HACK 3 [see util.ts for explanation]
                    const sourceView = new Uint8Array(heap.buffer, img.bitmap, img.stride * img.h);
                    const bitmapData = new Uint8Array(sourceView);
                    this.gl.texSubImage3D(this.gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, // x, y, z offset
                    img.w, img.h, 1, // depth (1 layer)
                    this.gl.RED, this.gl.UNSIGNED_BYTE, bitmapData);
                }
                else {
                    this.gl.texSubImage3D(this.gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, // x, y, z offset
                    img.w, img.h, 1, // depth (1 layer)
                    this.gl.RED, this.gl.UNSIGNED_BYTE, heap, img.bitmap);
                }
                // Fill instance data
                const idx = instanceCount * 4;
                this.instanceDestRectData[idx] = img.dst_x;
                this.instanceDestRectData[idx + 1] = img.dst_y;
                this.instanceDestRectData[idx + 2] = img.w;
                this.instanceDestRectData[idx + 3] = img.h;
                this.instanceColorData[idx] = ((img.color >>> 24) & 0xFF) / 255;
                this.instanceColorData[idx + 1] = ((img.color >>> 16) & 0xFF) / 255;
                this.instanceColorData[idx + 2] = ((img.color >>> 8) & 0xFF) / 255;
                this.instanceColorData[idx + 3] = (img.color & 0xFF) / 255;
                this.instanceTexLayerData[instanceCount] = layer;
                instanceCount++;
            }
            this.gl.pixelStorei(this.gl.UNPACK_ROW_LENGTH, 0);
            if (instanceCount === 0)
                continue;
            // Upload instance data to buffers
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceDestRectBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.instanceDestRectData.subarray(0, instanceCount * 4), this.gl.DYNAMIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceColorBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.instanceColorData.subarray(0, instanceCount * 4), this.gl.DYNAMIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceTexLayerBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.instanceTexLayerData.subarray(0, instanceCount), this.gl.DYNAMIC_DRAW);
            // Single instanced draw call
            this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, instanceCount);
        }
    }
    destroy() {
        if (this.gl) {
            if (this.texArray) {
                this.gl.deleteTexture(this.texArray);
                this.texArray = null;
            }
            if (this.instanceDestRectBuffer) {
                this.gl.deleteBuffer(this.instanceDestRectBuffer);
                this.instanceDestRectBuffer = null;
            }
            if (this.instanceColorBuffer) {
                this.gl.deleteBuffer(this.instanceColorBuffer);
                this.instanceColorBuffer = null;
            }
            if (this.instanceTexLayerBuffer) {
                this.gl.deleteBuffer(this.instanceTexLayerBuffer);
                this.instanceTexLayerBuffer = null;
            }
            if (this.vao) {
                this.gl.deleteVertexArray(this.vao);
                this.vao = null;
            }
            if (this.program) {
                this.gl.deleteProgram(this.program);
                this.program = null;
            }
            this.gl = null;
        }
    }
}
//# sourceMappingURL=webgl2-renderer.js.map
;// ./node_modules/jassub/dist/worker/worker.js
/* eslint-disable camelcase */








const worker_constructor = Symbol.for('constructor');
class ASSRenderer {
    _wasm;
    _subtitleColorSpace;
    _videoColorSpace;
    _malloc;
    _gpurender;
    debug = false;
    constructor(...args) {
        return this[worker_constructor](...args);
    }
    async [worker_constructor](data, getFont, ctrl) {
        // remove case sensitivity
        this._availableFonts = Object.fromEntries(Object.entries(data.availableFonts).map(([k, v]) => [k.trim().toLowerCase(), v]));
        this.debug = data.debug;
        this.queryFonts = data.queryFonts;
        this._getFont = getFont;
        this._defaultFont = data.defaultFont.trim().toLowerCase();
        // hack, we want custom WASM URLs
        const _fetch = globalThis.fetch;
        globalThis.fetch = _ => _fetch(data.wasmUrl);
        // const devicePromise = navigator.gpu?.requestAdapter({
        //   powerPreference: 'high-performance'
        // }).then(adapter => adapter?.requestDevice())
        try {
            const testCanvas = new OffscreenCanvas(1, 1);
            if (testCanvas.getContext('webgl2')) {
                this._gpurender = new WebGL2Renderer();
            }
            else {
                this._gpurender = testCanvas.getContext('webgl')?.getExtension('ANGLE_instanced_arrays') ? new WebGL1Renderer() : new Canvas2DRenderer();
            }
        }
        catch {
            this._gpurender = new Canvas2DRenderer();
        }
        this._gpurender.setCanvas(ctrl);
        this._loadedInitialFonts = !data.fonts.length;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { _malloc, JASSUB } = await (0,jassub_worker/* default */.A)({ __url: data.wasmUrl, __out: (log) => this._log(log) });
        this._malloc = _malloc;
        this._wasm = new JASSUB(data.width, data.height, this._defaultFont);
        // Firefox seems to have issues with multithreading in workers
        // a worker inside a worker does not recieve messages properly
        this._wasm.setThreads(THREAD_COUNT);
        if (!this._loadedInitialFonts)
            await this._loadInitialFonts(data.fonts);
        this._wasm.createTrackMem(data.subContent ?? await fetchtext(data.subUrl));
        this._subtitleColorSpace = LIBASS_YCBCR_MAP[this._wasm.trackColorSpace];
        if (data.libassMemoryLimit > 0 || data.libassGlyphLimit > 0) {
            this._wasm.setMemoryLimits(data.libassGlyphLimit || 0, data.libassMemoryLimit || 0);
        }
        this._checkColorSpace();
        return this;
    }
    // this passes a string of track data to libass, be it styles, events etc, which it then processes and adds to the track
    // useful for streaming subtitles
    processData(events) {
        this._wasm.processData(events);
    }
    createEvent(event) {
        this._wasm.createEvent(event);
    }
    getEvents() {
        return this._wasm.getEvents();
    }
    setEvent(event, index) {
        this._wasm.setEvent(index, event);
    }
    removeEvent(index) {
        this._wasm.removeEvent(index);
    }
    createStyle(style) {
        this._wasm.createStyle(style);
    }
    getStyles() {
        return this._wasm.getStyles();
    }
    setStyle(style, index) {
        this._wasm.setStyle(index, style);
    }
    removeStyle(index) {
        this._wasm.removeStyle(index);
    }
    styleOverride(style) {
        this._wasm.styleOverride(style);
    }
    disableStyleOverride() {
        this._wasm.disableStyleOverride();
    }
    setTrack(content) {
        this._wasm.createTrackMem(content);
        this._subtitleColorSpace = LIBASS_YCBCR_MAP[this._wasm.trackColorSpace];
    }
    freeTrack() {
        this._wasm.removeTrack();
    }
    async setTrackByUrl(url) {
        this.setTrack(await fetchtext(url));
    }
    _checkColorSpace() {
        if (!this._subtitleColorSpace || !this._videoColorSpace)
            return;
        this._gpurender.setColorMatrix(this._subtitleColorSpace, this._videoColorSpace);
    }
    _defaultFont;
    setDefaultFont(fontName) {
        this._defaultFont = fontName.trim().toLowerCase();
        this._wasm.setDefaultFont(this._defaultFont);
    }
    async _log(log) {
        console.debug(log);
        const match = log.match(/JASSUB: fontselect:[^(]+: \(([^,]+), (\d{1,4}), \d\)/);
        if (match && !await this._findAvailableFont(match[1].trim().toLowerCase(), util_WEIGHT_MAP[Math.ceil(parseInt(match[2]) / 100) - 1])) {
            await this._findAvailableFont(this._defaultFont);
        }
    }
    async addFonts(fontOrURLs) {
        if (!fontOrURLs.length)
            return false;
        const strings = [];
        const uint8s = [];
        for (const fontOrURL of fontOrURLs) {
            if (typeof fontOrURL === 'string') {
                strings.push(fontOrURL);
            }
            else {
                uint8s.push(fontOrURL);
            }
        }
        if (uint8s.length)
            this._allocFonts(uint8s);
        // this isn't batched like uint8s because software like jellyfin exists, which loads 50+ fonts over the network which takes time...
        // is connection exhaustion a concern here?
        return !!await Promise.allSettled(strings.map(url => this._asyncWrite(url)));
    }
    // we don't want to run _findAvailableFont before initial fonts are loaded
    // because it could duplicate fonts
    _loadedInitialFonts = false;
    async _loadInitialFonts(fontOrURLs) {
        await this.addFonts(fontOrURLs);
        this._loadedInitialFonts = true;
        this._wasm.reloadFonts();
    }
    _getFont;
    _availableFonts = {};
    _checkedFonts = new Set();
    async _findAvailableFont(fontName, weight) {
        if (!this._loadedInitialFonts)
            return;
        // Roboto Medium, null -> Roboto, Medium
        // Roboto Medium, Medium -> Roboto, Medium
        // Roboto, null -> Roboto, Regular
        // italic is not handled I guess
        for (const _weight of util_WEIGHT_MAP) {
            // check if fontname has this weight name in it, if yes remove it
            if (fontName.includes(_weight)) {
                fontName = fontName.replace(_weight, '').trim();
                weight ??= _weight;
                break;
            }
        }
        weight ??= 'regular';
        const key = fontName + ' ' + weight;
        if (this._checkedFonts.has(key))
            return;
        this._checkedFonts.add(key);
        try {
            const font = this._availableFonts[key] ?? this._availableFonts[fontName] ?? await this._queryLocalFont(fontName, weight) ?? await this._queryRemoteFont([key, fontName]);
            if (font)
                return await this.addFonts([font]);
        }
        catch (e) {
            console.warn('Error querying font', fontName, weight, e);
        }
    }
    queryFonts;
    async _queryLocalFont(fontName, weight) {
        if (!this.queryFonts)
            return;
        return await this._getFont(fontName, weight);
    }
    async _queryRemoteFont(postscriptNames) {
        if (this.queryFonts !== 'localandremote')
            return;
        const fontData = await queryRemoteFonts({ postscriptNames });
        if (!fontData.length)
            return;
        const blob = await fontData[0].blob();
        return new Uint8Array(await blob.arrayBuffer());
    }
    async _asyncWrite(font) {
        const res = await _fetch(font);
        this._allocFonts([new Uint8Array(await res.arrayBuffer())]);
    }
    _fontId = 0;
    _allocFonts(uint8s) {
        // TODO: this should re-draw last frame!
        for (const uint8 of uint8s) {
            const ptr = this._malloc(uint8.byteLength);
            self.HEAPU8RAW.set(uint8, ptr);
            this._wasm.addFont('font-' + (this._fontId++), ptr, uint8.byteLength);
        }
        this._wasm.reloadFonts();
    }
    _resizeCanvas(width, height, videoWidth, videoHeight) {
        this._wasm.resizeCanvas(width, height, videoWidth, videoHeight);
        this._gpurender.resizeCanvas(width, height);
    }
    async [finalizer]() {
        this._wasm.quitLibrary();
        this._gpurender.destroy();
        // @ts-expect-error force GC
        this._wasm = null;
        // @ts-expect-error force GC
        this._gpurender = null;
        this._availableFonts = {};
    }
    _draw(time, repaint = false) {
        const images = this._wasm.rawRender(time, Number(repaint));
        if (!images)
            return;
        this._gpurender.render(images, self.HEAPU8RAW);
    }
    _setColorSpace(videoColorSpace) {
        if (videoColorSpace === 'RGB')
            return;
        this._videoColorSpace = videoColorSpace;
        this._checkColorSpace();
    }
}
if (self.name === 'jassub-worker') {
    w3c_expose(ASSRenderer);
}
//# sourceMappingURL=worker.js.map
var __webpack_exports__ASSRenderer = __webpack_exports__.z;
export { __webpack_exports__ASSRenderer as ASSRenderer };

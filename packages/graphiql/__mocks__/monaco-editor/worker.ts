window.URL.createObjectURL = function () {
  return '';
};
if (typeof Worker === 'undefined') {
  global.Worker = class {
    addEventListener() {}

    removeEventListener() {}

    dispatchEvent() {
      return false;
    }

    onmessage() {}

    onmessageerror() {}

    onerror() {}

    postMessage() {}

    terminate() {}
  };
}

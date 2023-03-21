function CodeMirror(node: HTMLElement, { value, ...options }) {
  let _eventListeners = {};
  const mockWrapper = document.createElement('div');
  const mockGutter = document.createElement('div');
  mockGutter.className = 'CodeMirror-gutter';
  const mockTextArea = document.createElement('textarea');
  mockTextArea.className = 'mockCodeMirror';
  mockTextArea.addEventListener('change', e => {
    _emit('change', e);
  });
  mockTextArea.value = value;
  mockWrapper.append(mockGutter, mockTextArea);
  node.append(mockWrapper);

  function _emit(event, data) {
    if (_eventListeners[event]) {
      _eventListeners[event](data);
    }
  }

  return {
    options: {
      ...options,
    },

    on(event, handler) {
      _eventListeners[event] = handler;
    },

    off(event) {
      if (Object.prototype.hasOwnProperty.call(_eventListeners, event)) {
        const updatedEventListeners = {};
        for (const e in _eventListeners) {
          if (e !== event) {
            updatedEventListeners[e] = _eventListeners[e];
          }
        }
        _eventListeners = updatedEventListeners;
      }
    },

    getValue() {
      return mockTextArea.value;
    },

    setValue(newValue) {
      mockTextArea.value = newValue;
    },

    setSize() {},

    emit: _emit,
  };
}

CodeMirror.defineExtension = () => {};
CodeMirror.registerHelper = () => {};
CodeMirror.defineOption = () => {};
CodeMirror.signal = (mockCodeMirror, event, ...args) => {
  mockCodeMirror.emit(event, ...args);
};

module.exports = CodeMirror;

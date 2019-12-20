export function MockCodeMirror(node, { value, ...options }) {
  let _eventListeners = {};
  const mockTextArea = document.createElement('textarea');
  mockTextArea.className = 'mockCodeMirror';
  mockTextArea.addEventListener('change', e => {
    _emit('change', e);
  });
  mockTextArea.value = value;
  node.appendChild(mockTextArea);

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
      if (_eventListeners.hasOwnProperty(event)) {
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

MockCodeMirror.defineExtension = () => {};
MockCodeMirror.registerHelper = () => {};
MockCodeMirror.defineOption = () => {};
MockCodeMirror.signal = (mockCodeMirror, event, ...args) => {
  mockCodeMirror.emit(event, ...args);
};

export const codeMirrorModules = [
  'codemirror/addon/hint/show-hint',
  'codemirror/addon/comment/comment',
  'codemirror/addon/edit/matchbrackets',
  'codemirror/addon/edit/closebrackets',
  'codemirror/addon/fold/foldgutter',
  'codemirror/addon/fold/brace-fold',
  'codemirror/addon/search/search',
  'codemirror/addon/search/searchcursor',
  'codemirror/addon/search/jump-to-line',
  'codemirror/addon/dialog/dialog',
  'codemirror/addon/lint/lint',
  'codemirror/keymap/sublime',
  'codemirror-graphql/hint',
  'codemirror-graphql/lint',
  'codemirror-graphql/info',
  'codemirror-graphql/jump',
  'codemirror-graphql/mode',
  'codemirror-graphql/results/mode',
  'codemirror-graphql/variables/hint',
  'codemirror-graphql/variables/lint',
  'codemirror-graphql/variables/mode',
];

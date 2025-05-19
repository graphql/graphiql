Range.prototype.getBoundingClientRect = () => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
});

// this isn't pretty but it gets us past an error (TypeError: Cannot read properties of undefined (reading 'top')) in "monaco-editor/esm/vs/editor/browser/view/domLineBreaksComputer.js"
Range.prototype.getClientRects = () => [
  // @ts-ignore
  {
    top: 0,
  },
];

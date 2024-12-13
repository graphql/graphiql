import '@testing-library/jest-dom';

// @ts-expect-error
document.createRange = function () {
  return {
    setEnd() {},
    setStart() {},
    getClientRects() {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    },
    getBoundingClientRect() {
      return { right: 0 };
    },
  };
};

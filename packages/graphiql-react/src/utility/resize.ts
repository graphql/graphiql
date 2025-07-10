import { useEffect, useRef, useState } from 'react';
import { useStorage } from '../stores';
import { debounce } from './debounce';

type ResizableElement = 'first' | 'second';

interface UseDragResizeArgs {
  /**
   * Set the default sizes for the two resizable halves by passing their ratio
   * (first divided by second).
   * @default 1
   */
  defaultSizeRelation?: number;
  /**
   * The direction in which the two halves should be resizable.
   */
  direction: 'horizontal' | 'vertical';
  /**
   * Choose one of the two halves that should initially be hidden.
   */
  initiallyHidden?: ResizableElement;

  /**
   * Invoked when the visibility of one of the halves changes.
   * @param hiddenElement - The element that is now hidden after the change
   * (`null` if both are visible).
   */
  onHiddenElementChange?(hiddenElement: ResizableElement | null): void;

  /**
   * The minimum width in pixels for the first half. If it is resized to a
   * width smaller than this threshold, the half will be hidden.
   * @default 100
   */
  sizeThresholdFirst?: number;
  /**
   * The minimum width in pixels for the second half. If it is resized to a
   * width smaller than this threshold, the half will be hidden.
   * @default 100
   */
  sizeThresholdSecond?: number;
  /**
   * A key for which the state of resizing is persisted in storage (if storage
   * is available).
   */
  storageKey?: string;
}

export function useDragResize({
  defaultSizeRelation = 1,
  direction,
  initiallyHidden,
  onHiddenElementChange,
  sizeThresholdFirst = 100,
  sizeThresholdSecond = 100,
  storageKey,
}: UseDragResizeArgs) {
  const storage = useStorage();

  const [hiddenElement, setHiddenElement] = useState<ResizableElement | null>(
    () => {
      const storedValue = storageKey && storage.get(storageKey);
      if (storedValue === HIDE_FIRST || initiallyHidden === 'first') {
        return 'first';
      }
      if (storedValue === HIDE_SECOND || initiallyHidden === 'second') {
        return 'second';
      }
      return null;
    },
  );

  const firstRef = useRef<HTMLDivElement>(null);
  const dragBarRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  const defaultFlexRef = useRef(`${defaultSizeRelation}`);

  /**
   * Set initial flex values
   */
  useEffect(() => {
    const storedValue =
      (storageKey && storage.get(storageKey)) || defaultFlexRef.current;

    if (firstRef.current) {
      firstRef.current.style.flex =
        storedValue === HIDE_FIRST || storedValue === HIDE_SECOND
          ? defaultFlexRef.current
          : storedValue;
    }

    if (secondRef.current) {
      secondRef.current.style.flex = '1';
    }
  }, [direction, storage, storageKey]);

  /**
   * Hide and show items when the state changes
   */
  useEffect(() => {
    function hide(element: HTMLDivElement) {
      element.style.left = '-1000px';
      element.style.position = 'absolute';
      element.style.opacity = '0';

      // Make sure that the flex value of the first item is at least equal to one
      // so that the entire space of the parent element is filled up
      if (!firstRef.current) {
        return;
      }
      const flex = parseFloat(firstRef.current.style.flex);
      if (!Number.isFinite(flex) || flex < 1) {
        firstRef.current.style.flex = '1';
      }
    }

    function show(element: HTMLDivElement) {
      element.style.left = '';
      element.style.position = '';
      element.style.opacity = '';

      if (!storageKey) {
        return;
      }
      const storedValue = storage.get(storageKey);
      if (
        firstRef.current &&
        storedValue !== HIDE_FIRST &&
        storedValue !== HIDE_SECOND
      ) {
        firstRef.current.style.flex = storedValue || defaultFlexRef.current;
      }
    }

    for (const id of ['first', 'second'] as const) {
      const element = (id === 'first' ? firstRef : secondRef).current;
      if (element) {
        if (id === hiddenElement) {
          hide(element);
        } else {
          show(element);
        }
      }
    }
  }, [hiddenElement, storage, storageKey]);

  useEffect(() => {
    if (!dragBarRef.current || !firstRef.current || !secondRef.current) {
      return;
    }
    const store = debounce(500, (value: string) => {
      if (storageKey) {
        storage.set(storageKey, value);
      }
    });

    function setHiddenElementWithCallback(element: ResizableElement | null) {
      setHiddenElement(prevHiddenElement => {
        if (element === prevHiddenElement) {
          return prevHiddenElement;
        }
        onHiddenElementChange?.(element);
        return element;
      });
    }

    const dragBarContainer = dragBarRef.current;
    const firstContainer = firstRef.current;
    const wrapper = firstContainer.parentElement!;
    const isHorizontal = direction === 'horizontal';
    const eventProperty = isHorizontal ? 'clientX' : 'clientY';
    const rectProperty = isHorizontal ? 'left' : 'top';
    const adjacentRectProperty = isHorizontal ? 'right' : 'bottom';
    const sizeProperty = isHorizontal ? 'clientWidth' : 'clientHeight';

    function handleMouseDown(downEvent: MouseEvent) {
      const isClickOnCurrentElement =
        downEvent.target === downEvent.currentTarget;
      if (!isClickOnCurrentElement) {
        return;
      }

      downEvent.preventDefault();

      // Distance between the start of the drag bar and the exact point where
      // the user clicked on the drag bar.
      const offset =
        downEvent[eventProperty] -
        dragBarContainer.getBoundingClientRect()[rectProperty];

      function handleMouseMove(moveEvent: MouseEvent) {
        if (moveEvent.buttons === 0) {
          return handleMouseUp();
        }
        const domRect = wrapper.getBoundingClientRect();
        const firstSize =
          moveEvent[eventProperty] - domRect[rectProperty] - offset;
        const secondSize =
          domRect[adjacentRectProperty] -
          moveEvent[eventProperty] +
          offset -
          dragBarContainer[sizeProperty];

        if (firstSize < sizeThresholdFirst) {
          // Hide the first display
          setHiddenElementWithCallback('first');
          store(HIDE_FIRST);
        } else if (secondSize < sizeThresholdSecond) {
          // Hide the second display
          setHiddenElementWithCallback('second');
          store(HIDE_SECOND);
        } else {
          // Show both and adjust the flex value of the first one (the flex
          // value for the second one is always `1`)
          setHiddenElementWithCallback(null);
          const newFlex = `${firstSize / secondSize}`;
          firstContainer.style.flex = newFlex;
          store(newFlex);
        }
      }

      function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    dragBarContainer.addEventListener('mousedown', handleMouseDown);

    function reset() {
      if (firstRef.current) {
        firstRef.current.style.flex = defaultFlexRef.current;
      }
      store(defaultFlexRef.current);
      setHiddenElementWithCallback(null);
    }

    dragBarContainer.addEventListener('dblclick', reset);

    return () => {
      dragBarContainer.removeEventListener('mousedown', handleMouseDown);
      dragBarContainer.removeEventListener('dblclick', reset);
    };
  }, [
    direction,
    onHiddenElementChange,
    sizeThresholdFirst,
    sizeThresholdSecond,
    storage,
    storageKey,
  ]);

  return {
    dragBarRef,
    hiddenElement,
    firstRef,
    setHiddenElement,
    secondRef,
  };
}

const HIDE_FIRST = 'hide-first';
const HIDE_SECOND = 'hide-second';

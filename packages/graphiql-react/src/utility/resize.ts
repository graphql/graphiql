import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useStorageContext } from '../storage';
import debounce from './debounce';

type ResizableElement = 'first' | 'second';

type UseDragResizeArgs = {
  /**
   * Set the default sizes for the two resizable halves by passing their ratio
   * (first divided by second).
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
   * @param hiddenElement The element that is now hidden after the change
   * (`null` if both are visible).
   */
  onHiddenElementChange?(hiddenElement: ResizableElement | null): void;
  /**
   * The minimum width in pixels for the first half. If it is resized to a
   * width smaller than this threshold, the half will be hidden.
   */
  sizeThresholdFirst?: number;
  /**
   * The minimum width in pixels for the second half. If it is resized to a
   * width smaller than this threshold, the half will be hidden.
   */
  sizeThresholdSecond?: number;
  /**
   * A key for which the state of resizing is persisted in storage (if storage
   * is available).
   */
  storageKey?: string;
};

export function useDragResize({
  defaultSizeRelation = DEFAULT_FLEX,
  direction,
  initiallyHidden,
  onHiddenElementChange,
  sizeThresholdFirst = 100,
  sizeThresholdSecond = 100,
  storageKey,
}: UseDragResizeArgs) {
  const storage = useStorageContext();

  const store = useMemo(
    () =>
      debounce(500, (value: string) => {
        if (storageKey) {
          storage?.set(storageKey, value);
        }
      }),
    [storage, storageKey],
  );

  const [hiddenElement, setHiddenElement] = useState<ResizableElement | null>(
    () => {
      const storedValue = storageKey && storage?.get(storageKey);
      if (storedValue === HIDE_FIRST || initiallyHidden === 'first') {
        return 'first';
      }
      if (storedValue === HIDE_SECOND || initiallyHidden === 'second') {
        return 'second';
      }
      return null;
    },
  );

  const setHiddenElementWithCallback = useCallback(
    (element: ResizableElement | null) => {
      if (element !== hiddenElement) {
        setHiddenElement(element);
        onHiddenElementChange?.(element);
      }
    },
    [hiddenElement, onHiddenElementChange],
  );

  const firstRef = useRef<HTMLDivElement>(null);
  const dragBarRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  const defaultFlexRef = useRef(`${defaultSizeRelation}`);

  /**
   * Set initial flex values
   */
  useLayoutEffect(() => {
    const storedValue =
      (storageKey && storage?.get(storageKey)) || defaultFlexRef.current;

    if (firstRef.current) {
      firstRef.current.style.display = 'flex';
      firstRef.current.style.flex =
        storedValue === HIDE_FIRST || storedValue === HIDE_SECOND
          ? defaultFlexRef.current
          : storedValue;
    }

    if (secondRef.current) {
      secondRef.current.style.display = 'flex';
      secondRef.current.style.flex = '1';
    }

    if (dragBarRef.current) {
      dragBarRef.current.style.display = 'flex';
    }
  }, [direction, storage, storageKey]);

  const hide = useCallback((resizableElement: ResizableElement) => {
    const element =
      resizableElement === 'first' ? firstRef.current : secondRef.current;
    if (!element) {
      return;
    }

    // We hide elements off screen because of codemirror. If the page is loaded
    // and the codemirror container would have zero width, the layout isn't
    // instant pretty. By always giving the editor some width we avoid any
    // layout shifts when the editor reappears.
    element.style.left = '-1000px';
    element.style.position = 'absolute';
    element.style.opacity = '0';
    element.style.height = '500px';
    element.style.width = '500px';

    // Make sure that the flex value of the first item is at least equal to one
    // so that the entire space of the parent element is filled up
    if (firstRef.current) {
      const flex = parseFloat(firstRef.current.style.flex);
      if (!Number.isFinite(flex) || flex < 1) {
        firstRef.current.style.flex = '1';
      }
    }
  }, []);

  const show = useCallback(
    (resizableElement: ResizableElement) => {
      const element =
        resizableElement === 'first' ? firstRef.current : secondRef.current;
      if (!element) {
        return;
      }

      element.style.width = '';
      element.style.height = '';
      element.style.opacity = '';
      element.style.position = '';
      element.style.left = '';

      if (storage && storageKey) {
        const storedValue = storage.get(storageKey);
        if (
          firstRef.current &&
          storedValue !== HIDE_FIRST &&
          storedValue !== HIDE_SECOND
        ) {
          firstRef.current.style.flex = storedValue || defaultFlexRef.current;
        }
      }
    },
    [storage, storageKey],
  );

  /**
   * Hide and show items when state changes
   */
  useLayoutEffect(() => {
    if (hiddenElement === 'first') {
      hide('first');
    } else {
      show('first');
    }
    if (hiddenElement === 'second') {
      hide('second');
    } else {
      show('second');
    }
  }, [hiddenElement, hide, show]);

  useEffect(() => {
    if (!dragBarRef.current || !firstRef.current || !secondRef.current) {
      return;
    }
    const dragBarContainer = dragBarRef.current;
    const firstContainer = firstRef.current;
    const wrapper = firstContainer.parentElement!;

    const eventProperty = direction === 'horizontal' ? 'clientX' : 'clientY';
    const rectProperty = direction === 'horizontal' ? 'left' : 'top';
    const adjacentRectProperty =
      direction === 'horizontal' ? 'right' : 'bottom';
    const sizeProperty =
      direction === 'horizontal' ? 'clientWidth' : 'clientHeight';

    function handleMouseDown(downEvent: MouseEvent) {
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

        const firstSize =
          moveEvent[eventProperty] -
          wrapper.getBoundingClientRect()[rectProperty] -
          offset;
        const secondSize =
          wrapper.getBoundingClientRect()[adjacentRectProperty] -
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
    setHiddenElementWithCallback,
    sizeThresholdFirst,
    sizeThresholdSecond,
    store,
  ]);

  return useMemo(
    () => ({
      dragBarRef,
      hiddenElement,
      firstRef,
      setHiddenElement,
      secondRef,
    }),
    [hiddenElement, setHiddenElement],
  );
}

const DEFAULT_FLEX = 1;
const HIDE_FIRST = 'hide-first';
const HIDE_SECOND = 'hide-second';

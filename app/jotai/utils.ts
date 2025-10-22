/**
 * @fileoverview Jotai Utilities
 *
 * This file contains utility functions for Jotai atoms.
 */

import { atom } from "jotai";

/**
 * Debounce Result Type
 */
type DebounceResult<T> = {
  currentValueAtom: ReturnType<typeof atom<T>>;
  debouncedValueAtom: ReturnType<typeof atom<T, [T], void>>;
  isDebouncingAtom: ReturnType<typeof atom<boolean>>;
  clearTimeoutAtom: ReturnType<typeof atom<null, [null], void>>;
};

/**
 * atomWithDebounce
 *
 * Creates a set of atoms for debouncing a value.
 *
 * @param initialValue - The initial value
 * @param delayMs - The debounce delay in milliseconds
 * @param shouldDebounceOnReset - Whether to debounce when resetting to initial value
 * @returns An object with atoms for managing debounced state
 */
export default function atomWithDebounce<T>(
  initialValue: T,
  delayMs = 500,
  shouldDebounceOnReset = false
): DebounceResult<T> {
  const currentValueAtom = atom(initialValue);
  const isDebouncingAtom = atom(false);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  // Atom that manages the debounced value
  const debouncedValueAtom = atom(initialValue, (get, set, update: T) => {
    // Clear any existing timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Update current value immediately
    set(currentValueAtom, update);

    // Check if we should skip debouncing
    const shouldDebounce = shouldDebounceOnReset || update !== initialValue;

    if (!shouldDebounce) {
      set(debouncedValueAtom, update);
      set(isDebouncingAtom, false);
      return;
    }

    // Start debouncing
    set(isDebouncingAtom, true);

    // Set up new timeout
    timeoutId = setTimeout(() => {
      set(debouncedValueAtom, update);
      set(isDebouncingAtom, false);
      timeoutId = undefined;
    }, delayMs);
  });

  // Atom to clear the timeout manually
  const clearTimeoutAtom = atom(null, (get, set, _arg: null) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    set(isDebouncingAtom, false);
  });

  return {
    currentValueAtom,
    debouncedValueAtom,
    isDebouncingAtom,
    clearTimeoutAtom,
  };
}

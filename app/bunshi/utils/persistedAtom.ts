import {
  type ReadableAtom,
  type WritableAtom,
  atom,
  effect,
  onMount,
} from "nanostores";
import { debounce } from "es-toolkit";

/**
 * Options for creating a persisted atom
 */
export interface PersistedAtomOptions<T> {
  /** File path to persist to */
  filePath: string;
  /** Default value to use while loading or if file doesn't exist */
  defaultValue: T;
  /** Debounce time in milliseconds for auto-persist (default: 300ms) */
  debounceMs?: number;
}

/**
 * Return value from persistedAtom
 */
export interface PersistedAtomControls<T> {
  /** Store indicating if data is currently being fetched from disk */
  isLoading: WritableAtom<boolean>;
  /** Store indicating if data is currently being persisted to disk */
  isPersisting: WritableAtom<boolean>;
  /** Mutate the atom value and return a promise that resolves when persistence completes */
  mutate: (updater: T | ((current: T) => T)) => Promise<T>;
  /** Flush any pending persists immediately */
  flush: () => void;
}

/**
 * Stubbed disk API - will be replaced with actual file system API
 */
const stubDisk = {
  /**
   * Read data from a file
   */
  async read<T>(filePath: string): Promise<T | null> {
    // TODO: Replace with actual file system API call
    console.debug(`[STUB] Reading from disk: "${filePath}"`);

    // Simulate disk I/O delay (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Return null to simulate no file found
    return null;
  },

  /**
   * Write data to a file
   */
  async write<T>(filePath: string, data: T): Promise<void> {
    // TODO: Replace with actual file system API call
    console.debug(`[STUB] Writing to disk: "${filePath}"`, data);

    // Simulate disk I/O delay (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));
  },
};

/**
 * Creates a persisted atom that fetches data from disk and provides
 * utilities for loading state and persisting changes.
 *
 * Data is automatically persisted whenever the store changes (with debouncing).
 * Use `mutate()` to update the atom and receive a promise that resolves when persistence completes.
 *
 * This is a stub implementation that simulates 2-second disk I/O operations.
 *
 * @example
 * ```ts
 * const [$settings, { isLoading, isPersisting, mutate }] = persistedAtom<Settings>({
 *   filePath: "/path/to/settings.json",
 *   defaultValue: { theme: "dark" },
 *   debounceMs: 500,
 * });
 *
 * // Use the store (read-only)
 * console.log($settings.get());
 *
 * // Check loading state
 * console.log(isLoading.get());
 *
 * // Update data (auto-persists with debounce) and wait for persistence
 * const persistedData = await mutate({ theme: "light" });
 * console.log('Persisted:', persistedData);
 *
 * // Or use an updater function
 * await mutate((current) => ({ ...current, theme: "light" }));
 * ```
 */
export function persistedAtom<T>(
  options: PersistedAtomOptions<T>
): [ReadableAtom<T>, PersistedAtomControls<T>] {
  const { filePath, defaultValue, debounceMs = 300 } = options;

  // Create the data store with default value
  const $data = atom<T>(defaultValue);

  // Create loading state stores with unique identifiers for debugging
  const $isLoading = atom<boolean>(false);
  const $isPersisting = atom<boolean>(false);

  // Debug logging
  console.debug(`[persistedAtom] Created atoms for: ${filePath}`);

  // Track pending persist promises as tuples of [resolve, reject]
  const pendingPersistResolvers: Set<
    [(data: T) => void, (error: any) => void]
  > = new Set();

  // Track if we're in initial load to skip auto-persist
  const $isInitialLoad = atom<boolean>(true);

  onMount($data, () => {
    // Initialize by fetching data from disk if requested
    $isLoading.set(true);

    stubDisk
      .read<T>(filePath)
      .then((result) => {
        if (result !== null) {
          $data.set(result);
        }
      })
      .catch((error) => {
        console.error(`Error fetching from disk "${filePath}":`, error);
      })
      .finally(() => {
        $isLoading.set(false);
        $isInitialLoad.set(false);
      });
  });

  // Function to persist data
  const persist = debounce(async (data: T): Promise<void> => {
    $isPersisting.set(true);

    try {
      // Simulate disk failure for data with "fail" in certain fields
      // Disk operations are more prone to failures than database operations
      if (typeof data === "object" && data !== null) {
        const dataValues = Object.values(data);
        if (
          dataValues.some(
            (value: any) =>
              typeof value === "string" && value.toLowerCase().includes("fail")
          )
        ) {
          throw new Error("Disk write failed - simulated disk error");
        }
      }

      await stubDisk.write(filePath, data);
      // Resolve all pending persist promises
      pendingPersistResolvers.forEach(([resolve]) => {
        try {
          resolve(data);
        } catch (error) {
          console.error("Error in persist resolver:", error);
        }
      });
    } catch (error) {
      pendingPersistResolvers.forEach(([_, reject]) => {
        reject(error);
      });
      console.error(`Error persisting to disk "${filePath}":`, error);
    } finally {
      // Clear the resolvers set
      pendingPersistResolvers.clear();
      $isPersisting.set(false);
    }
  }, debounceMs);

  // Effect to persist data when it changes
  effect([$data, $isInitialLoad], (data, isInitialLoad) => {
    if (isInitialLoad) {
      return;
    }

    persist(data);
  });

  // Create mutate function that updates the atom and returns persistence promise
  const mutate = (updater: T | ((current: T) => T)): Promise<T> => {
    // Apply the update
    const newValue =
      typeof updater === "function"
        ? (updater as (current: T) => T)($data.get())
        : updater;

    $data.set(newValue);

    // Return a promise that resolves when persistence completes
    return new Promise((resolve, reject) => {
      pendingPersistResolvers.add([resolve, reject]);
    });
  };

  return [
    $data as ReadableAtom<T>,
    {
      isLoading: $isLoading,
      isPersisting: $isPersisting,
      mutate,
      flush: () => persist.flush(),
    },
  ];
}

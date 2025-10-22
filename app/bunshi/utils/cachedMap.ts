import {
  type PreinitializedMapStore,
  type WritableAtom,
  atom,
  map,
} from "nanostores";
import { debounce } from "es-toolkit";

/**
 * Options for creating a cached map
 */
export interface CachedMapOptions<T> {
  /** Database table name */
  table: string;
  /** Keys to fetch from the database */
  keys: string[];
  /** Default value to use while loading or if keys are empty */
  defaultValue: T;
  /** Debounce time in milliseconds for auto-persist (default: 300ms) */
  debounceMs?: number;
}

/**
 * Return value from cachedMap
 */
export interface CachedMapControls<T> {
  /** Store indicating if data is currently being fetched from the database */
  isLoading: WritableAtom<boolean>;
  /** Store indicating if data is currently being persisted to the database */
  isPersisting: WritableAtom<boolean>;
  /** Returns a promise that resolves with the data when the next persistence completes */
  onPersist: () => Promise<T>;
  /** Flush any pending persists immediately */
  flush: () => void;
}

/**
 * Stubbed database API - will be replaced with injected SQLite API
 */
const stubDatabase = {
  /**
   * Fetch records from a table by keys
   */
  async fetch<T>(table: string, keys: string[]): Promise<T | null> {
    // TODO: Replace with actual SQLite API call
    console.debug(`[STUB] Fetching from table "${table}" with keys:`, keys);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return null to simulate no data found
    return null;
  },

  /**
   * Persist records to a table
   */
  async persist<T>(table: string, data: T): Promise<void> {
    // TODO: Replace with actual SQLite API call
    console.debug(`[STUB] Persisting to table "${table}" with keys:`, data);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
};

/**
 * Creates a cached map that fetches data from a database table and provides
 * utilities for loading state and persisting changes.
 *
 * Data is automatically persisted whenever the store changes (with debouncing).
 * Use `onPersist` to register callbacks that fire when persistence completes.
 *
 * This is a stub implementation that will eventually use an injected SQLite API.
 *
 * @example
 * ```ts
 * const [$metadata, { isLoading, onPersist }] = cachedMap<Record<string, DocumentMetadata>>({
 *   table: "document",
 *   keys: ["doc-123"],
 *   defaultValue: {},
 *   debounceMs: 500,
 * });
 *
 * // Use the store
 * console.log($metadata.get());
 *
 * // Check loading state
 * console.log(isLoading.get());
 *
 * // Update data (auto-persists with debounce)
 * $metadata.set({ "doc-123": { title: "New Title" } });
 *
 * // Wait for the next persistence to complete
 * const persistedData = await onPersist();
 * console.log('Persisted:', persistedData);
 * ```
 */
export function cachedMap<T extends Record<string, any>>(
  options: CachedMapOptions<T>
): [PreinitializedMapStore<T>, CachedMapControls<T>] {
  const { table, keys, defaultValue, debounceMs = 300 } = options;

  // Create the data store with default value
  const $data = map<T>(defaultValue);

  // Create loading state stores
  const $isLoading = atom<boolean>(false);
  const $isPersisting = atom<boolean>(false);

  // Track pending persist promises as tuples of [resolve, reject]
  const pendingPersistResolvers: Set<
    [(data: T) => void, (error: any) => void]
  > = new Set();

  // Track if we're in initial load to skip auto-persist
  let isInitialLoad = true;

  // Function to persist data
  const persist = debounce(async (data: T): Promise<void> => {
    $isPersisting.set(true);
    try {
      await stubDatabase.persist(table, data);
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
      console.error(`Error persisting to table "${table}":`, error);
    } finally {
      // Clear the resolvers set
      pendingPersistResolvers.clear();

      $isPersisting.set(false);
    }
  }, debounceMs);

  // Subscribe to data changes for auto-persist
  $data.subscribe((value) => {
    // Skip auto-persist during initial load
    if (isInitialLoad) {
      return;
    }

    persist(value);
  });

  // Initialize by fetching data if keys are provided
  if (keys.length > 0) {
    $isLoading.set(true);

    stubDatabase
      .fetch<T>(table, keys)
      .then((result) => {
        if (result !== null) {
          $data.set(result);
        }
      })
      .catch((error) => {
        console.error(`Error fetching from table "${table}":`, error);
      })
      .finally(() => {
        $isLoading.set(false);
        // Mark initial load as complete after a brief delay
        // to allow the initial set to complete
        setTimeout(() => {
          isInitialLoad = false;
        }, 0);
      });
  } else {
    // No initial fetch, mark as ready immediately
    setTimeout(() => {
      isInitialLoad = false;
    }, 0);
  }

  // Create function to wait for next persist
  const onPersist = (): Promise<T> => {
    return new Promise((resolve, reject) => {
      pendingPersistResolvers.add([resolve, reject]);
    });
  };

  return [
    $data,
    {
      isLoading: $isLoading,
      isPersisting: $isPersisting,
      onPersist,
      flush: () => persist.flush(),
    },
  ];
}

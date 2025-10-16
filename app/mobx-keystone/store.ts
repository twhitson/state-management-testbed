/**
 * @fileoverview MobX-Keystone Root Store
 *
 * This file sets up the root store that combines all domain stores
 * (documents and workspaces) into a single tree.
 *
 * Key concepts:
 * - Root store pattern for managing multiple domain stores
 * - registerRootStore to enable cross-store communication
 * - React context for providing the store to components
 */

import { createContext, useContext } from "react";
import { model, Model, prop, registerRootStore } from "mobx-keystone";
import { DocumentsStore } from "./documents.model";
import { WorkspacesStore } from "./workspaces.model";

/**
 * Root store model that combines all domain stores.
 *
 * @remarks
 * The root store is the single source of truth for your application state.
 * It combines multiple domain stores (documents, workspaces) into one tree.
 * By registering it with mobx-keystone, you can access it from any model
 * using getRootStore().
 */
@model("state-management-testbed/RootStore")
export class RootStore extends Model({
  documents: prop<DocumentsStore>(() => new DocumentsStore({})),
  workspaces: prop<WorkspacesStore>(() => new WorkspacesStore({})),
}) {}

/**
 * Creates and registers the root store instance.
 *
 * @remarks
 * This should be called once at application startup.
 * Registering the root store enables getRootStore() to work in child models.
 *
 * @returns The root store instance
 *
 * @example
 * ```ts
 * const rootStore = createRootStore();
 * ```
 */
export function createRootStore(): RootStore {
  const rootStore = new RootStore({});

  // Register the root store so child models can access it via getRootStore()
  registerRootStore(rootStore);

  return rootStore;
}

/**
 * React context for the root store.
 *
 * @remarks
 * This allows us to provide the store to the component tree and access it
 * with the useRootStore hook.
 */
const RootStoreContext = createContext<RootStore | null>(null);

/**
 * Provider component for the root store.
 *
 * @remarks
 * Wrap your app with this provider to make the store available to all components.
 *
 * @param props - Component props
 * @param props.store - The root store instance
 * @param props.children - Child components
 *
 * @example
 * ```tsx
 * <RootStoreProvider store={rootStore}>
 *   <App />
 * </RootStoreProvider>
 * ```
 */
export const RootStoreProvider = RootStoreContext.Provider;

/**
 * Hook to access the root store in components.
 *
 * @remarks
 * Use this hook in your React components to access the store.
 * Components will automatically re-render when observed data changes.
 *
 * @returns The root store instance
 * @throws If used outside of RootStoreProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const rootStore = useRootStore();
 *   const documents = rootStore.documents.getAllDocuments();
 *   // ...
 * }
 * ```
 */
export function useRootStore(): RootStore {
  const store = useContext(RootStoreContext);
  if (!store) {
    throw new Error("useRootStore must be used within RootStoreProvider");
  }
  return store;
}

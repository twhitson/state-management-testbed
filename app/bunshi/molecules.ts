/**
 * @fileoverview Bunshi Molecules with Encapsulated Nanostores
 *
 * This file defines Bunshi molecules where nanostores and their actions
 * are encapsulated together. Each molecule is a complete unit containing
 * both state (nanostores) and behavior (actions).
 *
 * Key architecture:
 * - Molecules contain nanostores internally
 * - Actions are methods within the molecule
 * - Each document scope has its own isolated molecule instances
 * - Perfect encapsulation and no external state leakage
 */

import { molecule, createScope } from "bunshi";
import { atom, map, computed } from "nanostores";

/**
 * Types
 */
export type Page = {
  id: string;
  title: string;
  content: string;
};

export type Document = {
  id: string;
  path: string;
  title: string;
  workspaceIds: string[];
};

export type Workspace = {
  id: string;
  name: string;
};

/**
 * Document Scope
 *
 * @remarks
 * Each document gets its own scope, providing complete isolation.
 * All molecules scoped to DocumentScope get their own instances per document.
 */
export const DocumentScope = createScope<{ documentId: string }>(undefined!);

/**
 * Page Scope
 *
 * @remarks
 * Each page gets its own scope, nested within a DocumentScope.
 * This provides isolation for individual pages within a document.
 */
export const PageScope = createScope<{ documentId: string; pageId: string }>(
  undefined!
);

/**
 * Document Molecule
 *
 * @remarks
 * This molecule encapsulates:
 * - Document state (nanostore atom)
 * - Document actions (rename, addToWorkspace, etc.)
 *
 * Each document scope gets its own instance with isolated state and actions.
 */
export const DocumentMolecule = molecule((mol, scope) => {
  const { documentId } = scope(DocumentScope);

  // Internal nanostore
  const store = atom<Document>({
    id: documentId,
    path: `C:/Users/trey/${documentId}`,
    title: "New Document",
    workspaceIds: [],
  });

  // Actions encapsulated with state
  return {
    // Expose the store for subscriptions
    store,

    // Get current document
    get: () => store.get(),

    // Rename document
    rename: (newTitle: string) => {
      const doc = store.get();
      store.set({
        ...doc,
        title: newTitle,
      });
    },

    // Add to workspace
    addToWorkspace: (workspaceId: string) => {
      const doc = store.get();
      if (!doc.workspaceIds.includes(workspaceId)) {
        store.set({
          ...doc,
          workspaceIds: [...doc.workspaceIds, workspaceId],
        });
      }
    },

    // Remove from workspace
    removeFromWorkspace: (workspaceId: string) => {
      const doc = store.get();
      store.set({
        ...doc,
        workspaceIds: doc.workspaceIds.filter((id) => id !== workspaceId),
      });
    },
  };
});

/**
 * Page Molecule
 *
 * @remarks
 * This molecule encapsulates:
 * - Page state (nanostore atom)
 * - Page actions (update title, content)
 *
 * Scoped to PageScope, so each page has its own molecule instance.
 */
export const PageMolecule = molecule((mol, scope) => {
  const { documentId } = scope(DocumentScope);
  const { pageId } = scope(PageScope);

  // Internal nanostore
  const store = atom<Page>({
    id: pageId,
    title: "New Page",
    content: "",
  });

  // Actions encapsulated with state
  return {
    // Expose the store for subscriptions
    store,

    // Get current page
    get: () => store.get(),

    // Update page title
    updateTitle: (newTitle: string) => {
      const page = store.get();
      store.set({
        ...page,
        title: newTitle,
      });
    },

    // Update page content
    updateContent: (newContent: string) => {
      const page = store.get();
      store.set({
        ...page,
        content: newContent,
      });
    },

    // Update page (generic)
    update: (updates: Partial<Page>) => {
      const page = store.get();
      store.set({
        ...page,
        ...updates,
      });
    },
  };
});

/**
 * Pages Registry Molecule
 *
 * @remarks
 * This molecule encapsulates:
 * - Page IDs registry (nanostore atom)
 * - Registry actions (create, delete, list)
 * - Computed page count
 *
 * Scoped to DocumentScope, so each document has its own page registry.
 */
export const PagesRegistryMolecule = molecule((mol, scope) => {
  const { documentId } = scope(DocumentScope);

  // Internal nanostores
  const registryStore = atom<string[]>([]);

  const countStore = computed(registryStore, (ids) => ids.length);

  // Helper for async operations
  async function createPageDirectory(
    documentPath: string,
    pageId: string
  ): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return `${documentPath}/${pageId}`;
  }

  async function writePageContents(
    path: string,
    content: string
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Actions encapsulated with state
  return {
    // Expose stores for subscriptions
    registryStore,
    countStore,

    // Get all page IDs
    getAll: () => registryStore.get(),

    // Get page count
    getCount: () => registryStore.get().length,

    // Create a new page
    create: async (documentPath: string): Promise<string> => {
      try {
        const pageId = crypto.randomUUID();

        // Add to registry
        const currentIds = registryStore.get();
        registryStore.set([...currentIds, pageId]);

        // Async operations
        const pagePath = await createPageDirectory(documentPath, pageId);
        await writePageContents(pagePath, "");

        console.log(`[Document ${documentId}] Created page ${pageId}`);

        return pageId;
      } catch (error) {
        console.error(`[Document ${documentId}] Failed to create page:`, error);
        throw error;
      }
    },

    // Delete page
    delete: (pageId: string) => {
      const currentIds = registryStore.get();
      registryStore.set(currentIds.filter((id) => id !== pageId));
    },

    // Load sample pages
    loadSamples: () => {
      const sampleIds = ["page-1", "page-2", "page-3"];
      registryStore.set(sampleIds);
    },
  };
});

/**
 * Workspaces Molecule (Global)
 *
 * @remarks
 * This molecule encapsulates:
 * - Workspaces state (nanostore map)
 * - Workspace actions (fetch, create, etc.)
 *
 * NOT scoped, so it's a singleton shared across all documents.
 */
export const WorkspacesMolecule = molecule(() => {
  // Internal nanostore
  const workspaces = map<Record<string, Workspace>>({});
  const workspaceIds = computed(workspaces, (workspaces) =>
    Object.keys(workspaces)
  );
  const workspaceArray = computed(workspaces, (workspaces) =>
    Object.values(workspaces)
  );

  // Actions encapsulated with state
  return {
    // Expose store for subscriptions
    workspaces,
    workspaceIds,
    workspaceArray,

    // Get all workspaces
    getAll: () => workspaces.get(),

    // Get specific workspace
    get: (workspaceId: string) => workspaces.get()[workspaceId],

    // Fetch workspaces from database
    fetch: async (): Promise<Workspace[]> => {
      console.log("Fetching workspaces from database");

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulated database response
      const workspaces: Workspace[] = [
        { id: "workspace-1", name: "Personal Projects" },
        { id: "workspace-2", name: "Work Documents" },
        { id: "workspace-3", name: "Research" },
      ];

      // Update store
      const newWorkspaces: Record<string, Workspace> = {};
      workspaces.forEach((ws) => {
        newWorkspaces[ws.id] = ws;
      });

      workspaces.set({
        ...workspaces.get(),
        ...newWorkspaces,
      });

      return workspaces;
    },

    // Create workspace
    create: (name: string): Workspace => {
      const workspace: Workspace = {
        id: crypto.randomUUID(),
        name,
      };

      workspaces.setKey(workspace.id, workspace);
      return workspace;
    },
  };
});

/**
 * Documents Registry Molecule (Global)
 *
 * @remarks
 * This molecule encapsulates:
 * - Document IDs registry (nanostore atom)
 * - Registry actions (create, delete, list)
 * - Computed document count
 *
 * Global singleton that tracks all document IDs.
 */
export const DocumentsRegistryMolecule = molecule(() => {
  // Internal nanostores
  const registryStore = map<Record<string, string[]>>({});

  const documentIdsStore = computed(registryStore, (documents) =>
    Object.keys(documents)
  );

  const countStore = computed(
    registryStore,
    (documents) => Object.keys(documents).length
  );

  // Actions encapsulated with state
  return {
    // Expose stores for subscriptions
    registryStore,
    documentIdsStore,
    countStore,

    // Get all documents
    getAll: () => registryStore.get(),

    // Get all document IDs
    getIds: () => Object.keys(registryStore.get()),

    // Get document count
    getCount: () => Object.keys(registryStore.get()).length,

    // Create a new document
    create: async (): Promise<string> => {
      const documentId = crypto.randomUUID();

      // Add to registry
      registryStore.setKey(documentId, []);

      return documentId;
    },

    // Delete document
    delete: (documentId: string) => {
      registryStore.setKey(documentId, undefined);
    },

    // Load sample documents
    loadSamples: () => {
      const sampleDocumentIds = [
        "doc-sample-1",
        "doc-sample-2",
        "doc-sample-3",
      ];
      sampleDocumentIds.forEach((documentId) => {
        registryStore.setKey(documentId, []);
      });
    },
  };
});

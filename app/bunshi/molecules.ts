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

import { molecule, createScope, use } from "bunshi";
import { atom, map, computed } from "nanostores";
import { cachedMap } from "./utils/cachedMap";
import { persistedAtom } from "./utils/persistedAtom";

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

export type DocumentMetadata = {
  title: string;
  lastModified: string;
  createdAt: string;
  author: string;
  tags: string[];
  description: string;
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
 * - Document state (from database via cachedMap)
 * - Document metadata (stored to disk via persistedAtom)
 * - Document actions (rename, addToWorkspace, etc.)
 * - Metadata actions (update tags, description, etc.)
 *
 * Each document scope gets its own instance with isolated state and actions.
 */
export const DocumentMolecule = molecule((mol, scope) => {
  const documentsRegistry = use(DocumentsRegistryMolecule);
  const { documentId } = scope(DocumentScope);

  console.debug(
    `[DocumentMolecule] Creating/accessing molecule for document: ${documentId}`
  );

  const $document = computed(
    documentsRegistry.registryStore,
    (documents) => documents[documentId]
  );

  // Create persisted atom for metadata stored to disk
  const [
    $metadata,
    {
      isLoading: isMetadataLoading,
      isPersisting: isMetadataPersisting,
      mutate: mutateMetadata,
    },
  ] = persistedAtom<DocumentMetadata>({
    filePath: `${$document.get()?.path || `/tmp/${documentId}`}/metadata.json`,
    defaultValue: {
      title: $document.get().title,
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      author: "Unknown",
      tags: [],
      description: "",
    },
    debounceMs: 500,
  });

  // Actions encapsulated with state
  return {
    // Expose the stores for subscriptions
    document: $document,
    metadata: $metadata,

    isMetadataLoading,
    isMetadataPersisting,

    // Rename document
    rename: async (newTitle: string) => {
      const currentTitle = $document.get().title;

      const updateResult = documentsRegistry.update(documentId, {
        title: newTitle,
      });

      const metadataResult = mutateMetadata((current) => ({
        ...current,
        title: newTitle,
      }));

      const results = await Promise.allSettled([updateResult, metadataResult]);

      if (results.some((result) => result.status === "rejected")) {
        // Rollback the change
        void documentsRegistry.update(documentId, {
          title: currentTitle,
        });

        console.error(
          `[Document ${documentId}]`,
          "Failed to rename document, rolling back",
          results
        );
      }
    },

    // Add to workspace
    addToWorkspace: (workspaceId: string) => {
      const doc = $document.get();
      if (!doc.workspaceIds.includes(workspaceId)) {
        documentsRegistry.update(documentId, {
          workspaceIds: [...doc.workspaceIds, workspaceId],
        });
      }
    },

    // Remove from workspace
    removeFromWorkspace: (workspaceId: string) => {
      const doc = $document.get();
      documentsRegistry.update(documentId, {
        workspaceIds: doc.workspaceIds.filter((id) => id !== workspaceId),
      });
    },

    // Metadata actions

    // Update description
    updateDescription: async (description: string) => {
      return mutateMetadata((current) => ({
        ...current,
        description,
        lastModified: new Date().toISOString(),
      }));
    },

    // Add tag
    addTag: async (tag: string) => {
      const current = $metadata.get();
      if (!current.tags.includes(tag)) {
        return mutateMetadata((current) => ({
          ...current,
          tags: [...current.tags, tag],
          lastModified: new Date().toISOString(),
        }));
      }
    },

    // Remove tag
    removeTag: async (tag: string) => {
      return mutateMetadata((current) => ({
        ...current,
        tags: current.tags.filter((t) => t !== tag),
        lastModified: new Date().toISOString(),
      }));
    },

    // Update author
    updateAuthor: async (author: string) => {
      return mutateMetadata((current) => ({
        ...current,
        author,
        lastModified: new Date().toISOString(),
      }));
    },

    // Update metadata (generic)
    updateMetadata: async (updates: Partial<DocumentMetadata>) => {
      return mutateMetadata((current) => ({
        ...current,
        ...updates,
        lastModified: new Date().toISOString(),
      }));
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
  const $page = atom<Page>({
    id: pageId,
    title: "New Page",
    content: "",
  });

  // Actions encapsulated with state
  return {
    // Expose the store for subscriptions
    page: $page,

    // Get current page
    get: () => $page.get(),

    // Update page title
    updateTitle: (newTitle: string) => {
      const page = $page.get();
      $page.set({
        ...page,
        title: newTitle,
      });
    },

    // Update page content
    updateContent: (newContent: string) => {
      const page = $page.get();
      $page.set({
        ...page,
        content: newContent,
      });
    },

    // Update page (generic)
    update: (updates: Partial<Page>) => {
      const page = $page.get();
      $page.set({
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
  const workspaces = map<Record<string, Workspace>>();

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
    fetch: async () => {
      console.log("Fetching workspaces from database");

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulated database response
      const testWorkspaces: Workspace[] = [
        { id: "workspace-1", name: "Personal Projects" },
        { id: "workspace-2", name: "Work Documents" },
        { id: "workspace-3", name: "Research" },
      ];

      // Update store
      const newWorkspaces: Record<string, Workspace> = {};
      testWorkspaces.forEach((ws) => {
        newWorkspaces[ws.id] = ws;
      });

      workspaces.set(newWorkspaces);
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
  const [registryStore, { onPersist, flush }] = cachedMap<
    Record<string, Document>
  >({
    table: "documents",
    keys: ["id"],
    defaultValue: {},
  });

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

    update: (documentId: string, updates: Partial<Document>) => {
      registryStore.setKey(documentId, {
        ...registryStore.get()[documentId],
        ...updates,
      });

      return onPersist();
    },

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
      registryStore.setKey(documentId, {
        id: documentId,
        path: `C:/Users/trey/${documentId}`,
        title: "New Document",
        workspaceIds: [],
      });

      return documentId;
    },

    // Delete document
    delete: (documentId: string) => {
      registryStore.setKey(documentId, undefined);
    },

    // Load sample documents
    loadSamples: () => {
      registryStore.setKey("doc-sample-1", {
        id: "doc-sample-1",
        path: `C:/Users/trey/doc-sample-1`,
        title: "Personal Project Notes",
        workspaceIds: ["workspace-1"],
      });

      registryStore.setKey("doc-sample-2", {
        id: "doc-sample-2",
        path: `C:/Users/trey/doc-sample-2`,
        title: "Q4 Planning Document",
        workspaceIds: ["workspace-2"],
      });

      registryStore.setKey("doc-sample-3", {
        id: "doc-sample-3",
        path: `C:/Users/trey/doc-sample-3`,
        title: "Research Paper Draft",
        workspaceIds: ["workspace-3", "workspace-1"],
      });
    },
  };
});

/**
 * @fileoverview Zustand Workspaces Store
 *
 * This file demonstrates Zustand's ability to have multiple independent stores.
 * Unlike Redux which has a single store with multiple slices, Zustand encourages
 * creating separate stores for different domains.
 *
 * Key concepts:
 * - Separate store for workspaces domain
 * - Simple async action to fetch from database
 * - Cross-store communication (calling documents store from workspaces store)
 * - No need to combine stores - components can use multiple stores
 */

import { create } from "zustand";
import { useDocumentsStore } from "./documents.store";

type Document = {
  id: string;
  path: string;
  title: string;
  pages: any[];
  workspaceIds: string[];
};

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

type WorkspacesState = Record<string, Workspace>;

type WorkspacesStore = {
  workspaces: WorkspacesState;
  fetchWorkspaces: () => Promise<void>;
};

/**
 * Zustand store for managing workspaces.
 *
 * This is a separate store from documents, demonstrating Zustand's
 * support for multiple independent stores.
 *
 * @example
 * // In a component:
 * const workspaces = useWorkspacesStore((state) => state.workspaces);
 * const fetchWorkspaces = useWorkspacesStore((state) => state.fetchWorkspaces);
 */
export const useWorkspacesStore = create<WorkspacesStore>((set) => ({
  workspaces: {},

  /**
   * Fetches workspaces from the database.
   *
   * @remarks
   * Simulates a database query that returns a list of workspaces with their documents.
   * This demonstrates cross-store communication in Zustand - we call the documents
   * store's addDocument method to add the documents to the documents store.
   *
   * @returns Promise that resolves when fetch is complete
   *
   * @example
   * ```ts
   * const fetchWorkspaces = useWorkspacesStore((state) => state.fetchWorkspaces);
   * await fetchWorkspaces();
   * ```
   */
  fetchWorkspaces: async () => {
    try {
      console.log("Fetching workspaces from database");

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulated database response - workspaces with their documents
      const workspaces: Workspace[] = [
        {
          id: "workspace-1",
          name: "Personal Projects",
          documents: [
            {
              id: "doc-workspace-1-1",
              path: "C:/Users/trey/workspace-1/doc-1",
              title: "Personal Website",
              pages: [],
              workspaceIds: ["workspace-1"],
            },
            {
              id: "doc-workspace-1-2",
              path: "C:/Users/trey/workspace-1/doc-2",
              title: "Side Project Ideas",
              pages: [],
              workspaceIds: ["workspace-1"],
            },
          ],
        },
        {
          id: "workspace-2",
          name: "Work Documents",
          documents: [
            {
              id: "doc-workspace-2-1",
              path: "C:/Users/trey/workspace-2/doc-1",
              title: "Q4 Planning",
              pages: [],
              workspaceIds: ["workspace-2"],
            },
          ],
        },
        {
          id: "workspace-3",
          name: "Research",
          documents: [
            {
              id: "doc-workspace-3-1",
              path: "C:/Users/trey/workspace-3/doc-1",
              title: "State Management Comparison",
              pages: [],
              workspaceIds: ["workspace-3"],
            },
            {
              id: "doc-workspace-3-2",
              path: "C:/Users/trey/workspace-3/doc-2",
              title: "React Patterns",
              pages: [],
              workspaceIds: ["workspace-3"],
            },
          ],
        },
      ];

      // Add all documents from workspaces to the documents store
      // This demonstrates cross-store communication in Zustand
      workspaces.forEach((workspace) => {
        if (workspace.documents) {
          workspace.documents.forEach((document) => {
            useDocumentsStore.getState().addDocument(document);
          });
        }
      });

      // Convert array to Record<string, Workspace> and update state
      // Documents are already added to documents store, so we only store id and name
      const workspacesRecord: WorkspacesState = {};
      workspaces.forEach((workspace) => {
        workspacesRecord[workspace.id] = {
          id: workspace.id,
          name: workspace.name,
        };
      });

      set({ workspaces: workspacesRecord });

      console.log("Fetched workspaces", workspaces);
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  },
}));

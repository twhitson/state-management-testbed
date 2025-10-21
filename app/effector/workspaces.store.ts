/**
 * @fileoverview Effector Workspaces Store
 *
 * This file demonstrates fetching workspaces from a database and managing
 * workspace state with Effector's event-driven architecture.
 *
 * Key concepts demonstrated:
 * - Effects for data fetching (fetchWorkspacesFx)
 * - Cross-store updates (adding documents from workspace response)
 * - Automatic state updates with store.on()
 * - Type-safe event handling
 */

import { createEffect, createEvent, createStore } from "effector";
import { documentAdded, type Document } from "./documents.store";

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

export type WorkspacesState = Record<string, Workspace>;

/**
 * Events
 */

/**
 * Event: Request to fetch workspaces from the database
 *
 * @remarks
 * This is the entry point for fetching workspaces. When called, it triggers
 * the fetchWorkspacesFx effect.
 *
 * @example
 * ```ts
 * fetchWorkspacesRequested();
 * ```
 */
export const fetchWorkspacesRequested = createEvent("fetchWorkspacesRequested");

/**
 * Effects
 */

/**
 * Effect: Fetches workspaces from the database.
 *
 * @remarks
 * Simulates a database query that returns a list of workspaces with their documents.
 * In a real application, this would make an API call to fetch workspaces.
 *
 * Documents from the response are automatically added to the documents store via
 * the documentAdded event (cross-store communication).
 *
 * @returns Array of workspaces from the database
 *
 * @example
 * ```ts
 * const workspaces = await fetchWorkspacesFx();
 * ```
 */
export const fetchWorkspacesFx = createEffect<void, Workspace[]>(async () => {
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
          workspaces: [],
        },
        {
          id: "doc-workspace-1-2",
          path: "C:/Users/trey/workspace-1/doc-2",
          title: "Side Project Ideas",
          pages: [],
          workspaces: [],
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
          workspaces: [],
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
          workspaces: [],
        },
        {
          id: "doc-workspace-3-2",
          path: "C:/Users/trey/workspace-3/doc-2",
          title: "React Patterns",
          pages: [],
          workspaces: [],
        },
      ],
    },
  ];

  // Add all documents from workspaces to the documents store
  // and populate their workspace references
  workspaces.forEach((workspace) => {
    if (workspace.documents) {
      workspace.documents.forEach((document) => {
        // Add workspace reference to the document
        const docWithWorkspace = {
          ...document,
          workspaces: [{ id: workspace.id, name: workspace.name }],
        };
        documentAdded(docWithWorkspace);
      });
    }
  });

  return workspaces;
});

/**
 * Store: Workspaces state
 *
 * @remarks
 * This store holds all workspaces in a Record<string, Workspace> format
 * for easy lookup by ID.
 *
 * Workspaces are simple entities with just id and name.
 * The relationship to documents is maintained on the Document type
 * via the workspaces array (direct object references).
 *
 * Documents from workspace fetch responses are added to the documents store,
 * not stored in workspace state.
 *
 * @example
 * ```ts
 * // In a component:
 * const workspaces = useStore($workspaces);
 * ```
 */
export const $workspaces = createStore<WorkspacesState>({}).on(
  fetchWorkspacesFx.doneData,
  (state, workspaces) => {
    // Convert array to Record<string, Workspace> for easy lookup
    // Documents are already added to documents store, so we only store id and name
    const newState = { ...state };
    workspaces.forEach((workspace) => {
      newState[workspace.id] = {
        id: workspace.id,
        name: workspace.name,
      };
    });
    return newState;
  }
);

/**
 * Connecting events to effects
 *
 * When fetchWorkspacesRequested is called, it triggers fetchWorkspacesFx.
 */
fetchWorkspacesRequested.watch(() => {
  fetchWorkspacesFx();
});

/**
 * Error handling
 */
fetchWorkspacesFx.fail.watch(({ error }) => {
  console.error("Workspace fetch failed:", error);
  // In a production app, you might dispatch an event to show a notification
});

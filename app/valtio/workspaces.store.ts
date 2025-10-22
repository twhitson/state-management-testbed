/**
 * @fileoverview Valtio Workspaces Store
 *
 * This file demonstrates fetching workspaces from a database and managing
 * workspace state with Valtio's proxy-based reactive state.
 *
 * Key concepts demonstrated:
 * - proxyMap() for workspace collection
 * - Async actions as regular functions
 * - Cross-store updates (adding documents from workspace response)
 * - Direct mutation for state updates
 */

import { proxyMap } from "valtio/utils";
import { documentsState, type Document } from "./documents.store";

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

/**
 * Workspaces State: Using proxyMap for efficient workspace management
 *
 * @remarks
 * This proxyMap holds all workspaces with ID as the key.
 * Workspaces are simple entities with just id and name.
 * The relationship to documents is maintained on the Document type
 * via the workspaces array (direct object references).
 *
 * @example
 * ```tsx
 * // In a component:
 * const workspacesSnap = useSnapshot(workspacesState);
 * const workspaceIds = Array.from(workspacesSnap.keys());
 * const workspace = workspacesSnap.get(id);
 * ```
 */
export const workspacesState = proxyMap<string, Workspace>();

/**
 * Action: Fetch workspaces from the database
 *
 * @remarks
 * This is an async action that handles fetching workspaces from a database.
 * When called, it:
 * 1. Simulates a database query that returns workspaces with their documents
 * 2. Adds all documents to the documents store
 * 3. Updates the workspaces state with the workspace data
 *
 * Documents from the response are automatically added to the documents store via
 * cross-store communication.
 *
 * With Valtio, we just mutate the proxyMaps directly - no dispatching needed!
 *
 * @example
 * ```tsx
 * <button onClick={fetchWorkspaces}>Load Workspaces</button>
 * ```
 */
export async function fetchWorkspaces() {
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

        // Direct mutation - just set on the proxyMap
        documentsState.set(document.id, docWithWorkspace);
      });
    }
  });

  // Update workspaces state
  // Documents are already added to documents store, so we only store id and name
  workspaces.forEach((workspace) => {
    workspacesState.set(workspace.id, {
      id: workspace.id,
      name: workspace.name,
    });
  });

  return workspaces;
}

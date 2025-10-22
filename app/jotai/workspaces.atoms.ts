/**
 * @fileoverview Jotai Workspaces Atoms
 *
 * This file demonstrates fetching workspaces from a database and managing
 * workspace state with Jotai's atoms.
 *
 * Key concepts demonstrated:
 * - Primitive atoms for state (workspacesAtom)
 * - Write-only atoms for actions (fetchWorkspacesAtom)
 * - Cross-atom updates (adding documents from workspace response)
 * - Async operations within atom setters
 */

import { atom } from "jotai";
import { documentsAtom, type Document } from "./documents.atoms";

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

export type WorkspacesState = Record<string, Workspace>;

/**
 * Primitive Atom: Workspaces state
 *
 * @remarks
 * This is the primary atom that holds all workspaces in a Record<string, Workspace> format
 * for easy lookup by ID.
 *
 * Workspaces are simple entities with just id and name.
 * The relationship to documents is maintained on the Document type
 * via the workspaces array (direct object references).
 *
 * @example
 * ```tsx
 * // In a component:
 * const workspaces = useAtomValue(workspacesAtom);
 * ```
 */
export const workspacesAtom = atom<WorkspacesState>({});
workspacesAtom.debugLabel = "workspaces";

/**
 * Write-only Atom: Fetch workspaces from the database
 *
 * @remarks
 * This is a write-only atom that handles fetching workspaces from a database.
 * When set, it:
 * 1. Simulates a database query that returns workspaces with their documents
 * 2. Adds all documents to the documents atom
 * 3. Updates the workspaces atom with the workspace data
 *
 * Documents from the response are automatically added to the documents atom via
 * cross-atom communication.
 *
 * @example
 * ```tsx
 * const fetchWorkspaces = useSetAtom(fetchWorkspacesAtom);
 * // Later:
 * fetchWorkspaces();
 * ```
 */
export const fetchWorkspacesAtom = atom(null, async (get, set) => {
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

  // Add all documents from workspaces to the documents atom
  // and populate their workspace references
  const documentsToAdd: Record<string, Document> = {};

  workspaces.forEach((workspace) => {
    if (workspace.documents) {
      workspace.documents.forEach((document) => {
        // Add workspace reference to the document
        const docWithWorkspace = {
          ...document,
          workspaces: [{ id: workspace.id, name: workspace.name }],
        };
        documentsToAdd[document.id] = docWithWorkspace;
      });
    }
  });

  // Update documents atom with all documents from workspaces
  set(documentsAtom, (prev) => ({
    ...prev,
    ...documentsToAdd,
  }));

  // Update workspaces atom
  // Documents are already added to documents atom, so we only store id and name
  const newWorkspaces: WorkspacesState = {};
  workspaces.forEach((workspace) => {
    newWorkspaces[workspace.id] = {
      id: workspace.id,
      name: workspace.name,
    };
  });

  set(workspacesAtom, (prev) => ({
    ...prev,
    ...newWorkspaces,
  }));

  return workspaces;
});
fetchWorkspacesAtom.debugLabel = "fetchWorkspaces";

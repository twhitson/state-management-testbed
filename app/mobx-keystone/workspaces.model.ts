/**
 * @fileoverview MobX-Keystone Workspaces Model
 *
 * This file demonstrates using mobx-keystone to fetch workspaces from a database
 * and manage workspace state with observable models.
 *
 * Key concepts demonstrated:
 * - Fetching data from a simulated database
 * - Cross-store updates (adding documents from workspace response)
 * - Documents maintain the relationship via workspaceIds array
 * - Type-safe model references with getRootStore pattern
 */

import { model, Model, prop, modelFlow, _async, _await, getRootStore } from "mobx-keystone";
import { Document } from "./documents.model";

/**
 * Workspace model representing a workspace.
 *
 * @remarks
 * Workspaces are simple entities with just id and name.
 * The relationship to documents is maintained on the Document model
 * via the workspaceIds array.
 */
@model("state-management-testbed/Workspace")
export class Workspace extends Model({
  id: prop<string>(),
  name: prop<string>(),
}) {}

/**
 * Type for workspace data from the database including embedded documents.
 */
type WorkspaceWithDocuments = {
  id: string;
  name: string;
  documents?: Array<{
    id: string;
    path: string;
    title: string;
    pages: any[];
    workspaceIds: string[];
  }>;
};

/**
 * Simulates fetching workspaces from a database.
 *
 * @remarks
 * In a real application, this would make an API call to a backend service.
 * The response includes workspaces with their associated documents.
 *
 * @returns Array of workspaces with documents from the database
 *
 * @example
 * ```ts
 * const workspaces = await fetchWorkspacesFromDB();
 * ```
 */
async function fetchWorkspacesFromDB(): Promise<WorkspaceWithDocuments[]> {
  console.log("Fetching workspaces from database");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulated database response - workspaces with their documents
  const workspaces: WorkspaceWithDocuments[] = [
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

  return workspaces;
}

/**
 * Workspaces store model for managing all workspaces.
 *
 * @remarks
 * This store manages workspace state and demonstrates cross-store communication
 * by accessing the root store to add documents.
 */
@model("state-management-testbed/WorkspacesStore")
export class WorkspacesStore extends Model({
  workspaces: prop<Record<string, Workspace>>(() => ({})),
}) {
  /**
   * Fetches workspaces from the database.
   *
   * @remarks
   * This model flow fetches workspaces with their associated documents.
   * It demonstrates cross-store updates by adding documents to the
   * documents store via the root store.
   *
   * Pattern:
   * 1. Fetch workspaces from database (includes documents)
   * 2. Add all documents to the documents store
   * 3. Add workspaces to this store (without documents)
   *
   * @returns Promise that resolves when fetch is complete
   *
   * @example
   * ```ts
   * await workspacesStore.fetchWorkspaces();
   * ```
   */
  @modelFlow
  fetchWorkspaces = _async(function* (this: WorkspacesStore) {
    try {
      // Fetch workspaces from database (includes documents)
      const workspaces: WorkspaceWithDocuments[] = yield* _await(fetchWorkspacesFromDB());

      // Get the root store to access documents store
      const rootStore = getRootStore<any>(this);
      if (!rootStore || !rootStore.documents) {
        console.error("Root store not found or documents store not available");
        return;
      }

      // Add all documents from workspaces to the documents store
      for (const workspace of workspaces) {
        if (workspace.documents) {
          for (const docData of workspace.documents) {
            const document = new Document({
              id: docData.id,
              path: docData.path,
              title: docData.title,
              pages: [],
              workspaceIds: docData.workspaceIds,
            });
            rootStore.documents.addDocument(document);
          }
        }
      }

      // Add workspaces to this store (without documents)
      for (const workspaceData of workspaces) {
        const workspace = new Workspace({
          id: workspaceData.id,
          name: workspaceData.name,
        });
        this.workspaces[workspace.id] = workspace;
      }

      console.log("Fetched workspaces", workspaces);
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      // In a production app, you might:
      // - Dispatch a failure action
      // - Show a notification to the user
    }
  });

  /**
   * Gets a workspace by ID.
   *
   * @param id - The workspace ID
   * @returns The workspace or undefined if not found
   *
   * @example
   * ```ts
   * const workspace = workspacesStore.getWorkspace('workspace-1');
   * ```
   */
  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces[id];
  }

  /**
   * Gets all workspaces as an array.
   *
   * @remarks
   * This is a computed-like getter that converts the object to an array.
   * MobX will automatically track access to this.workspaces.
   *
   * @returns Array of all workspaces
   *
   * @example
   * ```ts
   * const allWorkspaces = workspacesStore.getAllWorkspaces();
   * ```
   */
  getAllWorkspaces(): Workspace[] {
    return Object.values(this.workspaces);
  }
}

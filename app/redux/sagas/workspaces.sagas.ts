/**
 * @fileoverview Redux-Saga Workspaces Example
 *
 * This file demonstrates using redux-saga to fetch workspaces from a database.
 *
 * Key concepts demonstrated:
 * - Fetching data from a simulated database
 * - Using yield call() for async operations
 * - Using yield put() to dispatch actions
 * - Cross-slice updates (dispatching addDocument for workspace documents)
 * - Watcher sagas with takeEvery
 */

import { call, put, takeEvery } from "redux-saga/effects";
import {
  fetchWorkspacesRequest,
  setWorkspaces,
  type Workspace,
} from "./workspaces.slice";
import { addDocument } from "./documents.slice";

/**
 * Simulates fetching workspaces from a database.
 *
 * @remarks
 * In a real application, this would make an API call to a backend service.
 * The response includes workspaces with their associated documents.
 *
 * @yields A call effect to execute the async operation
 * @returns Array of workspaces with documents from the database
 *
 * @example
 * ```ts
 * const workspaces = yield call(fetchWorkspacesFromDB);
 * ```
 */
function* fetchWorkspacesFromDB(): Generator<any, Workspace[], any> {
  console.log("Fetching workspaces from database");

  // Simulate network delay
  yield call(() => new Promise((resolve) => setTimeout(resolve, 500)));

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

  return workspaces;
}

/**
 * Worker saga that fetches workspaces from the database.
 *
 * @remarks
 * This saga is triggered by the fetchWorkspacesRequest action.
 * It demonstrates cross-slice updates by dispatching addDocument actions
 * for all documents found in the workspace response.
 *
 * @yields Call effect to fetch data and put effects to dispatch addDocument and setWorkspaces actions
 * @returns void
 *
 * @example
 * ```ts
 * // Triggered automatically when fetchWorkspacesRequest action is dispatched
 * dispatch(fetchWorkspacesRequest());
 * ```
 */
function* fetchWorkspacesSaga(): Generator<any, void, any> {
  try {
    // Fetch workspaces from database (includes documents)
    const workspaces: Workspace[] = yield call(fetchWorkspacesFromDB);

    // Add all documents from workspaces to the documents slice
    for (const workspace of workspaces) {
      if (workspace.documents) {
        for (const document of workspace.documents) {
          yield put(addDocument(document));
        }
      }
    }

    // Update state with fetched workspaces
    yield put(setWorkspaces(workspaces));

    console.log("Fetched workspaces", workspaces);
  } catch (error) {
    console.error("Failed to fetch workspaces:", error);
    // In a production app, you might:
    // - Dispatch a failure action: yield put(fetchWorkspacesFailed(error))
    // - Show a notification to the user
  }
}

/**
 * Watcher saga that listens for workspace fetch requests.
 *
 * @yields A takeEvery effect that watches for actions
 * @returns void
 */
export function* watchFetchWorkspaces() {
  yield takeEvery(fetchWorkspacesRequest.type, fetchWorkspacesSaga);
}

/**
 * Root saga for the workspaces feature.
 *
 * @yields Call effect to start watcher sagas
 * @returns void
 */
export function* workspacesSaga() {
  yield call(watchFetchWorkspaces);
}

import type { Route } from "./+types/redux.observable";
import { Link } from "react-router";
import { Provider, useDispatch, useSelector } from "react-redux";

import {
  addDocumentToWorkspace,
  createDocumentRequest,
  type DocumentSliceState,
} from "~/redux/sagas/documents.slice";
import {
  fetchWorkspacesRequest,
  type WorkspaceSliceState,
} from "~/redux/sagas/workspaces.slice";
import {
  observablesStore,
  type ObservablesAppDispatch,
  type ObservablesRootState,
} from "~/redux/observables/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Redux Observable - State Management Testbed" },
    {
      name: "description",
      content: "Redux Toolkit with redux-observable epics example",
    },
  ];
}

type DocumentsState = DocumentSliceState;
type WorkspacesState = WorkspaceSliceState;

function Content() {
  const dispatch = useDispatch<ObservablesAppDispatch>();
  const documents = useSelector<ObservablesRootState, DocumentsState>(
    (state) => state.documents,
  );
  const workspaces = useSelector<ObservablesRootState, WorkspacesState>(
    (state) => state.workspaces,
  );

  const handleCreateDocument = () => {
    dispatch(createDocumentRequest());
  };

  const handleLoadWorkspaces = () => {
    dispatch(fetchWorkspacesRequest());
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    dispatch(addDocumentToWorkspace({ documentId, workspaceId }));
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-cyan-600 hover:text-cyan-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Redux Observable Example</h1>
      <p className="text-gray-600 mb-6">
        Using redux-observable epics built on RxJS streams
      </p>

      <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded">
        <h3 className="font-semibold text-cyan-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-cyan-800">
          Asynchronous workflows run inside{" "}
          <code className="bg-cyan-100 px-1 rounded">redux-observable</code>{" "}
          epics. We optimistically dispatch slice reducers, then let RxJS handle
          the document directory + page creation steps. Errors are caught in the
          stream and logged without crashing the pipeline.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 ml-4"
        >
          Load Workspaces
        </button>
      </div>

      {Object.keys(workspaces).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Workspaces ({Object.keys(workspaces).length})
          </h2>
          <div className="space-y-4">
            {Object.values(workspaces).map((workspace) => {
              const workspaceDocs = Object.values(documents).filter((doc) =>
                doc.workspaceIds.includes(workspace.id),
              );
              return (
                <div
                  key={workspace.id}
                  className="p-4 border border-cyan-200 rounded bg-cyan-50"
                >
                  <div className="font-semibold text-lg text-cyan-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-cyan-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-cyan-800 pl-4"
                        >
                          • {doc.title} ({doc.id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Documents ({Object.keys(documents).length})
        </h2>
        <div className="space-y-2">
          {Object.values(documents).map((doc) => (
            <div key={doc.id} className="p-4 border rounded">
              <div className="font-medium">{doc.title}</div>
              <div className="text-sm text-gray-500">{doc.id}</div>
              <div className="text-sm mt-2">Pages: {doc.pages.length}</div>
              {doc.workspaceIds.length > 0 && (
                <div className="text-sm mt-2">
                  <span className="font-medium">Workspaces: </span>
                  {doc.workspaceIds
                    .map((workspaceId) => workspaces[workspaceId]?.name || workspaceId)
                    .join(", ")}
                </div>
              )}
              {Object.keys(workspaces).length > 0 && (
                <div className="mt-3">
                  <label className="text-sm font-medium mr-2">
                    Add to workspace:
                  </label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    onChange={(event) => {
                      if (event.target.value) {
                        handleAddToWorkspace(doc.id, event.target.value);
                        event.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select workspace...</option>
                    {Object.values(workspaces)
                      .filter((workspace) => !doc.workspaceIds.includes(workspace.id))
                      .map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {doc.pages.length > 0 && (
                <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(doc.pages, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReduxObservableRoute() {
  return (
    <Provider store={observablesStore}>
      <Content />
    </Provider>
  );
}

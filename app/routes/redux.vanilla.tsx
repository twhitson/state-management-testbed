import type { Route } from "./+types/redux.vanilla";
import { Link } from "react-router";
import { Provider, useDispatch, useSelector } from "react-redux";

import { addDocumentToWorkspace } from "~/redux/vanilla/actions";
import { createDocument, fetchWorkspaces } from "~/redux/vanilla/thunks";
import type { VanillaRootState } from "~/redux/vanilla/store";
import { vanillaStore } from "~/redux/vanilla/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vanilla Redux - State Management Testbed" },
    {
      name: "description",
      content: "Vanilla Redux with handwritten reducers, actions, and thunks",
    },
  ];
}

function Content() {
  const dispatch = useDispatch<any>();
  const documents = useSelector((state: VanillaRootState) => state.documents);
  const workspaces = useSelector((state: VanillaRootState) => state.workspaces);

  const handleCreateDocument = () => {
    dispatch(createDocument());
  };

  const handleLoadWorkspaces = () => {
    dispatch(fetchWorkspaces());
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    dispatch(addDocumentToWorkspace(documentId, workspaceId));
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-rose-600 hover:text-rose-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Vanilla Redux Example</h1>
      <p className="text-gray-600 mb-6">
        Hand-written reducers, actions, and thunks without Redux Toolkit
      </p>

      <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded">
        <h3 className="font-semibold text-rose-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-rose-800">
          All state transitions are plain action objects processed by reducers.
          Async workflows use a tiny custom thunk middleware that accepts
          functions and coordinates directory + page creation in sequence.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 ml-4"
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
                  className="p-4 border border-rose-200 rounded bg-rose-50"
                >
                  <div className="font-semibold text-lg text-rose-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-rose-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-rose-800 pl-4"
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
                    .map(
                      (workspaceId) =>
                        workspaces[workspaceId]?.name || workspaceId,
                    )
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
                      .filter(
                        (workspace) => !doc.workspaceIds.includes(workspace.id),
                      )
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

export default function VanillaReduxRoute() {
  return (
    <Provider store={vanillaStore}>
      <Content />
    </Provider>
  );
}

import type { Route } from "./+types/redux.thunk";
import { Link } from "react-router";
import { Provider } from "react-redux";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  createDocument,
  addDocumentToWorkspace,
} from "../redux/thunks/documents";
import { fetchWorkspaces } from "../redux/thunks/workspaces";
import { thunksStore } from "~/redux/thunks/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Redux Thunks - Redux Testbed" },
    { name: "description", content: "Redux Toolkit with Thunks example" },
  ];
}

function Content() {
  const dispatch = useAppDispatch();
  const documents = useAppSelector((state) => state.documents);
  const workspaces = useAppSelector((state) => state.workspaces);

  const handleCreateDocument = () => {
    dispatch(createDocument());
  };

  const handleLoadWorkspaces = () => {
    dispatch(fetchWorkspaces());
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    dispatch(addDocumentToWorkspace({ documentId, workspaceId }));
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Redux Thunks Example</h1>
      <p className="text-gray-600 mb-6">
        Using Redux Toolkit with createAsyncThunk
      </p>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-blue-800">
          Using{" "}
          <code className="bg-blue-100 px-1 rounded">createAsyncThunk</code>{" "}
          from Redux Toolkit. Thunks dispatch other thunks in a nested workflow
          to create documents and pages. Documents maintain workspaceIds array
          for workspace membership.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-4"
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
                  className="p-4 border border-blue-200 rounded bg-blue-50"
                >
                  <div className="font-semibold text-lg text-blue-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-blue-800 pl-4"
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
                    .map((wsId) => workspaces[wsId]?.name || wsId)
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
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddToWorkspace(doc.id, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select workspace...</option>
                    {Object.values(workspaces)
                      .filter((ws) => !doc.workspaceIds.includes(ws.id))
                      .map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {doc.pages.length > 0 && (
                <pre className="text-xs mt-2 text-gray-50 p-2 rounded overflow-auto">
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

export default function ReduxThunkRoute() {
  return (
    <Provider store={thunksStore}>
      <Content />
    </Provider>
  );
}

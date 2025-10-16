import type { Route } from "./+types/redux.saga";
import { Link } from "react-router";
import { Provider } from "react-redux";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  createDocumentRequest,
  addDocumentToWorkspace,
} from "../redux/sagas/documents.slice";
import { fetchWorkspacesRequest } from "../redux/sagas/workspaces.slice";
import { sagasStore } from "~/redux/sagas/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Redux-Saga - Redux Testbed" },
    { name: "description", content: "Redux with redux-saga example" },
  ];
}

function Content() {
  const dispatch = useAppDispatch();
  const documents = useAppSelector((state) => state.documents);
  const workspaces = useAppSelector((state) => state.workspaces);

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
        className="inline-block mb-4 text-green-600 hover:text-green-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Redux-Saga Example</h1>
      <p className="text-gray-600 mb-6">
        Using Redux with redux-saga for side effects
      </p>

      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-green-800">
          Using <code className="bg-green-100 px-1 rounded">redux-saga</code>{" "}
          with generator functions. Sagas call other sagas using{" "}
          <code className="bg-green-100 px-1 rounded">call</code> effects to
          create documents and pages in a coordinated workflow. Documents
          maintain workspaceIds array for workspace membership.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
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
                  className="p-4 border border-green-200 rounded bg-green-50"
                >
                  <div className="font-semibold text-lg text-green-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-green-800 pl-4"
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

export default function ReduxSagaRoute() {
  return (
    <Provider store={sagasStore}>
      <Content />
    </Provider>
  );
}

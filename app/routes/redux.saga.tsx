import type { Route } from "./+types/redux.saga";
import { Provider } from "react-redux";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createDocumentRequest } from "../redux/sagas/documents.slice";
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

  const handleCreateDocument = () => {
    dispatch(createDocumentRequest());
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Redux-Saga Example</h1>
      <p className="text-gray-600 mb-6">
        Using Redux with redux-saga for side effects
      </p>

      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-900 mb-2">Implementation Details</h3>
        <p className="text-sm text-green-800">
          Using <code className="bg-green-100 px-1 rounded">redux-saga</code> with generator functions.
          Sagas call other sagas using <code className="bg-green-100 px-1 rounded">call</code> effects
          to create documents and pages in a coordinated workflow.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Document
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Documents ({Object.keys(documents).length})
        </h2>
        <div className="space-y-2">
          {Object.values(documents).map((doc) => (
            <div key={doc.id} className="p-4 border rounded">
              <div className="font-medium">{doc.title}</div>
              <div className="text-sm text-gray-500">{doc.id}</div>
              <div className="text-sm mt-2">
                Pages: {doc.pages.length}
              </div>
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

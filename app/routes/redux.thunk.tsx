import type { Route } from "./+types/redux.thunk";
import { Provider } from "react-redux";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createDocument } from "../redux/thunks/documents";
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

  const handleCreateDocument = () => {
    dispatch(createDocument());
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Redux Thunks Example</h1>
      <p className="text-gray-600 mb-6">
        Using Redux Toolkit with createAsyncThunk
      </p>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Implementation Details</h3>
        <p className="text-sm text-blue-800">
          Using <code className="bg-blue-100 px-1 rounded">createAsyncThunk</code> from Redux Toolkit.
          Thunks dispatch other thunks in a nested workflow to create documents and pages.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

export default function ReduxThunkRoute() {
  return (
    <Provider store={thunksStore}>
      <Content />
    </Provider>
  );
}

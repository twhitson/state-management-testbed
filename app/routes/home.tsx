import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Redux State Management Testbed" },
    { name: "description", content: "Compare Redux Thunks and Redux-Saga" },
  ];
}

export default function Home() {
  return (
    <div>
      <Welcome />
      <div className="flex justify-center pb-16">
        <div className="max-w-[500px] w-full px-4">
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
              Redux Examples
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/redux/thunk"
                className="block p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900 transition-colors"
              >
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Redux Toolkit Thunks
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Using createAsyncThunk for async operations
                </p>
              </Link>
              <Link
                to="/redux/saga"
                className="block p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900 transition-colors"
              >
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Redux-Saga
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Using generator functions for side effects
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

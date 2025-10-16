import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "State Management Testbed" },
    {
      name: "description",
      content: "Compare Redux Thunks, Redux-Saga, Zustand, and MobX-Keystone",
    },
  ];
}

export default function Home() {
  return (
    <div className="flex justify-center pb-16">
      <div className="max-w-[500px] w-full px-4">
        <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            State Management Examples
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
            <Link
              to="/zustand"
              className="block p-4 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900 transition-colors"
            >
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Zustand
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Simple and direct state management with hooks
              </p>
            </Link>
            <Link
              to="/effect-atom"
              className="block p-4 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 transition-colors"
            >
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Effect-Atom
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Atoms backed by Effect services and SubscriptionRef state
              </p>
            </Link>
            <Link
              to="/mobx-keystone"
              className="block p-4 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:hover:bg-orange-900 transition-colors"
            >
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                MobX-Keystone
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Observable models with type safety and runtime validation
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

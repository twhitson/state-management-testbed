import { all, call } from "redux-saga/effects";
import { documentsSaga } from "./documents.sagas";
import { workspacesSaga } from "./workspaces.sagas";

export function* rootSaga() {
  yield all([call(documentsSaga), call(workspacesSaga)]);
}

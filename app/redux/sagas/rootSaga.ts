import { all, call } from "redux-saga/effects";
import { documentsSaga } from "./documents.sagas";

export function* rootSaga() {
  yield all([call(documentsSaga)]);
}

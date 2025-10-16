import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("mobx-keystone", "routes/mobx-keystone.tsx"),
  route("redux/thunk", "routes/redux.thunk.tsx"),
  route("redux/saga", "routes/redux.saga.tsx"),
  route("redux/observable", "routes/redux.observable.tsx"),
  route("zustand", "routes/zustand.tsx"),
  route("effect-atom", "routes/effect-atom.tsx"),
] satisfies RouteConfig;

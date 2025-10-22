import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("mobx-keystone", "routes/mobx-keystone.tsx"),
  route("redux/thunk", "routes/redux.thunk.tsx"),
  route("redux/saga", "routes/redux.saga.tsx"),
  route("redux/observable", "routes/redux.observable.tsx"),
  route("redux/vanilla", "routes/redux.vanilla.tsx"),
  route("zustand", "routes/zustand.tsx"),
  route("valtio", "routes/valtio.tsx"),
  route("bunshi", "routes/bunshi.tsx"),
  route("effector", "routes/effector.tsx"),
  route("jotai", "routes/jotai.tsx"),
  route("effect-atom", "routes/effect-atom.tsx"),
] satisfies RouteConfig;

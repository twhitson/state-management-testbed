import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("redux/thunk", "routes/redux.thunk.tsx"),
  route("redux/saga", "routes/redux.saga.tsx"),
  route("zustand", "routes/zustand.tsx"),
] satisfies RouteConfig;

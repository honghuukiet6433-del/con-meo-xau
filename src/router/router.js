import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";

export const PATHS = {
  INDEX: "/",
  HOME: "/home",
  VERIFY: "/verify",
  TIMEACTIVE: "/help-team",
};

const Index = lazy(() => import("@/pages/index"));
const Home = lazy(() => import("@/pages/home"));
const Verify = lazy(() => import("@/pages/verify"));
const NotFound = lazy(() => import("@/pages/not-found"));

const withSuspense = (Component) => (
  <Suspense fallback={<div></div>}>{Component}</Suspense>
);

const router = createBrowserRouter([
  {
    path: PATHS.INDEX,
    element: withSuspense(<NotFound />),
  },
  {
    path: PATHS.HOME,
    element: withSuspense(<Home />),
  },
  {
    path: PATHS.VERIFY,
    element: withSuspense(<Verify />),
  },
  {
    path: `${PATHS.TIMEACTIVE}/*`,
    element: withSuspense(<Index />),
  },
  {
    path: "*",
    element: withSuspense(<NotFound />),
  },
]);

export default router;

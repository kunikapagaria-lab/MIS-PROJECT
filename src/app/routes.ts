import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/root-layout";
import { ProtectedRoute } from "./components/protected-route";
import { Dashboard } from "./components/dashboard";
import { SalesOrders } from "./components/sales-orders";
import { SalesOrderNew } from "./components/sales-order-new";
import { SalesOrderView } from "./components/sales-order-view";
import { Stock } from "./components/stock";
import { DispatchNew } from "./components/dispatch-new";
import { InvoicePrint } from "./components/invoice-print";
import { FeedbackPublic } from "./components/feedback-public";
import { Login } from "./components/login";
import { Signup } from "./components/signup";

export const router = createBrowserRouter([
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: RootLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "sales-orders", Component: SalesOrders },
          { path: "sales-order/new", Component: SalesOrderNew },
          { path: "sales-order/:id", Component: SalesOrderView },
          { path: "stock", Component: Stock },
          { path: "dispatch/new", Component: DispatchNew },
          { path: "dispatch/new/:id", Component: DispatchNew },
        ],
      },
      { path: "/invoice/:id", Component: InvoicePrint },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  { path: "/feedback/:id", Component: FeedbackPublic },
]);

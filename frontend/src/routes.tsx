import Dashboard from "./pages/Dashboard"
import NuevaVenta from "./pages/NuevaVenta";


export const appRoutes = [
  {
    path: "/",
    label: "Dashboard",
    element: <Dashboard/>,
  },
  {
    path: "/venta-nueva",
    label: "Nueva venta",
    element: <NuevaVenta />,
  },
];

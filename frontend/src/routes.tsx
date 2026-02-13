import Dashboard from "./pages/Dashboard"
import NuevaVenta from "./pages/NuevaVenta";
import NuevoProducto from "./pages/NuevoProducto";


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
  {
    path: "/producto-nuevo",
    label: "Nuevo producto",
    element: <NuevoProducto/>,
  },
];

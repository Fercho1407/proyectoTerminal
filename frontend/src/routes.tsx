import Dashboard from "./pages/Dashboard"
import HistorialVentas from "./pages/HistorialVentas";
import Inventario from "./pages/Inventario";
import NuevaVenta from "./pages/NuevaVenta";
import NuevoProducto from "./pages/NuevoProducto";
import Predicciones from "./pages/Predicciones";
import Productos from "./pages/Productos";


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
    path: "/historial-ventas",
    label: "Historial de ventas",
    element: <HistorialVentas />,
  },
  {
    path: "/productos",
    label: "Productos",
    element: <Productos/>,
  },
  {
    path: "/producto-nuevo",
    label: "Nuevo producto",
    element: <NuevoProducto/>,
  },
  {
    path: "/inventario",
    label: "Inventario",
    element: <Inventario/>,
  },
  {
    path: "/predicciones",
    label: "Predicciones",
    element: <Predicciones/>,
  },
];

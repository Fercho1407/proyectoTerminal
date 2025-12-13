import { AlertasView } from "./Alertas.js";
import { DashboardView } from "./Dashboard.js";
import { EstadisticasGlobalView } from "./EstadisticasGlobal.js";
import { EstadisticasProductoView } from "./EstadisticasProducto.js";
import { InventarioView } from "./Inventario.js";
import { PrediccionesView } from "./Predicciones.js";
import { ProductosListaView } from "./ProductosLista.js";
import { ProductosNuevoView } from "./ProductosNuevo.js";
import { VentasNuevaView } from "./VentaNueva.js";
import { VentasHistorialView } from "./VentasHistorial.js";

export const VIEWS = {
  dashboard: DashboardView,
  'ventas-nueva': VentasNuevaView,
  "ventas-historial": VentasHistorialView,
  "productos-nuevo": ProductosNuevoView,
  "productos-lista": ProductosListaView,
  inventario: InventarioView,
  alertas: AlertasView,
  predicciones: PrediccionesView,
  "estadisticas-producto": EstadisticasProductoView,
  "estadisticas-global": EstadisticasGlobalView,
  
};

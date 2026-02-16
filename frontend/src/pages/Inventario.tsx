import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./../config";
import FilaInventario from "./../components/FilaInventario";
import "./styles/Inventario.css";

type ItemInventario = {
  clave: string;
  product_id: number | string;
  nombre_producto: string;
  categoria: string;
  perecedero: boolean;
  unidad: string;
  stock: number;
};

type ItemInventarioApi = {
  product_id: number | string;
  product_name: string;
  category_off?: string | null;
  perecedero: number | string;
  unit: string;
  stock_actual?: number | string | null;
};

export default function Inventario() {
  const navegar = useNavigate();

  const [estado, setEstado] = useState("Cargando...");
  const [cargando, setCargando] = useState(false);

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [itemsMostrados, setItemsMostrados] = useState<ItemInventario[]>([]);

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [umbralBajo, setUmbralBajo] = useState(10);
  const [umbralCritico, setUmbralCritico] = useState(3);

  // Para deshabilitar botones mientras se manda un movimiento
  const [claveBloqueada, setClaveBloqueada] = useState<string>("");

  function normalizarFila(r: ItemInventarioApi): ItemInventario {
    const unidad = String(r.unit || "");
    const id = r.product_id;

    return {
      clave: `${id}__${unidad}`,
      product_id: id,
      nombre_producto: String(r.product_name || ""),
      categoria: String(r.category_off || ""),
      perecedero: Number(r.perecedero) === 1,
      unidad: unidad,
      stock: Number(r.stock_actual ?? 0),
    };
  }

  function aplicarFiltro(lista: ItemInventario[], busqueda: string) {
    const termino = (busqueda || "").trim().toLowerCase();
    if (!termino) return lista;

    const filtrados = lista.filter((it) => {
      const nombre = (it.nombre_producto || "").toLowerCase();
      const categoria = (it.categoria || "").toLowerCase();
      const unidad = (it.unidad || "").toLowerCase();
      return (
        nombre.includes(termino) ||
        categoria.includes(termino) ||
        unidad.includes(termino)
      );
    });

    return filtrados;
  }

  async function cargarInventario() {
    setCargando(true);
    setEstado("Cargando inventario...");

    try {
      const respuesta = await fetch(`${API_URL}/inventory/stock`);
      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        const detalle = (datos as any)?.detail;
        const mensaje =
          typeof detalle === "string" ? detalle : `Error HTTP ${respuesta.status}`;
        throw new Error(mensaje);
      }

      const listaApi = Array.isArray(datos) ? (datos as ItemInventarioApi[]) : [];
      const lista = listaApi.map(normalizarFila);

      setItems(lista);
      setItemsMostrados(aplicarFiltro(lista, textoBusqueda));
      setEstado(`Listo: ${lista.length} fila(s) de inventario.`);
    } catch (error: any) {
      console.error(error);
      setItems([]);
      setItemsMostrados([]);
      setEstado(error?.message || "Error");
    } finally {
      setCargando(false);
    }
  }

  async function enviarMovimiento(payload: any) {
    const respuesta = await fetch(`${API_URL}/inventory/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      const detalle = (datos as any)?.detail;

      if (typeof detalle === "string") {
        throw new Error(detalle);
      }

      if (Array.isArray(detalle)) {
        const mensaje = detalle.map((d: any) => d?.msg).filter(Boolean).join(" | ");
        throw new Error(mensaje || `Error HTTP ${respuesta.status}`);
      }

      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    return datos;
  }

  async function aumentarUno(item: ItemInventario) {
    setClaveBloqueada(item.clave);

    try {
      await enviarMovimiento({
        product_id: item.product_id,
        type: "IN",
        qty: 1,
        unit: item.unidad,
        reason: "Ajuste rápido +1",
      });

      await cargarInventario();
    } catch (error: any) {
      alert(error?.message || "Error");
    } finally {
      setClaveBloqueada("");
    }
  }

  async function disminuirUno(item: ItemInventario) {
    if (item.stock <= 0) return;

    setClaveBloqueada(item.clave);

    try {
      await enviarMovimiento({
        product_id: item.product_id,
        type: "OUT",
        qty: 1,
        unit: item.unidad,
        reason: "Ajuste rápido -1",
      });

      await cargarInventario();
    } catch (error: any) {
      alert(error?.message || "Error");
    } finally {
      setClaveBloqueada("");
    }
  }

  async function establecerStock(item: ItemInventario) {
    const actual = Number(item.stock || 0);

    const texto = prompt(
      `Nuevo stock para "${item.nombre_producto}" (${item.unidad}):`,
      String(actual)
    );
    if (texto === null) return;

    const objetivo = Number(texto);
    if (!Number.isFinite(objetivo) || objetivo < 0) {
      alert("Stock inválido");
      return;
    }

    const diferencia = objetivo - actual;
    if (diferencia === 0) return;

    setClaveBloqueada(item.clave);

    try {
      if (diferencia > 0) {
        await enviarMovimiento({
          product_id: item.product_id,
          type: "ADJUST",
          qty: diferencia,
          unit: item.unidad,
          reason: `Set stock a ${objetivo}`,
        });
      } else {
        await enviarMovimiento({
          product_id: item.product_id,
          type: "OUT",
          qty: Math.abs(diferencia),
          unit: item.unidad,
          reason: `Set stock a ${objetivo}`,
        });
      }

      await cargarInventario();
    } catch (error: any) {
      alert(error?.message || "Error");
    } finally {
      setClaveBloqueada("");
    }
  }

  // Carga inicial
  useEffect(() => {
    cargarInventario();
  }, []);

  // Recalcular filtro cuando cambie la búsqueda o cambie la lista
  useEffect(() => {
    setItemsMostrados(aplicarFiltro(items, textoBusqueda));
  }, [items, textoBusqueda]);

  return (
    <section className="view active">
      <div className="card">
        <div className="view-header">
          <div>
            <h3>Inventario (stock actual)</h3>
            <p className="muted">{estado}</p>
          </div>

          <div className="view-header-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={cargarInventario}
              disabled={cargando}
            >
              Recargar
            </button>

            <button
              className="btn secondary"
              type="button"
              onClick={() => navegar("/producto-nuevo")}
              disabled={cargando}
            >
              Producto Nuevo
            </button>
          </div>
        </div>

        <div className="form">
          <div className="field full">
            <label>Buscar</label>
            <input
              type="text"
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              placeholder="Nombre, categoría..."
              disabled={cargando}
            />
          </div>

          <div className="field">
            <label>Umbral Bajo</label>
            <input
              type="number"
              min={0}
              value={umbralBajo}
              onChange={(e) => setUmbralBajo(Number(e.target.value))}
              disabled={cargando}
            />
          </div>

          <div className="field">
            <label>Umbral Crítico</label>
            <input
              type="number"
              min={0}
              value={umbralCritico}
              onChange={(e) => setUmbralCritico(Number(e.target.value))}
              disabled={cargando}
            />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Perecedero</th>
              <th>Unidad</th>
              <th>Stock</th>
              <th>Estado</th>
              <th style={{ width: 260 }}>Ajuste rápido</th>
            </tr>
          </thead>

          <tbody>
            {itemsMostrados.length ? (
              itemsMostrados.map((item) => (
                <FilaInventario
                  key={item.clave}
                  item={item}
                  umbralBajo={umbralBajo}
                  umbralCritico={umbralCritico}
                  onAumentar={aumentarUno}
                  onDisminuir={disminuirUno}
                  onEstablecer={establecerStock}
                  deshabilitado={cargando || claveBloqueada === item.clave}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

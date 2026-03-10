import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./styles/HistorialVentas.css"

// Filas de ventas de como vienen en el backend
type FilaVenta = {
  sale_id?: number | string;
  item_id?: number | string;
  sold_at: string;
  product_name?: string;
  qty?: number | string;
  unit?: string;
  unit_price?: number | string;
  subtotal?: number | string;
};

export default function HistorialVentas() {
  const navegar = useNavigate();

  const [estado, setEstado] = useState("Listo.");
  const [cargando, setCargando] = useState(false);

  const [filas, setFilas] = useState<FilaVenta[]>([]);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Dar formato al dinero
  function dinero(valor: any) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "$0.00";
    return `$${numero.toFixed(2)}`;
  }

  function cantidadTexto(cantidad: any, unidad?: string) {
    const numero = Number(cantidad);
    if (!Number.isFinite(numero)) return `— ${unidad || ""}`.trim();

    const texto = Math.abs(numero) < 10 ? numero.toFixed(3) : numero.toFixed(2);
    return `${texto} ${unidad || ""}`.trim();
  }

  // Dar formato a la fecha
  function fechaTexto(isoDatetime: any) {
    const fecha = new Date(isoDatetime);
    if (Number.isNaN(fecha.getTime())) return String(isoDatetime ?? "");

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  }

  function crearQuery() {
    const parametros = new URLSearchParams();

    if (fechaDesde) parametros.set("from", fechaDesde);
    if (fechaHasta) parametros.set("to", fechaHasta);

    const hayFiltros = Boolean(fechaDesde || fechaHasta);
    if (hayFiltros) {
      parametros.set("limit", "500");
      parametros.set("offset", "0");
    }

    const texto = parametros.toString();
    if (!texto) return "";
    return `?${texto}`;
  }

  async function consultarHistorial() {
    setCargando(true);
    setEstado("Consultando backend...");

    const query = crearQuery();

    try {
      const respuesta = await fetch(`${API_URL}/sales/history${query}`);
      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        const detalle = (datos as any)?.detail;
        const mensaje =
          typeof detalle === "string"
            ? detalle
            : `Error HTTP ${respuesta.status}`;
        throw new Error(mensaje);
      }

      const lista = Array.isArray(datos) ? datos : [];
      setFilas(lista);
      setEstado(`Listo: ${lista.length} fila(s).`);
    } catch (error: any) {
      console.error(error);
      setFilas([]);
      setEstado(error?.message || "Error");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFiltros() {
    setFechaDesde("");
    setFechaHasta("");

    setTimeout(() => {
      consultarHistorial();
    }, 0);
  }

  // Exportar CSV
  function exportarCsv() {
    if (!filas.length) {
      alert("No hay datos para exportar.");
      return;
    }

    const encabezados = [
      "sale_id",
      "item_id",
      "sold_at",
      "product_name",
      "qty",
      "unit",
      "unit_price",
      "subtotal",
    ];

    const lineas: string[] = [];
    lineas.push(encabezados.join(","));

    for (let i = 0; i < filas.length; i++) {
      const fila: any = filas[i];
      const valores: string[] = [];

      for (let j = 0; j < encabezados.length; j++) {
        const clave = encabezados[j];
        const valor = fila?.[clave];
        let texto = valor == null ? "" : String(valor);

        if (/[",\n]/.test(texto)) {
          texto = `"${texto.replaceAll('"', '""')}"`;
        }

        valores.push(texto);
      }

      lineas.push(valores.join(","));
    }

    const blob = new Blob([lineas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `sales_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    consultarHistorial();
  }, []);

  return (
    <section className="view active">
      <h2>Historial de ventas</h2>
      <div className="card">
        <div className="view-header">
          <div>
            <p className="muted">{estado}</p>
          </div>

          <div className="view-header-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={() => navegar("/venta-nueva")}
            >
              Nueva venta
            </button>

            <button
              className="btn secondary"
              type="button"
              onClick={exportarCsv}
              disabled={cargando}
            >
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="form">
          <div className="field">
            <label>Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              disabled={cargando}
              onClick={(e) => {
                const input = e.currentTarget;
                if (input.showPicker) {
                input.showPicker();
                }
              }}
            />
          </div>

          <div className="field">
            <label>Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              disabled={cargando}
              onClick={(e) => {
                const input = e.currentTarget;
                if (input.showPicker) {
                input.showPicker();
                }
              }}
            />
          </div>

          <div className="field full">
            <div className="actions">
              <button
                className="btn secondary"
                type="button"
                onClick={limpiarFiltros}
                disabled={cargando}
              >
                Limpiar
              </button>

              <button
                className="btn"
                type="button"
                onClick={consultarHistorial}
                disabled={cargando}
              >
                {cargando ? "Cargando..." : "Aplicar filtros"}
              </button>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {filas.length ? (
              filas.map((fila, indice) => (
                <tr key={`${fila.sale_id ?? "s"}-${fila.item_id ?? "i"}-${indice}`}>
                  <td>{fechaTexto(fila.sold_at)}</td>
                  <td>{fila.product_name ?? ""}</td>
                  <td>{cantidadTexto(fila.qty, fila.unit)}</td>
                  <td>{dinero(fila.unit_price)}</td>
                  <td>{dinero(fila.subtotal)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="muted">
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

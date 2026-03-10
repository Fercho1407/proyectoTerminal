// src/pages/Predicciones.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./../config";
import "./styles/Predicciones.css";

type Producto = {
  id: number | string;
  product_name: string;
  category_off?: string | null;
};

type Punto = {
  date: string;
  y_pred: number;
};

type RespuestaPredict = {
  product_name?: string;
  unit?: string;
  days?: number;
  used_price?: number;
  points?: Punto[];
};

export default function Predicciones() {
  const navegar = useNavigate();

  const [estado, setEstado] = useState("Listo.");
  const [cargando, setCargando] = useState(false);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState("");

  const [unidad, setUnidad] = useState("piece");
  const [dias, setDias] = useState(7);
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [nombreProducto, setNombreProducto] = useState("—");
  const [ventasEsperadas, setVentasEsperadas] = useState("—");
  const [recomendadoComprar, setRecomendadoComprar] = useState("—");
  const [precioUsado, setPrecioUsado] = useState("—");

  const chartRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tipFechaRef = useRef<HTMLDivElement | null>(null);
  const tipValorRef = useRef<HTMLDivElement | null>(null);

  function dinero(n: any) {
    const v = Number(n);
    return Number.isFinite(v) ? `$${v.toFixed(2)}` : "—";
  }

  function fmt3(n: any) {
    const v = Number(n);
    return Number.isFinite(v) ? v.toFixed(3) : "—";
  }

  function calcularVentasEsperadas(lista: Punto[]) {
    let suma = 0;
    for (let i = 0; i < lista.length; i++) {
      suma += Number(lista[i].y_pred) || 0;
    }
    return suma;
  }

  function crearPayload() {
    const id = Number(productoId);
    if (!Number.isFinite(id) || id <= 0) return null;

    const payload: any = {
      product_id: id,
      unit: unidad,
      days: dias,
    };

    const txtPrecio = (precio || "").trim();
    if (txtPrecio !== "") {
      const p = Number(txtPrecio);
      if (Number.isFinite(p) && p >= 0) payload.price = p;
    }

    return payload;
  }

  async function cargarProductos() {
    setEstado("Cargando productos...");
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data as any)?.detail || `Error HTTP ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : "Error al cargar productos");
      }

      const lista = Array.isArray(data) ? (data as Producto[]) : [];
      setProductos(lista);
      setEstado(`Productos: ${lista.length}.`);

      if (!productoId && lista.length) {
        setProductoId(String(lista[0].id));
      }
    } catch (error: any) {
      console.error(error);
      setProductos([]);
      setProductoId("");
      setEstado(error?.message || "Error");
    } finally {
      setCargando(false);
    }
  }

  async function predecir() {
    const payload = crearPayload();
    if (!payload) {
      setEstado("Selecciona un producto válido.");
      return;
    }

    setCargando(true);
    setEstado("Consultando backend...");

    try {
      const res = await fetch(`${API_URL}/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        if (res.status === 422) {
          const detail = data?.detail ? JSON.stringify(data.detail, null, 2) : "Sin detail";
          throw new Error(`422 Validación:\n${detail}`);
        }
        throw new Error(data?.detail || `Error HTTP ${res.status}`);
      }

      const respuesta = data as RespuestaPredict;
      const listaPuntos = Array.isArray(respuesta.points) ? respuesta.points : [];

      setPuntos(listaPuntos);

      const esperado = calcularVentasEsperadas(listaPuntos);
      const stockNum = (stock || "").trim() === "" ? null : Number(stock);
      const comprar = stockNum == null ? null : Math.max(0, esperado - stockNum);

      const nombre = respuesta.product_name || String(payload.product_id);
      const unidadFinal = respuesta.unit || payload.unit;

      setNombreProducto(nombre);
      setVentasEsperadas(`${esperado.toFixed(3)} ${unidadFinal}`);
      setPrecioUsado(dinero(respuesta.used_price));

      if (stockNum == null) {
        setRecomendadoComprar("(pon stock)");
      } else {
        setRecomendadoComprar(`${(comprar as number).toFixed(3)} ${unidadFinal}`);
      }

      setEstado(`OK: ${nombre} (${payload.days} día(s), ${unidadFinal})`);
    } catch (error: any) {
      console.error(error);
      setEstado(`Error: ${error?.message || "Error"}`);

      setPuntos([]);
      setNombreProducto("—");
      setVentasEsperadas("—");
      setRecomendadoComprar("—");
      setPrecioUsado("—");
    } finally {
      setCargando(false);
    }
  }

  function limpiar() {
    setProductoId("");
    setUnidad("piece");
    setDias(7);
    setPrecio("");
    setStock("");

    setPuntos([]);
    setNombreProducto("—");
    setVentasEsperadas("—");
    setRecomendadoComprar("—");
    setPrecioUsado("—");
    setEstado("Listo.");

    limpiarGrafica();
  }

  function limpiarGrafica() {
    const chart = chartRef.current;
    if (!chart) return;

    const svg = chart.querySelector("svg");
    if (svg) svg.remove();

    const empty = chart.querySelector(".chart-empty") as HTMLDivElement | null;
    if (empty) empty.style.display = "flex";

    const tooltip = tooltipRef.current;
    if (tooltip) tooltip.style.transform = "translate(-9999px,-9999px)";
  }

  function dibujarGrafica(lista: Punto[]) {
    const chart = chartRef.current;
    if (!chart) return;

    if (!lista.length) {
      limpiarGrafica();
      return;
    }

    const serie = lista.map((p) => ({
      fecha: String(p.date || ""),
      valor: Number(p.y_pred),
    }));

    let tieneValor = false;
    for (let i = 0; i < serie.length; i++) {
      if (Number.isFinite(serie[i].valor)) {
        tieneValor = true;
        break;
      }
    }
    if (!tieneValor) {
      limpiarGrafica();
      return;
    }

    const empty = chart.querySelector(".chart-empty") as HTMLDivElement | null;
    if (empty) empty.style.display = "none";

    const old = chart.querySelector("svg");
    if (old) old.remove();

    const W = Math.max(360, Math.round(chart.clientWidth || 900));
    const H = Math.max(240, Math.round(chart.clientHeight || 320));

    const padL = 58;
    const padR = 14;
    const padT = 14;
    const padB = 52;

    const valores: number[] = [];
    for (let i = 0; i < serie.length; i++) {
      valores.push(Number.isFinite(serie[i].valor) ? serie[i].valor : 0);
    }

    let minV = Math.min(...valores);
    let maxV = Math.max(...valores);
    if (minV === maxV) {
      maxV = minV + 1;
      minV = Math.max(0, minV - 1);
    }

    function xScale(i: number) {
      if (serie.length === 1) return padL;
      return padL + (i * (W - padL - padR)) / (serie.length - 1);
    }

    function yScale(v: number) {
      const t = (v - minV) / (maxV - minV);
      return H - padB - t * (H - padT - padB);
    }

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.display = "block";

    function mkLine(x1: number, y1: number, x2: number, y2: number, stroke: string) {
      const ln = document.createElementNS(ns, "line");
      ln.setAttribute("x1", String(x1));
      ln.setAttribute("y1", String(y1));
      ln.setAttribute("x2", String(x2));
      ln.setAttribute("y2", String(y2));
      ln.setAttribute("stroke", stroke);
      return ln;
    }

    function mkText(x: number, y: number, str: string, opts: any) {
      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y));
      t.setAttribute("fill", opts?.fill || "rgba(15,23,42,.75)");
      t.setAttribute("font-size", String(opts?.size || 11));
      if (opts?.anchor) t.setAttribute("text-anchor", opts.anchor);
      if (opts?.transform) t.setAttribute("transform", opts.transform);
      t.textContent = str;
      return t;
    }

    const x0 = padL;
    const y0 = H - padB;
    const x1 = W - padR;
    const y1 = padT;

    svg.appendChild(mkLine(x0, y0, x1, y0, "rgba(15,23,42,.25)"));
    svg.appendChild(mkLine(x0, y0, x0, y1, "rgba(15,23,42,.25)"));

    const midV = (minV + maxV) / 2;
    const guias = [minV, midV, maxV];
    for (let i = 0; i < guias.length; i++) {
      const v = guias[i];
      svg.appendChild(mkLine(x0, yScale(v), x1, yScale(v), "rgba(15,23,42,.08)"));
    }

    svg.appendChild(mkText(x0 - 10, yScale(maxV) + 4, maxV.toFixed(2), { anchor: "end" }));
    svg.appendChild(mkText(x0 - 10, yScale(midV) + 4, midV.toFixed(2), { anchor: "end" }));
    svg.appendChild(mkText(x0 - 10, yScale(minV) + 4, minV.toFixed(2), { anchor: "end" }));

    const idxA = 0;
    const idxB = Math.floor((serie.length - 1) / 2);
    const idxC = serie.length - 1;

    function fmtX(s: string) {
      return s.length > 10 ? s.slice(0, 10) : s;
    }

    const indices = [idxA, idxB, idxC];
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      const x = xScale(idx);
      svg.appendChild(mkLine(x, y0, x, y0 + 6, "rgba(15,23,42,.25)"));
      svg.appendChild(mkText(x, y0 + 20, fmtX(serie[idx].fecha), { anchor: "middle" }));
    }

    let d = "";
    for (let i = 0; i < serie.length; i++) {
      const v = Number.isFinite(serie[i].valor) ? serie[i].valor : 0;
      d += `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(v)} `;
    }

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d.trim());
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(15,23,42,.85)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    for (let i = 0; i < serie.length; i++) {
      const v = Number.isFinite(serie[i].valor) ? serie[i].valor : 0;
      const x = xScale(i);
      const y = yScale(v);

      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", "3.2");
      dot.setAttribute("fill", "rgba(15,23,42,.95)");
      svg.appendChild(dot);

      const hit = document.createElementNS(ns, "circle");
      hit.setAttribute("cx", String(x));
      hit.setAttribute("cy", String(y));
      hit.setAttribute("r", "10");
      hit.setAttribute("fill", "transparent");
      hit.style.cursor = "crosshair";

      hit.addEventListener("mousemove", (ev: any) => {
        const tipFecha = tipFechaRef.current;
        const tipValor = tipValorRef.current;
        const tooltip = tooltipRef.current;
        if (!tipFecha || !tipValor || !tooltip) return;

        tipFecha.textContent = serie[i].fecha;
        tipValor.textContent = `Pred: ${v.toFixed(3)} ${unidad}`;

        const r = chart.getBoundingClientRect();
        tooltip.style.transform = `translate(${ev.clientX - r.left + 12}px, ${ev.clientY - r.top + 12}px)`;
      });

      hit.addEventListener("mouseleave", () => {
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.transform = "translate(-9999px,-9999px)";
      });

      svg.appendChild(hit);
    }

    const yAxisTitle = `Cantidad esperada (${unidad})`;

    svg.appendChild(
      mkText(18, H / 2, yAxisTitle, {
        size: 12,
        fill: "rgba(15,23,42,.80)",
        anchor: "middle",
        transform: `rotate(-90 18 ${H / 2})`,
      })
    );

    svg.appendChild(
      mkText((x0 + x1) / 2, H - 12, "Fecha", {
        size: 12,
        fill: "rgba(15,23,42,.80)",
        anchor: "middle",
      })
    );

    chart.appendChild(svg);
  }

  useEffect(() => {
    dibujarGrafica(puntos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos, unidad]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ro = new ResizeObserver(() => {
      if (puntos.length) dibujarGrafica(puntos);
    });

    ro.observe(chart);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos, unidad]);

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="view active">
        <h2>Predicciones</h2>
      <div className="card">
        <div className="view-header">
          <div>
            <p className="muted">{estado}</p>
          </div>

          <div className="view-header-actions">
            <button className="btn secondary" type="button" onClick={cargarProductos} disabled={cargando}>
              Cargar productos
            </button>

            <button className="btn secondary" type="button" onClick={() => navegar("/inventario")} disabled={cargando}>
              Ver inventario
            </button>

            <button
              className="btn secondary"
              type="button"
              onClick={() => navegar("/estadisticas-producto")}
              disabled={cargando}
            >
              Stats producto
            </button>
          </div>
        </div>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            predecir();
          }}
        >
          <div className="field full">
            <label>Producto</label>
            <select
              className="input"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              disabled={cargando}
              required
            >
              {!productos.length ? (
                <option value="">(Sin productos)</option>
              ) : (
                <>
                  <option value="">Selecciona...</option>
                  {productos.map((p) => {
                    const label = `${p.product_name}${p.category_off ? ` · ${p.category_off}` : ""}`;
                    return (
                      <option key={String(p.id)} value={String(p.id)}>
                        {label}
                      </option>
                    );
                  })}
                </>
              )}
            </select>

            <p className="muted hint">Tip: presiona Cargar productos si está vacío.</p>
          </div>

          <div className="field">
            <label>Unidad</label>
            <select className="input" value={unidad} onChange={(e) => setUnidad(e.target.value)} disabled={cargando}>
              <option value="piece">piece</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="pack">pack</option>
              <option value="box">box</option>
              <option value="lt">lt</option>
              <option value="ml">ml</option>
            </select>
          </div>

          <div className="field">
            <label>Días</label>
            <select className="input" value={dias} onChange={(e) => setDias(Number(e.target.value))} disabled={cargando}>
              <option value={7}>7</option>
              <option value={14}>14</option>
              <option value={30}>30</option>
            </select>
          </div>

          <div className="field">
            <label>Precio (opcional)</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Si lo dejas vacío usa el último"
              disabled={cargando}
            />
          </div>

          <div className="field">
            <label>Stock actual (opcional)</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.001"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Ej. 12"
              disabled={cargando}
            />
          </div>

          <div className="field full">
            <div className="actions">
              <button className="btn secondary" type="button" onClick={limpiar} disabled={cargando}>
                Limpiar
              </button>

              <button className="btn" type="submit" disabled={cargando}>
                {cargando ? "Prediciendo..." : "Predecir"}
              </button>
            </div>
          </div>
        </form>

        <div className="card soft separacion">
          <h3 className="subtitulo">Resultado</h3>

          <div className="chips">
            <span className="tag">Producto: {nombreProducto}</span>
            <span className="tag">Ventas esperadas: {ventasEsperadas}</span>
            <span className="tag warn">Recomendado comprar: {recomendadoComprar}</span>
            <span className="tag">Precio usado: {precioUsado}</span>
          </div>

          <div className="chart-wrap">
            <div className="chart" ref={chartRef}>
              <div className="muted chart-empty">Área de gráfica</div>
            </div>

            <div className="card soft tooltip" ref={tooltipRef}>
              <div className="muted" ref={tipFechaRef}>
                —
              </div>
              <div className="tooltip-value" ref={tipValorRef}>
                —
              </div>
            </div>
          </div>

          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Predicción</th>
                </tr>
              </thead>
              <tbody>
                {puntos.length ? (
                  puntos.map((p, i) => (
                    <tr key={`${p.date}-${i}`}>
                      <td>{p.date}</td>
                      <td>{fmt3(p.y_pred)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="muted">
                      Sin datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EstadisticasProductoView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Stats por producto</h3>
          <p class="muted">Conecta a GET /stats/product</p>
        </div>

        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="predicciones">🔮 Ir a predicciones</button>
          <button class="btn secondary" type="button" data-go="ventas-historial">🧾 Ver ventas</button>
          <button class="btn secondary" type="button" id="btnReload">🔄 Sync</button>
        </div>
      </div>

      <div class="form">
        <!-- ✅ CAMBIO: combobox (input + select) en lugar de product_id manual -->
        <div class="field full">
          <label>Producto</label>
          <input type="text" id="productSearch" placeholder="Buscar producto..." autocomplete="off" />
          <select id="productId" required style="margin-top:8px;">
            <option value="">(Cargando...)</option>
          </select>
        </div>

        <div class="field">
          <label>Rango</label>
          <select id="range">
            <option value="7d">Últimos 7 días</option>
            <option value="30d" selected>Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="365d">Último año</option>
          </select>
        </div>

        <div class="field">
          <label>Métrica principal</label>
          <select id="metric">
            <option value="sales" selected>Ventas (qty)</option>
            <option value="revenue">Ingresos (qty * precio)</option>
          </select>
        </div>

        <div class="field">
          <label>Unidad</label>
          <select id="unit">
            <option value="piece" selected>piece</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="pack">pack</option>
            <option value="box">box</option>
            <option value="lt">lt</option>
            <option value="ml">ml</option>
          </select>
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="button" id="btnClear">Limpiar</button>
            <button class="btn" type="button" id="btnRun">Ver estadísticas</button>
          </div>
          <p class="muted" id="status" style="margin-top:10px;">Listo.</p>
        </div>
      </div>

      <div class="card soft" style="margin-top:12px;">
        <h3>Query (GET /stats/product)</h3>
        <pre class="code" id="queryPreview">{}</pre>
      </div>

      <div class="grid" style="margin-top:12px; display:grid; grid-template-columns: repeat(4, 1fr); gap:12px;">
        <div class="card soft"><div class="muted">Total</div><div style="font-size:18px;" id="kpiTotal">—</div></div>
        <div class="card soft"><div class="muted">Prom. por día</div><div style="font-size:18px;" id="kpiAvg">—</div></div>
        <div class="card soft"><div class="muted">Volatilidad</div><div style="font-size:18px;" id="kpiVol">—</div></div>
        <div class="card soft"><div class="muted">Puntos</div><div style="font-size:18px;" id="kpiN">—</div></div>
      </div>

      <div class="card soft" style="margin-top:12px;">
        <h3>Serie temporal</h3>

        <div id="chartWrap" style="position:relative;">
          <div id="chart" style="height:320px; border:1px dashed rgba(255,255,255,.12); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            <span class="muted" id="chartEmpty">Área de gráfica</span>
          </div>

          <div id="tooltip"
               class="card soft"
               style="position:absolute; left:0; top:0; transform:translate(-9999px,-9999px); pointer-events:none; padding:8px 10px; border-radius:10px; font-size:12px; opacity:.98;">
            <div class="muted" id="tipDate">—</div>
            <div id="tipValue" style="font-weight:700;">—</div>
          </div>
        </div>

        <div style="margin-top:12px; overflow:auto; max-height:220px;">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Valor</th></tr>
            </thead>
            <tbody id="seriesBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // navegación
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) window.location.hash = `#/${go.dataset.go}`;
  });

  const API_URL = "http://127.0.0.1:8000";

  const productId = el.querySelector("#productId");
  const productSearch = el.querySelector("#productSearch");

  const range = el.querySelector("#range");
  const metric = el.querySelector("#metric");
  const unit = el.querySelector("#unit");
  const btnRun = el.querySelector("#btnRun");
  const btnClear = el.querySelector("#btnClear");
  const btnReload = el.querySelector("#btnReload");
  const status = el.querySelector("#status");
  const queryPreview = el.querySelector("#queryPreview");

  const kpiTotal = el.querySelector("#kpiTotal");
  const kpiAvg = el.querySelector("#kpiAvg");
  const kpiVol = el.querySelector("#kpiVol");
  const kpiN = el.querySelector("#kpiN");

  const seriesBody = el.querySelector("#seriesBody");

  const chart = el.querySelector("#chart");
  const chartEmpty = el.querySelector("#chartEmpty");
  const tooltip = el.querySelector("#tooltip");
  const tipDate = el.querySelector("#tipDate");
  const tipValue = el.querySelector("#tipValue");

  // =========================
  //  PRODUCTS (combobox)
  // =========================
  let products = [];

  function productOptionsHtml(selectedId, filterText = "") {
    if (!products.length) return `<option value="">(Sin productos)</option>`;

    const f = filterText.trim().toLowerCase();

    const filtered = !f
      ? products
      : products.filter((p) => {
          const label = `${p.product_name || ""} ${p.category_off || ""}`.toLowerCase();
          return label.includes(f);
        });

    return [
      `<option value="">Selecciona...</option>`,
      ...filtered.map((p) => {
        const sel = Number(selectedId) === Number(p.id) ? "selected" : "";
        const label = `${p.product_name}${p.category_off ? ` · ${p.category_off}` : ""}`;
        return `<option value="${p.id}" ${sel}>${escapeHtml(label)}</option>`;
      }),
    ].join("");
  }

  async function fetchProducts() {
    status.textContent = "Cargando productos...";
    btnReload.disabled = true;
    btnRun.disabled = true;

    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || "Error al cargar productos");

      products = Array.isArray(data) ? data : [];

      // re-render select
      productId.innerHTML = productOptionsHtml(productId.value, productSearch.value);
      status.textContent = `Productos cargados: ${products.length}.`;
    } catch (err) {
      console.error(err);
      products = [];
      productId.innerHTML = `<option value="">(Error al cargar)</option>`;
      status.textContent = `Error: ${err.message}`;
    } finally {
      btnReload.disabled = false;
      btnRun.disabled = false;
      updatePreview();
    }
  }

  // =========================
  //  QUERY + UI
  // =========================
  function buildQuery() {
    const pid = productId.value ? Number(productId.value) : null;
    return {
      product_id: pid,
      range: range.value,
      metric: metric.value,
      unit: unit.value,
    };
  }

  function updatePreview() {
    queryPreview.textContent = JSON.stringify(buildQuery(), null, 2);
  }

  function setLoading(on) {
    btnRun.disabled = on;
    btnReload.disabled = on;
    btnRun.textContent = on ? "Cargando..." : "Ver estadísticas";
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(2);
  }

  function renderSeries(series) {
    seriesBody.innerHTML = series.length
      ? series
          .map(
            (p) => `
            <tr>
              <td>${escapeHtml(p.date)}</td>
              <td>${Number(p.value).toFixed(3)}</td>
            </tr>
          `
          )
          .join("")
      : `<tr><td colspan="2" class="muted">Sin datos.</td></tr>`;
  }

  // =========================
  //  GRÁFICA SVG (sin libs)
  // =========================
  function clearChart() {
    chart.innerHTML = "";
    chart.appendChild(chartEmpty);
    chartEmpty.style.display = "inline";
    tooltip.style.transform = "translate(-9999px,-9999px)";
  }

  function renderChart(series) {
    chart.innerHTML = "";
    chartEmpty.style.display = "none";

    if (!series?.length) return clearChart();

    const W = chart.clientWidth || 900;
    const H = chart.clientHeight || 320;
    const pad = 28;

    const values = series.map((p) => Number(p.value) || 0);
    let minV = Math.min(...values);
    let maxV = Math.max(...values);
    if (minV === maxV) {
      maxV = minV + 1;
      minV = Math.max(0, minV - 1);
    }

    const xScale = (i) =>
      series.length === 1 ? pad : pad + (i * (W - pad * 2)) / (series.length - 1);
    const yScale = (v) =>
      H - pad - ((v - minV) / (maxV - minV)) * (H - pad * 2);

    const xAxisTitle = "Fecha";
    const yAxisTitle =
      metric.value === "revenue"
        ? `Ingresos (${unit.value})`
        : `Ventas (${unit.value})`;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const makeHLine = (y) => {
      const ln = document.createElementNS(svg.namespaceURI, "line");
      ln.setAttribute("x1", pad);
      ln.setAttribute("x2", W - pad);
      ln.setAttribute("y1", y);
      ln.setAttribute("y2", y);
      ln.setAttribute("stroke", "rgba(255,255,255,.08)");
      return ln;
    };
    svg.appendChild(makeHLine(yScale(minV)));
    svg.appendChild(makeHLine(yScale((minV + maxV) / 2)));

    const d = series
      .map((p, i) => {
        const x = xScale(i);
        const y = yScale(Number(p.value) || 0);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,.75)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    series.forEach((p, i) => {
      const x = xScale(i);
      const y = yScale(Number(p.value) || 0);

      const dot = document.createElementNS(svg.namespaceURI, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", "3.2");
      dot.setAttribute("fill", "rgba(255,255,255,.9)");
      svg.appendChild(dot);

      const hit = document.createElementNS(svg.namespaceURI, "circle");
      hit.setAttribute("cx", x);
      hit.setAttribute("cy", y);
      hit.setAttribute("r", "10");
      hit.setAttribute("fill", "transparent");
      hit.style.cursor = "crosshair";

      hit.addEventListener("mousemove", (ev) => {
        tipDate.textContent = p.date;
        tipValue.textContent = `Valor: ${Number(p.value).toFixed(3)}`;
        const rect = chart.getBoundingClientRect();
        tooltip.style.transform = `translate(${ev.clientX - rect.left + 12}px, ${
          ev.clientY - rect.top + 12
        }px)`;
      });
      hit.addEventListener("mouseleave", () => {
        tooltip.style.transform = "translate(-9999px,-9999px)";
      });

      svg.appendChild(hit);
    });

    const mkText = (x, y, text, opacity = ".55") => {
      const t = document.createElementNS(svg.namespaceURI, "text");
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.setAttribute("fill", `rgba(255,255,255,${opacity})`);
      t.setAttribute("font-size", "11");
      t.textContent = text;
      return t;
    };
    svg.appendChild(mkText(pad, H - 10, `min: ${minV.toFixed(2)}`));
    svg.appendChild(mkText(pad, 16, `max: ${maxV.toFixed(2)}`));

    // títulos de ejes
    const yTitle = document.createElementNS(svg.namespaceURI, "text");
    yTitle.setAttribute("x", 12);
    yTitle.setAttribute("y", H / 2);
    yTitle.setAttribute("fill", "rgba(255,255,255,.7)");
    yTitle.setAttribute("font-size", "12");
    yTitle.setAttribute("text-anchor", "middle");
    yTitle.setAttribute("transform", `rotate(-90 12 ${H / 2})`);
    yTitle.textContent = yAxisTitle;
    svg.appendChild(yTitle);

    const xTitle = document.createElementNS(svg.namespaceURI, "text");
    xTitle.setAttribute("x", W / 2);
    xTitle.setAttribute("y", H - 4);
    xTitle.setAttribute("fill", "rgba(255,255,255,.7)");
    xTitle.setAttribute("font-size", "12");
    xTitle.setAttribute("text-anchor", "middle");
    xTitle.textContent = xAxisTitle;
    svg.appendChild(xTitle);

    chart.appendChild(svg);
  }

  // re-render al cambiar tamaño
  let lastSeriesForChart = [];
  const ro = new ResizeObserver(() => {
    if (lastSeriesForChart?.length) renderChart(lastSeriesForChart);
  });
  ro.observe(chart);

  async function fetchStats() {
    const q = buildQuery();
    if (!q.product_id) {
      status.textContent = "⚠️ Selecciona un producto.";
      return;
    }

    const params = new URLSearchParams();
    params.set("product_id", String(q.product_id));
    params.set("range", q.range);
    params.set("metric", q.metric);
    params.set("unit", q.unit);

    setLoading(true);
    status.textContent = "Consultando backend...";

    try {
      const res = await fetch(`${API_URL}/stats/product?${params.toString()}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.detail || `Error HTTP ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : "Error");
      }

      kpiTotal.textContent = fmt(Number(data.total));
      kpiAvg.textContent = fmt(Number(data.avg_per_day));
      kpiVol.textContent = fmt(Number(data.volatility));
      kpiN.textContent = String(Array.isArray(data.series) ? data.series.length : 0);

      const series = Array.isArray(data.series) ? data.series : [];
      renderSeries(series);

      lastSeriesForChart = series;
      renderChart(series);

      status.textContent = `${data.product_name} (${data.unit}) · ${data.metric} · ${data.range}`;
    } catch (err) {
      console.error(err);
      status.textContent = `${err.message}`;
      kpiTotal.textContent = "—";
      kpiAvg.textContent = "—";
      kpiVol.textContent = "—";
      kpiN.textContent = "—";
      renderSeries([]);
      lastSeriesForChart = [];
      clearChart();
    } finally {
      setLoading(false);
    }
  }

  productSearch.addEventListener("input", () => {
    const current = productId.value;
    productId.innerHTML = productOptionsHtml(current, productSearch.value);
    updatePreview();
  });

  productId.addEventListener("change", updatePreview);

  btnRun.addEventListener("click", fetchStats);
  btnReload.addEventListener("click", () => {
    fetchProducts();
  });

  btnClear.addEventListener("click", () => {
    productSearch.value = "";
    productId.value = "";
    range.value = "30d";
    metric.value = "sales";
    unit.value = "piece";
    status.textContent = "Listo.";
    kpiTotal.textContent = "—";
    kpiAvg.textContent = "—";
    kpiVol.textContent = "—";
    kpiN.textContent = "—";
    renderSeries([]);
    lastSeriesForChart = [];
    clearChart();
    updatePreview();
  });

  range.addEventListener("change", updatePreview);
  metric.addEventListener("change", updatePreview);
  unit.addEventListener("change", updatePreview);

  updatePreview();
  clearChart();
  fetchProducts(); 

  return el;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

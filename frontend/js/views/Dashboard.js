export function DashboardView() {
  const el = document.createElement("section");
  el.className = "view active";

  const API_URL = "http://127.0.0.1:8000";

  el.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="view-header" style="margin-bottom:10px;">
          <div>
            <h3>KPIs de hoy</h3>
            <p class="muted" id="status">Listo.</p>
          </div>
          <div class="view-header-actions">
            <button class="btn secondary" type="button" id="btnRefresh">Actualizar</button>
            <button class="btn secondary" type="button" data-go="ventas-nueva">Nueva venta</button>
            <button class="btn secondary" type="button" data-go="inventario">Inventario</button>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi">
            <div class="label">Ventas (MXN)</div>
            <div class="value" id="kpiSales">$0.00</div>
          </div>
          <div class="kpi">
            <div class="label">Tickets</div>
            <div class="value" id="kpiTickets">0</div>
          </div>
          <div class="kpi">
            <div class="label">Productos vendidos</div>
            <div class="value" id="kpiItems">0</div>
          </div>
        </div>
      </div>

      <div class="card span-12">
        <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:10px;">
          <div>
            <h3>Tendencia de ventas</h3>
            <p class="muted">Últimos días (MXN)</p>
          </div>
          <select id="trendDays" class="btn secondary" style="padding:10px 12px;">
            <option value="7" selected>7 días</option>
            <option value="14">14 días</option>
            <option value="30">30 días</option>
          </select>
        </div>

        <div id="chartWrap" style="position:relative; margin-top:12px;">
          <div id="chart" style="height:320px; border:1px dashed rgba(255,255,255,.12); border-radius:12px; overflow:hidden; position:relative;">
            <div class="muted" id="chartEmpty"
              style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
              Área de gráfica
            </div>
          </div>

          <div id="tooltip"
              class="card soft"
              style="position:absolute; left:0; top:0; transform:translate(-9999px,-9999px);
                     pointer-events:none; padding:8px 10px; border-radius:10px; font-size:12px;">
            <div class="muted" id="tipDate">—</div>
            <div id="tipValue" style="font-weight:700;">—</div>
          </div>

          <!-- Titulos de ejes (solo texto UI) -->
          <div
            class="muted"
            style="position:absolute; left:10px; top:10px; font-size:12px; pointer-events:none;"
            id="chartTitleY"
          >
            Eje Y: Ventas (MXN)
          </div>

          <div
            class="muted"
            style="position:absolute; right:10px; bottom:8px; font-size:12px; pointer-events:none;"
            id="chartTitleX"
          >
            Eje X: Fecha
          </div>
        </div>
      </div>
    </div>
  `;

  // navegación
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) window.location.hash = `#/${go.dataset.go}`;
  });

  const status = el.querySelector("#status");
  const btnRefresh = el.querySelector("#btnRefresh");

  const kpiSales = el.querySelector("#kpiSales");
  const kpiTickets = el.querySelector("#kpiTickets");
  const kpiItems = el.querySelector("#kpiItems");

  const trendDays = el.querySelector("#trendDays");
  const chart = el.querySelector("#chart");
  const chartEmpty = el.querySelector("#chartEmpty");
  const tooltip = el.querySelector("#tooltip");
  const tipDate = el.querySelector("#tipDate");
  const tipValue = el.querySelector("#tipValue");

  // nuevos: labels de ejes
  const chartTitleY = el.querySelector("#chartTitleY");
  const chartTitleX = el.querySelector("#chartTitleX");

  let lastTrend = [];

  function moneyMXN(n) {
    const v = Number(n);
    return Number.isFinite(v) ? `$${v.toFixed(2)}` : "—";
  }

  function setLoading(on) {
    btnRefresh.disabled = on;
    trendDays.disabled = on;
    status.textContent = on ? "Cargando..." : "Listo.";
  }

  function clearChart() {
    chart.innerHTML = "";
    chart.appendChild(chartEmpty);
    chartEmpty.style.display = "flex";
    tooltip.style.transform = "translate(-9999px,-9999px)";
  }

  function renderTrend(series) {
    if (!Array.isArray(series) || !series.length) return clearChart();

    chartEmpty.style.display = "none";
    chart.innerHTML = "";

    const W = chart.clientWidth || 900;
    const H = chart.clientHeight || 320;
    const pad = 40;

    const values = series.map((p) => Number(p.value) || 0);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);

    const x = (i) => pad + (i * (W - pad * 2)) / (series.length - 1 || 1);
    const y = (v) =>
      H - pad - ((v - minV) / (maxV - minV || 1)) * (H - pad * 2);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const d = series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`)
      .join(" ");

    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,.85)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    series.forEach((p, i) => {
      const cx = x(i);
      const cy = y(p.value);

      const dot = document.createElementNS(svg.namespaceURI, "circle");
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);
      dot.setAttribute("r", "3");
      dot.setAttribute("fill", "#fff");
      svg.appendChild(dot);

      dot.addEventListener("mousemove", (ev) => {
        tipDate.textContent = p.date;
        tipValue.textContent = moneyMXN(p.value);
        const r = chart.getBoundingClientRect();
        tooltip.style.transform =
          `translate(${ev.clientX - r.left + 12}px, ${ev.clientY - r.top + 12}px)`;
      });

      dot.addEventListener("mouseleave", () => {
        tooltip.style.transform = "translate(-9999px,-9999px)";
      });
    });

    chart.appendChild(svg);
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Error");
    return data;
  }

  async function refreshAll() {
    setLoading(true);
    const days = Number(trendDays.value) || 7;

    try {
      const summary = await fetchJSON(`${API_URL}/dashboard/summary`);
      const trend = await fetchJSON(`${API_URL}/dashboard/trend?days=${days}`);

      kpiSales.textContent = moneyMXN(summary.sales_mxn);
      kpiTickets.textContent = summary.tickets;
      kpiItems.textContent = summary.items_sold;

      // actualizar titulos (por si quieres cambiar texto segun rango)
      chartTitleY.textContent = "Eje Y: Ventas (MXN)";
      chartTitleX.textContent = "Eje X: Fecha";

      lastTrend = trend;
      renderTrend(trend);

      status.textContent = `OK · ${summary.date}`;
    } catch (err) {
      console.error(err);
      status.textContent = "Error al cargar dashboard";
      clearChart();
    } finally {
      setLoading(false);
    }
  }

  const ro = new ResizeObserver(() => {
    if (lastTrend.length) renderTrend(lastTrend);
  });
  ro.observe(chart);

  btnRefresh.addEventListener("click", refreshAll);
  trendDays.addEventListener("change", refreshAll);

  refreshAll();
  return el;
}

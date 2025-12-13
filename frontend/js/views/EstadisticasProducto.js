export function EstadisticasProductoView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Estadísticas por producto</h3>
          <p class="muted">Placeholder. Luego conecta a GET /stats/producto?name=&range=&metric=</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="predicciones">🔮 Ir a predicciones</button>
          <button class="btn secondary" type="button" data-go="ventas-historial">🧾 Ver ventas</button>
        </div>
      </div>

      <form class="form" id="statsForm">
        <div class="field full">
          <label>Producto</label>
          <input type="text" name="product_name" placeholder="Ej. pasta espagueti 500 g" required />
        </div>

        <div class="field">
          <label>Rango</label>
          <select name="range">
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="365d">Último año</option>
          </select>
        </div>

        <div class="field">
          <label>Métrica principal</label>
          <select name="metric">
            <option value="sales">Ventas</option>
            <option value="revenue">Ingresos</option>
            <option value="error">Error predicción</option>
          </select>
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="reset" id="btnReset">Limpiar</button>
            <button class="btn" type="submit">Ver estadísticas</button>
          </div>
        </div>
      </form>

      <div class="card soft" style="margin-top:12px;">
        <h3>Query (GET /stats/producto)</h3>
        <pre class="code" id="queryPreview">{}</pre>
      </div>

      <div class="kpis" style="margin-top:12px;">
        <div class="kpi">
          <div class="label">MAE</div>
          <div class="value" id="kpiMAE">—</div>
        </div>
        <div class="kpi">
          <div class="label">MAPE</div>
          <div class="value" id="kpiMAPE">—</div>
        </div>
        <div class="kpi">
          <div class="label">Prom. ventas/día</div>
          <div class="value" id="kpiAvg">—</div>
        </div>
        <div class="kpi">
          <div class="label">Volatilidad</div>
          <div class="value" id="kpiVol">—</div>
        </div>
      </div>

      <div class="card soft" style="margin-top:12px;">
        <h3>Gráfica (placeholder)</h3>
        <p class="muted">Luego: serie temporal (ventas/ingresos) o error vs tiempo.</p>
        <div class="placeholder-box" style="height:240px;">Área de gráfica</div>
      </div>
    </div>
  `;

  // Navegación interna
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    window.location.hash = `#/${go.dataset.go}`;
  });

  const form = el.querySelector("#statsForm");
  const preview = el.querySelector("#queryPreview");

  const kpiMAE = el.querySelector("#kpiMAE");
  const kpiMAPE = el.querySelector("#kpiMAPE");
  const kpiAvg = el.querySelector("#kpiAvg");
  const kpiVol = el.querySelector("#kpiVol");

  function buildQuery(fd) {
    const raw = Object.fromEntries(fd.entries());
    return {
      product_name: (raw.product_name || "").trim(),
      range: raw.range || "30d",
      metric: raw.metric || "sales",
    };
  }

  function updatePreview() {
    const q = buildQuery(new FormData(form));
    preview.textContent = JSON.stringify(q, null, 2);
  }

  form.addEventListener("input", updatePreview);
  updatePreview();

  function mockStats(query) {
    // Simula lo que luego vendrá del backend
    const mae = Math.random() * 8 + 2;   // 2..10
    const mape = Math.random() * 0.25 + 0.05; // 5%..30%
    const avg = Math.random() * 12 + 1;  // 1..13
    const vol = Math.random() * 1.2 + 0.2; // 0.2..1.4

    return {
      mae,
      mape,
      avg_sales_per_day: avg,
      volatility: vol,
    };
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const query = buildQuery(new FormData(form));
    console.log("GET /stats/producto", query);

    // futuro:
    // const res = await api.getProductStats(query)
    const res = mockStats(query);

    kpiMAE.textContent = res.mae.toFixed(2);
    kpiMAPE.textContent = (res.mape * 100).toFixed(1) + "%";
    kpiAvg.textContent = res.avg_sales_per_day.toFixed(2);
    kpiVol.textContent = res.volatility.toFixed(2);

    alert("Stats generadas (placeholder)");
  });

  el.querySelector("#btnReset").addEventListener("click", () => {
    setTimeout(() => {
      updatePreview();
      kpiMAE.textContent = "—";
      kpiMAPE.textContent = "—";
      kpiAvg.textContent = "—";
      kpiVol.textContent = "—";
    }, 0);
  });

  return el;
}

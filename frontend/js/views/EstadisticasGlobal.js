export function EstadisticasGlobalView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Estadísticas globales</h3>
          <p class="muted">Placeholder. Luego conecta a GET /stats/global?range=</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="ventas-historial">🧾 Ver ventas</button>
          <button class="btn secondary" type="button" data-go="alertas">🚨 Ver alertas</button>
        </div>
      </div>

      <form class="form" id="globalForm">
        <div class="field">
          <label>Rango</label>
          <select name="range">
            <option value="7d">Últimos 7 días</option>
            <option value="30d" selected>Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="365d">Último año</option>
          </select>
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="reset" id="btnReset">Limpiar</button>
            <button class="btn" type="submit">Actualizar</button>
          </div>
        </div>
      </form>

      <div class="card soft" style="margin-top:12px;">
        <h3>Query (GET /stats/global)</h3>
        <pre class="code" id="queryPreview">{}</pre>
      </div>

      <div class="kpis" style="margin-top:12px;">
        <div class="kpi">
          <div class="label">Ingresos (rango)</div>
          <div class="value" id="kpiRevenue">—</div>
        </div>
        <div class="kpi">
          <div class="label">Tickets</div>
          <div class="value" id="kpiTickets">—</div>
        </div>
        <div class="kpi">
          <div class="label">Top categoría</div>
          <div class="value" id="kpiTopCat">—</div>
        </div>
        <div class="kpi">
          <div class="label">% Perecederos vendidos</div>
          <div class="value" id="kpiPerishPct">—</div>
        </div>
      </div>

      <div class="grid" style="margin-top:12px;">
        <div class="card span-7 soft">
          <h3>Ventas / Ingresos por día (placeholder)</h3>
          <p class="muted">Luego: serie temporal.</p>
          <div class="placeholder-box" style="height:240px;">Área de gráfica</div>
        </div>

        <div class="card span-5 soft">
          <h3>Top 5 productos (placeholder)</h3>
          <p class="muted">Luego: tabla o barras.</p>

          <table class="mini">
            <thead><tr><th>Producto</th><th>Ventas</th></tr></thead>
            <tbody id="topBody"></tbody>
          </table>
        </div>

        <div class="card span-12 soft">
          <h3>Participación por categoría (placeholder)</h3>
          <p class="muted">Luego: pastel/barras.</p>
          <div class="placeholder-box" style="height:220px;">Área de gráfica</div>
        </div>
      </div>
    </div>
  `;

  // Navegación interna
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    window.location.hash = `#/${go.dataset.go}`;
  });

  const form = el.querySelector("#globalForm");
  const preview = el.querySelector("#queryPreview");

  const kpiRevenue = el.querySelector("#kpiRevenue");
  const kpiTickets = el.querySelector("#kpiTickets");
  const kpiTopCat = el.querySelector("#kpiTopCat");
  const kpiPerishPct = el.querySelector("#kpiPerishPct");
  const topBody = el.querySelector("#topBody");

  function buildQuery(fd) {
    const raw = Object.fromEntries(fd.entries());
    return { range: raw.range || "30d" };
  }

  function updatePreview() {
    preview.textContent = JSON.stringify(buildQuery(new FormData(form)), null, 2);
  }

  function renderTop(list) {
    topBody.innerHTML = list.map(x => `
      <tr>
        <td>${escapeHtml(x.product_name)}</td>
        <td><strong>${Number(x.sales || 0)}</strong></td>
      </tr>
    `).join("");

    if (!list.length) {
      topBody.innerHTML = `<tr><td colspan="2" class="muted">Sin datos.</td></tr>`;
    }
  }

  function mockGlobal(range) {
    const revenue = Math.random() * 25000 + 5000;
    const tickets = Math.round(Math.random() * 800 + 50);
    const cats = ["frutas-verduras", "abarrotes", "hogar", "bebidas"];
    const topCat = cats[Math.floor(Math.random() * cats.length)];
    const perishPct = Math.random() * 0.5 + 0.2; // 20%..70%

    const top = [
      { product_name: "naranja 1 kg", sales: Math.round(Math.random() * 150 + 20) },
      { product_name: "pasta espagueti 500 g", sales: Math.round(Math.random() * 150 + 20) },
      { product_name: "tamarindo 1 kg", sales: Math.round(Math.random() * 150 + 20) },
      { product_name: "vasos desechables 50 pzas", sales: Math.round(Math.random() * 150 + 20) },
      { product_name: "tejocotes 1 kg", sales: Math.round(Math.random() * 150 + 20) },
    ];

    return { revenue, tickets, topCat, perishPct, top };
  }

  form.addEventListener("input", updatePreview);
  updatePreview();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = buildQuery(new FormData(form));
    console.log("GET /stats/global", q);

    // futuro:
    // const res = await api.getGlobalStats(q)
    const res = mockGlobal(q.range);

    kpiRevenue.textContent = `$${res.revenue.toFixed(2)}`;
    kpiTickets.textContent = String(res.tickets);
    kpiTopCat.textContent = res.topCat;
    kpiPerishPct.textContent = (res.perishPct * 100).toFixed(1) + "%";

    renderTop(res.top);
    alert("Stats globales actualizadas (placeholder)");
  });

  el.querySelector("#btnReset").addEventListener("click", () => {
    setTimeout(() => {
      updatePreview();
      kpiRevenue.textContent = "—";
      kpiTickets.textContent = "—";
      kpiTopCat.textContent = "—";
      kpiPerishPct.textContent = "—";
      renderTop([]);
    }, 0);
  });

  // init
  renderTop([]);
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

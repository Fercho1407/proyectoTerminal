export function AlertasView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Alertas inteligentes</h3>
          <p class="muted">Placeholder. Luego conecta a GET /alertas</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="inventario">📦 Ver inventario</button>
          <button class="btn secondary" type="button" id="btnReload">🔄 Recargar</button>
        </div>
      </div>

      <div class="form">
        <div class="field full">
          <label>Buscar</label>
          <input type="text" id="q" placeholder="Nombre, categoría..." />
        </div>
        <div class="field">
          <label>Umbral “Crítico”</label>
          <input type="number" id="criticalThreshold" min="0" value="3" />
        </div>
        <div class="field">
          <label>Umbral “Reorden”</label>
          <input type="number" id="reorderThreshold" min="0" value="10" />
        </div>
      </div>

      <div class="alerts-grid">
        <div class="card alert badish">
          <div class="alert-title">
            <h3>🔴 Stock crítico</h3>
            <span class="tag bad" id="countCritical">0</span>
          </div>
          <p class="muted">Productos con stock ≤ crítico</p>

          <table class="mini">
            <thead><tr><th>Producto</th><th>Stock</th><th></th></tr></thead>
            <tbody id="criticalBody"></tbody>
          </table>
        </div>

        <div class="card alert warnish">
          <div class="alert-title">
            <h3>🟡 Reorden sugerido</h3>
            <span class="tag warn" id="countReorder">0</span>
          </div>
          <p class="muted">Productos con stock ≤ reorden (pero no críticos)</p>

          <table class="mini">
            <thead><tr><th>Producto</th><th>Stock</th><th></th></tr></thead>
            <tbody id="reorderBody"></tbody>
          </table>
        </div>

        <div class="card alert goodish">
          <div class="alert-title">
            <h3>🟢 En temporada</h3>
            <span class="tag good" id="countSeason">0</span>
          </div>
          <p class="muted">Productos marcados como “temporada” (placeholder)</p>

          <table class="mini">
            <thead><tr><th>Producto</th><th>Motivo</th><th></th></tr></thead>
            <tbody id="seasonBody"></tbody>
          </table>
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

  // Mock (luego: lo reemplazas con fetch GET /alertas)
  // Nota: aquí usamos stock + flags para simular "temporada"
  let inventory = [
    { id: 1, product_name: "naranja 1 kg", category: "frutas-verduras", stock: 12, in_season: true, season_reason: "Ponche (diciembre)" },
    { id: 2, product_name: "pasta espagueti 500 g", category: "abarrotes", stock: 40, in_season: false },
    { id: 3, product_name: "tamarindo 1 kg", category: "frutas-verduras", stock: 2, in_season: true, season_reason: "Ponche (diciembre)" },
    { id: 4, product_name: "vasos desechables 50 pzas", category: "hogar", stock: 7, in_season: true, season_reason: "Posadas / reuniones" },
    { id: 5, product_name: "tejocotes 1 kg", category: "frutas-verduras", stock: 1, in_season: true, season_reason: "Ponche (diciembre)" },
  ];

  const q = el.querySelector("#q");
  const criticalInput = el.querySelector("#criticalThreshold");
  const reorderInput = el.querySelector("#reorderThreshold");
  const btnReload = el.querySelector("#btnReload");

  const criticalBody = el.querySelector("#criticalBody");
  const reorderBody = el.querySelector("#reorderBody");
  const seasonBody = el.querySelector("#seasonBody");

  const countCritical = el.querySelector("#countCritical");
  const countReorder = el.querySelector("#countReorder");
  const countSeason = el.querySelector("#countSeason");

  function render() {
    const term = (q.value || "").trim().toLowerCase();
    const critical = Number(criticalInput.value || 3);
    const reorder = Number(reorderInput.value || 10);

    let rows = inventory;

    if (term) {
      rows = rows.filter(r =>
        (r.product_name || "").toLowerCase().includes(term) ||
        (r.category || "").toLowerCase().includes(term)
      );
    }

    const criticalRows = rows.filter(r => Number(r.stock || 0) <= critical);
    const reorderRows = rows.filter(r => {
      const s = Number(r.stock || 0);
      return s > critical && s <= reorder;
    });
    const seasonRows = rows.filter(r => r.in_season);

    countCritical.textContent = String(criticalRows.length);
    countReorder.textContent = String(reorderRows.length);
    countSeason.textContent = String(seasonRows.length);

    criticalBody.innerHTML = buildStockRows(criticalRows, "inventario");
    reorderBody.innerHTML = buildStockRows(reorderRows, "inventario");
    seasonBody.innerHTML = buildSeasonRows(seasonRows, "estadisticas-producto"); // placeholder

    if (!criticalRows.length) criticalBody.innerHTML = emptyRow(3, "Sin productos críticos.");
    if (!reorderRows.length) reorderBody.innerHTML = emptyRow(3, "Sin productos para reorden.");
    if (!seasonRows.length) seasonBody.innerHTML = emptyRow(3, "Sin productos en temporada.");
  }

  function buildStockRows(list, goTo) {
    return list.map(r => `
      <tr>
        <td>${escapeHtml(r.product_name)}</td>
        <td><strong>${Number(r.stock || 0)}</strong></td>
        <td class="td-right">
          <button class="btn secondary mini-btn" type="button" data-go="${goTo}">Ver</button>
        </td>
      </tr>
    `).join("");
  }

  function buildSeasonRows(list, goTo) {
    return list.map(r => `
      <tr>
        <td>${escapeHtml(r.product_name)}</td>
        <td>${escapeHtml(r.season_reason || "Temporada")}</td>
        <td class="td-right">
          <button class="btn secondary mini-btn" type="button" data-go="${goTo}">Ver</button>
        </td>
      </tr>
    `).join("");
  }

  function emptyRow(cols, text) {
    return `<tr><td colspan="${cols}" class="muted">${text}</td></tr>`;
  }

  q.addEventListener("input", render);
  criticalInput.addEventListener("input", render);
  reorderInput.addEventListener("input", render);

  btnReload.addEventListener("click", () => {
    alert("Recargar (placeholder). Luego hará GET /alertas");
    render();
  });

  render();
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

export function InventarioView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Inventario (stock actual)</h3>
          <p class="muted">Placeholder. Luego conecta a GET /inventario y PATCH stock.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" id="btnReload">🔄 Recargar</button>
          <button class="btn secondary" type="button" data-go="productos-nuevo">➕ Alta producto</button>
        </div>
      </div>

      <div class="form">
        <div class="field full">
          <label>Buscar</label>
          <input type="text" id="q" placeholder="Nombre, categoría..." />
        </div>

        <div class="field">
          <label>Umbral “Bajo”</label>
          <input type="number" id="lowThreshold" min="0" value="10" />
        </div>

        <div class="field">
          <label>Umbral “Crítico”</label>
          <input type="number" id="criticalThreshold" min="0" value="3" />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Perecedero</th>
            <th>Stock</th>
            <th>Estado</th>
            <th style="width: 260px;">Ajuste rápido</th>
          </tr>
        </thead>
        <tbody id="invBody"></tbody>
      </table>
    </div>
  `;

  // Navegación interna
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    window.location.hash = `#/${go.dataset.go}`;
  });

  // Mock (luego: GET /inventario)
  let items = [
    { id: 1, product_name: "naranja 1 kg", category: "frutas-verduras", perishable: true, stock: 12 },
    { id: 2, product_name: "pasta espagueti 500 g", category: "abarrotes", perishable: false, stock: 40 },
    { id: 3, product_name: "tamarindo 1 kg", category: "frutas-verduras", perishable: true, stock: 2 },
    { id: 4, product_name: "vasos desechables 50 pzas", category: "hogar", perishable: false, stock: 7 },
  ];

  const tbody = el.querySelector("#invBody");
  const q = el.querySelector("#q");
  const lowInput = el.querySelector("#lowThreshold");
  const critInput = el.querySelector("#criticalThreshold");
  const btnReload = el.querySelector("#btnReload");

  function statusFor(stock, low, critical) {
    if (stock <= critical) return { label: "Crítico", cls: "bad", icon: "🔴" };
    if (stock <= low) return { label: "Bajo", cls: "warn", icon: "🟡" };
    return { label: "OK", cls: "good", icon: "🟢" };
  }

  function renderRows(rows) {
    const low = Number(lowInput.value || 10);
    const critical = Number(critInput.value || 3);

    tbody.innerHTML = rows.map(it => {
      const s = statusFor(Number(it.stock || 0), low, critical);

      return `
        <tr>
          <td>${escapeHtml(it.product_name)}</td>
          <td>${escapeHtml(it.category || "—")}</td>
          <td>${it.perishable ? '<span class="tag warn">Sí</span>' : '<span class="tag">No</span>'}</td>
          <td><strong>${Number(it.stock || 0)}</strong></td>
          <td><span class="tag ${s.cls}">${s.icon} ${s.label}</span></td>
          <td>
            <div class="qty">
              <button class="btn secondary" type="button" data-action="dec" data-id="${it.id}">-1</button>
              <button class="btn secondary" type="button" data-action="inc" data-id="${it.id}">+1</button>
              <button class="btn secondary" type="button" data-action="set" data-id="${it.id}">Set…</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Sin resultados.</td></tr>`;
    }
  }

  function applyFilter() {
    const term = (q.value || "").trim().toLowerCase();
    const filtered = !term ? items : items.filter(it =>
      (it.product_name || "").toLowerCase().includes(term) ||
      (it.category || "").toLowerCase().includes(term)
    );
    renderRows(filtered);
  }

  q.addEventListener("input", applyFilter);
  lowInput.addEventListener("input", applyFilter);
  critInput.addEventListener("input", applyFilter);

  btnReload.addEventListener("click", () => {
    alert("Recargar (placeholder). Luego hará GET /inventario");
    applyFilter();
  });

  // Delegación de eventos para ajuste rápido
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const item = items.find(x => x.id === id);
    if (!item) return;

    const action = btn.dataset.action;

    if (action === "inc") {
      item.stock = Number(item.stock || 0) + 1;
      // placeholder: PATCH stock
      console.log("PATCH stock +1", { id, stock: item.stock });
      applyFilter();
      return;
    }

    if (action === "dec") {
      item.stock = Math.max(0, Number(item.stock || 0) - 1);
      console.log("PATCH stock -1", { id, stock: item.stock });
      applyFilter();
      return;
    }

    if (action === "set") {
      const current = Number(item.stock || 0);
      const next = prompt("Nuevo stock:", String(current));
      if (next === null) return;
      const n = Number(next);
      if (!Number.isFinite(n) || n < 0) {
        alert("Stock inválido");
        return;
      }
      item.stock = Math.floor(n);
      console.log("PATCH stock set", { id, stock: item.stock });
      applyFilter();
    }
  });

  // inicial
  renderRows(items);
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

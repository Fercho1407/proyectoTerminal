export function InventarioView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Inventario (stock actual)</h3>
          <p class="muted" id="status">Cargando...</p>
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
            <th>Unidad</th>
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

  const API_URL = "http://127.0.0.1:8000";

  // items vendrán del backend: GET /inventory/stock
  // cada fila es: { product_id, product_name, category_off, perecedero, unit, stock_actual }
  let items = [];

  const tbody = el.querySelector("#invBody");
  const q = el.querySelector("#q");
  const lowInput = el.querySelector("#lowThreshold");
  const critInput = el.querySelector("#criticalThreshold");
  const btnReload = el.querySelector("#btnReload");
  const statusEl = el.querySelector("#status");

  function statusFor(stock, low, critical) {
    if (stock <= critical) return { label: "Crítico", cls: "bad", icon: "🔴" };
    if (stock <= low) return { label: "Bajo", cls: "warn", icon: "🟡" };
    return { label: "OK", cls: "good", icon: "🟢" };
  }

  function normalizeFromApi(r) {
    return {
      // IMPORTANTE: stock está por producto + unidad
      key: `${r.product_id}__${r.unit}`, // id único por fila
      product_id: r.product_id,
      product_name: r.product_name,
      category: r.category_off,
      perishable: Number(r.perecedero) === 1,
      unit: r.unit,
      stock: Number(r.stock_actual ?? 0),
      _raw: r,
    };
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
          <td><span class="tag">${escapeHtml(it.unit)}</span></td>
          <td><strong>${Number(it.stock || 0)}</strong></td>
          <td><span class="tag ${s.cls}">${s.icon} ${s.label}</span></td>
          <td>
            <div class="qty">
              <button class="btn secondary" type="button" data-action="dec" data-key="${it.key}">-1</button>
              <button class="btn secondary" type="button" data-action="inc" data-key="${it.key}">+1</button>
              <button class="btn secondary" type="button" data-action="set" data-key="${it.key}">Set…</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">Sin resultados.</td></tr>`;
    }
  }

  function applyFilter() {
    const term = (q.value || "").trim().toLowerCase();
    const filtered = !term ? items : items.filter(it =>
      (it.product_name || "").toLowerCase().includes(term) ||
      (it.category || "").toLowerCase().includes(term) ||
      (it.unit || "").toLowerCase().includes(term)
    );
    renderRows(filtered);
  }

  async function fetchStock() {
    statusEl.textContent = "Cargando inventario...";
    btnReload.disabled = true;

    try {
      const res = await fetch(`${API_URL}/inventory/stock`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.detail || `Error HTTP ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : "Error al cargar inventario");
      }

      items = Array.isArray(data) ? data.map(normalizeFromApi) : [];
      statusEl.textContent = `Listo: ${items.length} fila(s) de inventario.`;
      applyFilter();
    } catch (err) {
      console.error(err);
      statusEl.textContent = `❌ ${err.message}`;
      items = [];
      applyFilter();
    } finally {
      btnReload.disabled = false;
    }
  }

  async function postMovement(payload) {
    const res = await fetch(`${API_URL}/inventory/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const detail = data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map(d => d?.msg).filter(Boolean).join(" | ")
            : `Error HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  q.addEventListener("input", applyFilter);
  lowInput.addEventListener("input", applyFilter);
  critInput.addEventListener("input", applyFilter);
  btnReload.addEventListener("click", fetchStock);

  // Ajuste rápido (ahora manda movimientos reales)
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const key = btn.dataset.key;
    const item = items.find(x => x.key === key);
    if (!item) return;

    const action = btn.dataset.action;

    // helpers: deshabilitar el botón mientras manda request
    async function runWithDisable(fn) {
      btn.disabled = true;
      try { await fn(); } finally { btn.disabled = false; }
    }

    if (action === "inc") {
      // IN +1
      await runWithDisable(async () => {
        await postMovement({
          product_id: item.product_id,
          type: "IN",
          qty: 1,
          unit: item.unit,
          reason: "Ajuste rápido +1",
        });
        await fetchStock();
      });
      return;
    }

    if (action === "dec") {
      // OUT +1 (equivale a restar 1)
      if (Number(item.stock || 0) <= 0) return;

      await runWithDisable(async () => {
        await postMovement({
          product_id: item.product_id,
          type: "OUT",
          qty: 1,
          unit: item.unit,
          reason: "Ajuste rápido -1",
        });
        await fetchStock();
      });
      return;
    }

    if (action === "set") {
      const current = Number(item.stock || 0);
      const next = prompt(`Nuevo stock para "${item.product_name}" (${item.unit}):`, String(current));
      if (next === null) return;

      const target = Number(next);
      if (!Number.isFinite(target) || target < 0) {
        alert("Stock inválido");
        return;
      }

      const diff = target - current;
      if (diff === 0) return;

      await runWithDisable(async () => {
        if (diff > 0) {
          // ADJUST positivo (sube stock)
          await postMovement({
            product_id: item.product_id,
            type: "ADJUST",
            qty: diff,
            unit: item.unit,
            reason: `Set stock a ${target}`,
          });
        } else {
          // como qty debe ser >0, para bajar usamos OUT por la diferencia
          await postMovement({
            product_id: item.product_id,
            type: "OUT",
            qty: Math.abs(diff),
            unit: item.unit,
            reason: `Set stock a ${target}`,
          });
        }
        await fetchStock();
      });
    }
  });

  // inicial
  fetchStock();
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

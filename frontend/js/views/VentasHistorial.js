export function VentasHistorialView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Historial de ventas</h3>
          <p class="muted" id="status">Listo.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="ventas-nueva">🛒 Nueva venta</button>
          <button class="btn secondary" type="button" id="btnExport">⬇️ Exportar CSV</button>
        </div>
      </div>

      <div class="form">
        <div class="field">
          <label>Desde</label>
          <input type="date" name="from" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input type="date" name="to" />
        </div>

        <div class="field full">
          <label>Producto</label>
          <select name="product_id" id="productSelect">
            <option value="">(Todos)</option>
          </select>
          <p class="muted" style="margin-top:6px;">Tip: si dejas “(Todos)” traerá todas las ventas.</p>
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="button" id="btnClear">Limpiar</button>
            <button class="btn" type="button" id="btnApply">Aplicar filtros</button>
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
        <tbody id="ventasBody"></tbody>
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

  const status = el.querySelector("#status");
  const tbody = el.querySelector("#ventasBody");

  const fromInput = el.querySelector('input[name="from"]');
  const toInput = el.querySelector('input[name="to"]');
  const productSelect = el.querySelector("#productSelect");

  const btnApply = el.querySelector("#btnApply");
  const btnClear = el.querySelector("#btnClear");
  const btnExport = el.querySelector("#btnExport");

  let currentRows = [];
  let products = [];

  function money(n) {
    const v = Number(n);
    return Number.isFinite(v) ? `$${v.toFixed(2)}` : "$0.00";
  }

  function fmtQty(qty, unit) {
    const q = Number(qty);
    if (!Number.isFinite(q)) return `— ${unit || ""}`.trim();
    const s = Math.abs(q) < 10 ? q.toFixed(3) : q.toFixed(2);
    return `${s} ${unit || ""}`.trim();
  }

  function fmtDate(isoDatetime) {
    const d = new Date(isoDatetime);
    if (Number.isNaN(d.getTime())) return String(isoDatetime ?? "");
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function renderRows(rows) {
    currentRows = Array.isArray(rows) ? rows : [];

    tbody.innerHTML = currentRows.length
      ? currentRows
          .map((r) => {
            const fecha = fmtDate(r.sold_at);
            const producto = r.product_name ?? "";
            const cantidad = fmtQty(r.qty, r.unit);
            const precio = money(r.unit_price);
            const total = money(r.subtotal);

            return `
              <tr>
                <td>${escapeHtml(fecha)}</td>
                <td>${escapeHtml(producto)}</td>
                <td>${escapeHtml(cantidad)}</td>
                <td>${escapeHtml(precio)}</td>
                <td>${escapeHtml(total)}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="5" class="muted">Sin resultados.</td></tr>`;
  }

  function setLoading(on) {
    btnApply.disabled = on;
    btnClear.disabled = on;
    btnExport.disabled = on;
    status.textContent = on ? "Cargando..." : "Listo.";
  }

  function parseApiError(data, res) {
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d?.msg).filter(Boolean).join(" | ");
    return `Error HTTP ${res.status}`;
  }

  function renderProductOptions(list) {
    const opts = [
      `<option value="">(Todos)</option>`,
      ...list.map((p) => {
        const label = `${p.product_name}${p.category_off ? ` · ${p.category_off}` : ""}`;
        return `<option value="${p.id}">${escapeHtml(label)}</option>`;
      }),
    ];
    productSelect.innerHTML = opts.join("");
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, res));
      products = Array.isArray(data) ? data : [];
      renderProductOptions(products);
    } catch (err) {
      console.error(err);
      products = [];
      renderProductOptions([]); // al menos deja (Todos)
      status.textContent = `No pude cargar productos: ${err.message}`;
    }
  }

  function buildParams() {
    const from = fromInput.value || "";
    const to = toInput.value || "";
    const product_id = productSelect.value || "";

    const hasFilters = Boolean(from || to || product_id);
    if (!hasFilters) return "";

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (product_id) params.set("product_id", product_id);

    // opcional: paginación (solo cuando filtramos)
    params.set("limit", "500");
    params.set("offset", "0");

    return `?${params.toString()}`;
  }

  async function fetchHistory() {
    const qs = buildParams();

    setLoading(true);
    status.textContent = "Consultando backend...";

    try {
      const res = await fetch(`${API_URL}/sales/history${qs}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(parseApiError(data, res));

      renderRows(Array.isArray(data) ? data : []);
      status.textContent = `Listo: ${currentRows.length} fila(s).`;
    } catch (err) {
      console.error(err);
      renderRows([]);
      status.textContent = `${err.message}`;
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!currentRows.length) {
      alert("No hay datos para exportar.");
      return;
    }

    const headers = [
      "sale_id",
      "item_id",
      "sold_at",
      "product_id",
      "product_name",
      "qty",
      "unit",
      "unit_price",
      "subtotal",
    ];

    const lines = [
      headers.join(","),
      ...currentRows.map((r) =>
        headers
          .map((h) => {
            const v = r?.[h];
            const s = v == null ? "" : String(v);
            if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
            return s;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  btnApply.addEventListener("click", fetchHistory);

  btnClear.addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    productSelect.value = "";
    fetchHistory(); // vuelve a cargar TODO
  });

  btnExport.addEventListener("click", exportCsv);

  // carga inicial: productos + TODO el historial
  fetchProducts();
  fetchHistory();

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

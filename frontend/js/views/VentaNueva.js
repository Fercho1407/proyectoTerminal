export function VentasNuevaView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Registrar nueva venta</h3>
          <p class="muted" id="status">Listo.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" id="btnReload">Cargar productos</button>
          <button class="btn secondary" type="button" id="btnAddRow">➕ Agregar item</button>
        </div>
      </div>

      <form class="form" id="saleForm">
        <div class="field">
          <label>Método de pago</label>
          <input type="text" name="payment_method" placeholder="Ej. cash, card..." />
        </div>

        <div class="field full">
          <label>Notas</label>
          <input type="text" name="notes" placeholder="Ej. venta mostrador" />
        </div>

        <div class="card soft" style="margin-top:12px;">
          <h3 style="margin:0 0 10px;">Items</h3>

          <div style="overflow:auto;">
            <table>
              <thead>
                <tr>
                  <th style="min-width:260px;">Producto</th>
                  <th style="width:110px;">Cantidad</th>
                  <th style="width:110px;">Unidad</th>
                  <th style="width:140px;">Precio unitario</th>
                  <th style="width:140px;">Subtotal</th>
                  <th style="width:90px;">Acción</th>
                </tr>
              </thead>
              <tbody id="itemsBody"></tbody>
            </table>
          </div>

          <div class="grid" style="margin-top:12px; display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
            <div class="card soft">
              <div class="muted">Total</div>
              <div style="font-size:18px;" id="kpiTotal">$0.00</div>
            </div>
            <div class="card soft">
              <div class="muted">Items</div>
              <div style="font-size:18px;" id="kpiItems">0</div>
            </div>
          </div>

          <div class="card soft" style="margin-top:12px;">
            <h3>Payload (POST /sales)</h3>
            <pre class="code" id="payloadPreview">{}</pre>
          </div>
        </div>

        <div class="field full">
          <div class="actions">
            <button type="reset" class="btn secondary" id="btnReset">Limpiar</button>
            <button type="submit" class="btn" id="btnSave">Guardar venta</button>
          </div>
        </div>
      </form>
    </div>
  `;

  const API_URL = "http://127.0.0.1:8000";

  const status = el.querySelector("#status");
  const btnReload = el.querySelector("#btnReload");
  const btnAddRow = el.querySelector("#btnAddRow");

  const form = el.querySelector("#saleForm");
  const itemsBody = el.querySelector("#itemsBody");

  const kpiTotal = el.querySelector("#kpiTotal");
  const kpiItems = el.querySelector("#kpiItems");
  const payloadPreview = el.querySelector("#payloadPreview");

  const btnSave = el.querySelector("#btnSave");
  const btnReset = el.querySelector("#btnReset");

  let products = [];

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(n) {
    const v = Number(n);
    return Number.isFinite(v) ? `$${v.toFixed(2)}` : "$0.00";
  }

  function parseApiError(data, res) {
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d?.msg).filter(Boolean).join(" | ");
    return `Error HTTP ${res.status}`;
  }

  function productOptionsHtml(selectedId) {
    if (!products.length) return `<option value="">(Cargando...)</option>`;
    return [
      `<option value="">Selecciona...</option>`,
      ...products.map((p) => {
        const sel = Number(selectedId) === Number(p.id) ? "selected" : "";
        const label = `${p.product_name}${p.category_off ? ` · ${p.category_off}` : ""}`;
        return `<option value="${p.id}" ${sel}>${escapeHtml(label)}</option>`;
      }),
    ].join("");
  }

  function rowHtml(item = {}) {
    const pid = item.product_id ?? "";
    const qty = item.qty ?? 1;
    const unit = item.unit ?? "piece";
    const price = item.unit_price ?? "";

    return `
      <tr class="sale-row">
        <td>
          <select class="inProduct" required>
            ${productOptionsHtml(pid)}
          </select>
        </td>
        <td>
          <input class="inQty" type="number" min="0.001" step="0.001" value="${escapeHtml(qty)}" required />
        </td>
        <td>
          <select class="inUnit">
            <option value="piece" ${unit === "piece" ? "selected" : ""}>piece</option>
            <option value="kg" ${unit === "kg" ? "selected" : ""}>kg</option>
            <option value="g" ${unit === "g" ? "selected" : ""}>g</option>
            <option value="pack" ${unit === "pack" ? "selected" : ""}>pack</option>
            <option value="box" ${unit === "box" ? "selected" : ""}>box</option>
            <option value="lt" ${unit === "lt" ? "selected" : ""}>lt</option>
            <option value="ml" ${unit === "ml" ? "selected" : ""}>ml</option>
          </select>
        </td>
        <td>
          <input class="inPrice" type="number" min="0" step="0.01" placeholder="Ej. 12.50" value="${escapeHtml(price)}" required />
        </td>
        <td><strong class="cellSubtotal">$0.00</strong></td>
        <td>
          <button class="btn secondary danger btnRemove" type="button">Quitar</button>
        </td>
      </tr>
    `;
  }

  function addRow(defaults) {
    itemsBody.insertAdjacentHTML("beforeend", rowHtml(defaults));
    recomputeAll();
  }

  function getRows() {
    return Array.from(itemsBody.querySelectorAll("tr.sale-row"));
  }

  function readRow(row) {
    return {
      product_id: Number(row.querySelector(".inProduct").value || 0),
      qty: Number(row.querySelector(".inQty").value || 0),
      unit: row.querySelector(".inUnit").value || "piece",
      unit_price: Number(row.querySelector(".inPrice").value || 0),
    };
  }

  function buildPayload() {
    const fd = new FormData(form);

    const payment_method = (fd.get("payment_method") || "").toString().trim();
    const notes = (fd.get("notes") || "").toString().trim();

    const items = getRows().map(readRow);

    // JSON exacto (sin total, sin subtotal, sin sold_at)
    const payload = { items };
    if (payment_method) payload.payment_method = payment_method;
    if (notes) payload.notes = notes;

    return payload;
  }

  function recomputeAll() {
    const rows = getRows();
    let total = 0;

    rows.forEach((r) => {
      const { qty, unit_price } = readRow(r);
      const sub = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unit_price) ? unit_price : 0);
      total += sub;
      r.querySelector(".cellSubtotal").textContent = money(sub);
    });

    kpiItems.textContent = String(rows.length);
    kpiTotal.textContent = money(total);
    payloadPreview.textContent = JSON.stringify(buildPayload(), null, 2);
  }

  function setLoading(on) {
    btnSave.disabled = on;
    btnReload.disabled = on;
    btnAddRow.disabled = on;
    btnSave.textContent = on ? "Guardando..." : "Guardar venta";
  }

  async function fetchProducts() {
    status.textContent = "Cargando productos...";
    btnReload.disabled = true;

    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, res));

      products = Array.isArray(data) ? data : [];
      status.textContent = `Productos cargados: ${products.length}.`;

      // refrescar selects existentes
      getRows().forEach((row) => {
        const sel = row.querySelector(".inProduct");
        const current = sel.value;
        sel.innerHTML = productOptionsHtml(current);
      });

      recomputeAll();
    } catch (err) {
      console.error(err);
      status.textContent = `❌ ${err.message}`;
      products = [];
      recomputeAll();
    } finally {
      btnReload.disabled = false;
    }
  }

  async function postSale(payload) {
    const res = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(parseApiError(data, res));
    return data;
  }

  // ===== Events =====
  btnReload.addEventListener("click", fetchProducts);
  btnAddRow.addEventListener("click", () => addRow({}));

  itemsBody.addEventListener("input", recomputeAll);
  itemsBody.addEventListener("change", recomputeAll);

  itemsBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".btnRemove");
    if (!btn) return;
    btn.closest("tr.sale-row")?.remove();
    if (!getRows().length) addRow({});
    recomputeAll();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = buildPayload();

    // validación mínima
    if (!payload.items?.length) {
      status.textContent = "Agrega al menos un item.";
      return;
    }
    for (const it of payload.items) {
      if (!it.product_id || it.product_id <= 0) {
        status.textContent = "Selecciona un producto en todos los items.";
        return;
      }
      if (!Number.isFinite(it.qty) || it.qty <= 0) {
        status.textContent = "Cantidad inválida.";
        return;
      }
      if (!Number.isFinite(it.unit_price) || it.unit_price < 0) {
        status.textContent = "Precio inválido.";
        return;
      }
    }

    try {
      setLoading(true);
      status.textContent = "Enviando venta al backend...";

      const created = await postSale(payload);
      status.textContent = `Venta registrada. ID: ${created?.id ?? "?"}`;

      form.reset();
      itemsBody.innerHTML = "";
      addRow({});
      recomputeAll();
    } catch (err) {
      console.error(err);
      status.textContent = `❌ ${err.message}`;
    } finally {
      setLoading(false);
    }
  });

  btnReset.addEventListener("click", () => {
    setTimeout(() => {
      itemsBody.innerHTML = "";
      addRow({});
      recomputeAll();
      status.textContent = "Listo.";
    }, 0);
  });

  addRow({
    product_id: 2,
    qty: 3,
    unit: "piece",
    unit_price: 12.5,
  });
  addRow({
    product_id: 1,
    qty: 1.2,
    unit: "kg",
    unit_price: 30,
  });

  recomputeAll();
  fetchProducts();

  return el;
}
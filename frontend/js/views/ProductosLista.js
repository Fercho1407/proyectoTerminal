export function ProductosListaView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Productos</h3>
          <p class="muted" id="status">Cargando...</p>
        </div>
        <div class="view-header-actions">
          <button class="btn" type="button" data-go="productos-nuevo">➕ Nuevo producto</button>
          <button class="btn secondary" type="button" id="btnReload">🔄 Recargar</button>
        </div>
      </div>

      <div class="form">
        <div class="field full">
          <label>Buscar</label>
          <input type="text" id="q" placeholder="Nombre, categoría..." />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Perecedero</th>
          </tr>
        </thead>
        <tbody id="productsBody"></tbody>
      </table>
    </div>

    <div class="modal-backdrop hidden" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <h3 style="margin:0;">Editar producto</h3>
          <button class="btn secondary" type="button" id="btnCloseModal">✖</button>
        </div>

        <div class="card soft" style="margin-top:12px;">
          <p class="muted">Edición pendiente: primero implementamos PUT/PATCH y campos extra (stock/precio).</p>
          <pre class="code" id="editJson">{}</pre>
        </div>

        <div class="actions" style="margin-top:12px;">
          <button class="btn secondary" type="button" id="btnCancel">Cerrar</button>
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

  const API_URL = "http://127.0.0.1:8000";

  let products = []; // ahora vienen del backend

  const tbody = el.querySelector("#productsBody");
  const q = el.querySelector("#q");
  const btnReload = el.querySelector("#btnReload");
  const status = el.querySelector("#status");

  function normalizeFromApi(p) {
    // Adaptamos el JSON del backend al formato que renderiza la tabla
    return {
      id: p.id,
      product_name: p.product_name,
      category: p.category_off,                 // backend -> frontend
      perishable: Number(p.perecedero) === 1,   // 0/1 -> boolean
      stock: null,                              // aún no existe en BD
      base_price: null,                         // aún no existe en BD
      _raw: p,                                  // por si quieres ver el original
    };
  }

  function renderRows(rows) {
    tbody.innerHTML = rows
      .map(
        (p) => `
        <tr>
          <td>${escapeHtml(p.product_name)}</td>
          <td>${escapeHtml(p.category || "—")}</td>
          <td>${
            p.perishable
              ? '<span class="tag warn">Sí</span>'
              : '<span class="tag">No</span>'
          }</td>
          <td>${p.stock == null ? "—" : Number(p.stock)}</td>
          <td>${p.base_price == null ? "—" : `$${Number(p.base_price).toFixed(2)}`}</td>
          <td>
            <button class="btn secondary" type="button" data-action="view" data-id="${p.id}">Ver</button>
            <button class="btn secondary" type="button" data-action="edit" data-id="${p.id}">Editar</button>
            <button class="btn secondary" type="button" data-action="delete" data-id="${p.id}">Eliminar</button>
          </td>
        </tr>
      `
      )
      .join("");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Sin resultados.</td></tr>`;
    }
  }

  function applyFilter() {
    const term = (q.value || "").trim().toLowerCase();
    const filtered = !term
      ? products
      : products.filter(
          (p) =>
            (p.product_name || "").toLowerCase().includes(term) ||
            (p.category || "").toLowerCase().includes(term)
        );
    renderRows(filtered);
  }

  async function fetchProducts() {
    status.textContent = "Cargando productos...";
    btnReload.disabled = true;

    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail;
        const msg =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d?.msg).filter(Boolean).join(" | ")
              : `Error HTTP ${res.status}`;
        throw new Error(msg);
      }

      products = Array.isArray(data) ? data.map(normalizeFromApi) : [];
      status.textContent = `Listo: ${products.length} producto(s).`;
      applyFilter();
    } catch (err) {
      status.textContent = `❌ ${err.message}`;
      console.error(err);
      products = [];
      applyFilter();
    } finally {
      btnReload.disabled = false;
    }
  }

  q.addEventListener("input", applyFilter);
  btnReload.addEventListener("click", fetchProducts);

  // Modal placeholder
  const backdrop = el.querySelector("#modalBackdrop");
  const btnClose = el.querySelector("#btnCloseModal");
  const btnCancel = el.querySelector("#btnCancel");
  const editJson = el.querySelector("#editJson");

  function openModal(product) {
    backdrop.classList.remove("hidden");
    editJson.textContent = JSON.stringify(product._raw, null, 2);
  }
  function closeModal() {
    backdrop.classList.add("hidden");
  }

  btnClose.addEventListener("click", closeModal);
  btnCancel.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Acciones tabla
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const action = btn.dataset.action;

    if (action === "view") {
      alert(`Producto:\n\n${JSON.stringify(product._raw, null, 2)}`);
    }

    if (action === "edit") {
      // placeholder hasta tener PUT/PATCH
      openModal(product);
    }

    if (action === "delete") {
      alert("Eliminar (placeholder): primero implementamos DELETE /products/{id}");
    }
  });

  // Inicial: traer del backend
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

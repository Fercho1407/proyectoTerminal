export function ProductosListaView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Productos</h3>
          <p class="muted">Placeholder. Luego conecta a GET /productos</p>
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
            <th>Stock</th>
            <th>Precio</th>
            <th style="width: 220px;">Acciones</th>
          </tr>
        </thead>
        <tbody id="productsBody"></tbody>
      </table>
    </div>

    <!-- Modal simple de edición -->
    <div class="modal-backdrop hidden" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <h3 style="margin:0;">Editar producto</h3>
          <button class="btn secondary" type="button" id="btnCloseModal">✖</button>
        </div>

        <form class="form" id="editForm" style="margin-top:10px;">
          <input type="hidden" name="id" />

          <div class="field full">
            <label>Nombre</label>
            <input type="text" name="product_name" required />
          </div>

          <div class="field">
            <label>Categoría</label>
            <input type="text" name="category" />
          </div>

          <div class="field">
            <label>Perecedero</label>
            <select name="perishable">
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </div>

          <div class="field">
            <label>Stock</label>
            <input type="number" name="stock" min="0" />
          </div>

          <div class="field">
            <label>Precio</label>
            <input type="number" name="base_price" step="0.01" min="0" />
          </div>

          <div class="field full">
            <div class="actions">
              <button class="btn secondary" type="button" id="btnCancel">Cancelar</button>
              <button class="btn" type="submit">Guardar cambios</button>
            </div>
          </div>
        </form>

        <div class="card soft" style="margin-top:12px;">
          <h3>Payload (PATCH /productos/{id})</h3>
          <pre class="code" id="editJson">{}</pre>
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

  // Mock (luego: fetch GET /productos)
  let products = [
    { id: 1, product_name: "naranja 1 kg", category: "frutas-verduras", perishable: true, stock: 12, base_price: 32.00 },
    { id: 2, product_name: "pasta espagueti 500 g", category: "abarrotes", perishable: false, stock: 40, base_price: 18.50 },
    { id: 3, product_name: "tamarindo 1 kg", category: "frutas-verduras", perishable: true, stock: 6, base_price: 64.00 },
  ];

  const tbody = el.querySelector("#productsBody");
  const q = el.querySelector("#q");
  const btnReload = el.querySelector("#btnReload");

  function renderRows(rows) {
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td>${escapeHtml(p.product_name)}</td>
        <td>${escapeHtml(p.category || "—")}</td>
        <td>${p.perishable ? '<span class="tag warn">Sí</span>' : '<span class="tag">No</span>'}</td>
        <td>${Number(p.stock ?? 0)}</td>
        <td>$${Number(p.base_price ?? 0).toFixed(2)}</td>
        <td>
          <button class="btn secondary" type="button" data-action="view" data-id="${p.id}">Ver</button>
          <button class="btn secondary" type="button" data-action="edit" data-id="${p.id}">Editar</button>
          <button class="btn secondary" type="button" data-action="delete" data-id="${p.id}">Eliminar</button>
        </td>
      </tr>
    `).join("");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Sin resultados.</td></tr>`;
    }
  }

  function applyFilter() {
    const term = (q.value || "").trim().toLowerCase();
    const filtered = !term ? products : products.filter(p =>
      (p.product_name || "").toLowerCase().includes(term) ||
      (p.category || "").toLowerCase().includes(term)
    );
    renderRows(filtered);
  }

  q.addEventListener("input", applyFilter);
  btnReload.addEventListener("click", () => {
    alert("Recargar (placeholder). Luego hará GET /productos");
    applyFilter();
  });

  // Modal edición
  const backdrop = el.querySelector("#modalBackdrop");
  const btnClose = el.querySelector("#btnCloseModal");
  const btnCancel = el.querySelector("#btnCancel");
  const editForm = el.querySelector("#editForm");
  const editJson = el.querySelector("#editJson");

  function openModal(product) {
    backdrop.classList.remove("hidden");
    // cargar valores
    editForm.id.value = product.id;
    editForm.product_name.value = product.product_name || "";
    editForm.category.value = product.category || "";
    editForm.perishable.value = product.perishable ? "1" : "0";
    editForm.stock.value = product.stock ?? 0;
    editForm.base_price.value = product.base_price ?? 0;

    updateEditPreview();
  }

  function closeModal() {
    backdrop.classList.add("hidden");
  }

  btnClose.addEventListener("click", closeModal);
  btnCancel.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  function buildPatchPayload() {
    // Este payload es el que normalmente mandarías en PATCH
    return {
      product_name: editForm.product_name.value.trim(),
      category: editForm.category.value.trim() || null,
      perishable: editForm.perishable.value === "1",
      stock: Number(editForm.stock.value || 0),
      base_price: editForm.base_price.value ? Number(editForm.base_price.value) : null,
    };
  }

  function updateEditPreview() {
    editJson.textContent = JSON.stringify(buildPatchPayload(), null, 2);
  }

  editForm.addEventListener("input", updateEditPreview);

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = Number(editForm.id.value);
    const payload = buildPatchPayload();

    // placeholder: PATCH /productos/{id}
    console.log("PATCH /productos/" + id, payload);
    alert("Cambios guardados (placeholder)");

    // actualizar mock local
    products = products.map(p => (p.id === id ? { ...p, ...payload } : p));
    applyFilter();
    closeModal();
  });

  // Acciones en la tabla (delegación)
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const product = products.find(p => p.id === id);
    if (!product) return;

    const action = btn.dataset.action;

    if (action === "view") {
      alert(`Ver (placeholder):\n\n${JSON.stringify(product, null, 2)}`);
    }

    if (action === "edit") {
      openModal(product);
    }

    if (action === "delete") {
      const ok = confirm("¿Eliminar producto? (placeholder)");
      if (!ok) return;
      // placeholder: DELETE /productos/{id}
      products = products.filter(p => p.id !== id);
      applyFilter();
    }
  });

  // Inicial
  renderRows(products);
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

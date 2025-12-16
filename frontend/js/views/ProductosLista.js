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
            <th style="width: 220px;">Acciones</th>
          </tr>
        </thead>
        <tbody id="productsBody"></tbody>
      </table>
    </div>

    <!-- Modal Edición -->
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

          <div class="field full">
            <label>Categoría (OpenFoodFacts)</label>
            <input type="text" name="category_off" required />
          </div>

          <div class="field">
            <label>Vida útil despensa (días)</label>
            <input type="number" name="shelf_life_pantry_days" min="0" value="0" required />
          </div>

          <div class="field">
            <label>Vida útil refrigerador (días)</label>
            <input type="number" name="shelf_life_fridge_days" min="0" value="0" required />
          </div>

          <div class="field">
            <label>Vida útil congelador (días)</label>
            <input type="number" name="shelf_life_freezer_days" min="0" value="0" required />
          </div>

          <div class="field full">
            <div class="actions">
              <button class="btn secondary" type="button" id="btnCancel">Cancelar</button>
              <button class="btn" type="submit" id="btnSaveEdit">Guardar cambios</button>
            </div>
            <p class="muted" id="editStatus" style="margin-top:10px;"></p>
          </div>
        </form>

        <div class="card soft" style="margin-top:12px;">
          <h3>Payload (PUT /products/{id})</h3>
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

  const API_URL = "http://127.0.0.1:8000";

  let products = [];

  const tbody = el.querySelector("#productsBody");
  const q = el.querySelector("#q");
  const btnReload = el.querySelector("#btnReload");
  const status = el.querySelector("#status");

  // Modal edición
  const backdrop = el.querySelector("#modalBackdrop");
  const btnClose = el.querySelector("#btnCloseModal");
  const btnCancel = el.querySelector("#btnCancel");
  const editForm = el.querySelector("#editForm");
  const editJson = el.querySelector("#editJson");
  const editStatus = el.querySelector("#editStatus");
  const btnSaveEdit = el.querySelector("#btnSaveEdit");

  function normalizeFromApi(p) {
    return {
      id: p.id,
      product_name: p.product_name,
      category: p.category_off,
      perishable: Number(p.perecedero) === 1,
      _raw: p,
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
          <td>
            <button class="btn secondary" type="button" data-action="view" data-id="${p.id}">Ver</button>
            <button class="btn secondary" type="button" data-action="edit" data-id="${p.id}">Editar</button>
          </td>
        </tr>
      `
      )
      .join("");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">Sin resultados.</td></tr>`;
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

  // ===== Modal helpers =====
  function openModal(product) {
    backdrop.classList.remove("hidden");

    // cargar valores desde la respuesta RAW del backend
    editForm.id.value = product.id;
    editForm.product_name.value = product._raw.product_name ?? "";
    editForm.category_off.value = product._raw.category_off ?? "";
    editForm.shelf_life_pantry_days.value = product._raw.shelf_life_pantry_days ?? 0;
    editForm.shelf_life_fridge_days.value = product._raw.shelf_life_fridge_days ?? 0;
    editForm.shelf_life_freezer_days.value = product._raw.shelf_life_freezer_days ?? 0;

    editStatus.textContent = "";
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

  function buildPutPayload() {
    return {
      product_name: editForm.product_name.value.trim(),
      category_off: editForm.category_off.value.trim(),
      shelf_life_pantry_days: Number(editForm.shelf_life_pantry_days.value || 0),
      shelf_life_fridge_days: Number(editForm.shelf_life_fridge_days.value || 0),
      shelf_life_freezer_days: Number(editForm.shelf_life_freezer_days.value || 0),
    };
  }

  function updateEditPreview() {
    editJson.textContent = JSON.stringify(buildPutPayload(), null, 2);
  }

  editForm.addEventListener("input", updateEditPreview);

  function setEditLoading(on) {
    btnSaveEdit.disabled = on;
    btnSaveEdit.textContent = on ? "Guardando..." : "Guardar cambios";
  }

  async function putProduct(id, payload) {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
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
            ? detail.map((d) => d?.msg).filter(Boolean).join(" | ")
            : `Error HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = Number(editForm.id.value);
    const payload = buildPutPayload();

    try {
      setEditLoading(true);
      editStatus.textContent = "Guardando en backend...";

      const updated = await putProduct(id, payload);

      // actualizar en memoria y re-render
      products = products.map((p) => (p.id === id ? normalizeFromApi(updated) : p));
      applyFilter();

      editStatus.textContent = `✅ Actualizado. perecedero=${updated.perecedero}`;
      setTimeout(closeModal, 250);
    } catch (err) {
      editStatus.textContent = `❌ ${err.message}`;
      console.error(err);
    } finally {
      setEditLoading(false);
    }
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
      openModal(product);
    }
  });

  // Inicial
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

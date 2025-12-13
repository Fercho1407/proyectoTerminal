export function ProductosNuevoView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Nuevo producto</h3>
          <p class="muted">Placeholder. Luego conecta a POST /productos.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="productos-lista" disabled>📦 Ver productos</button>
        </div>
      </div>

      <form class="form" id="producto-form">
        <div class="field full">
          <label>Nombre del producto</label>
          <input type="text" name="product_name" placeholder="Ej. naranja 1 kg" required />
        </div>

        <div class="field">
          <label>Categoría</label>
          <input type="text" name="category" placeholder="Ej. frutas-verduras" />
        </div>

        <div class="field">
          <label>¿Perecedero?</label>
          <select name="perishable">
            <option value="1">Sí</option>
            <option value="0">No</option>
          </select>
        </div>

        <div class="field">
          <label>Vida útil (días)</label>
          <input type="number" name="shelf_life_days" min="0" placeholder="Ej. 7" />
        </div>

        <div class="field">
          <label>Stock inicial</label>
          <input type="number" name="initial_stock" min="0" placeholder="Ej. 20" />
        </div>

        <div class="field">
          <label>Precio base (MXN)</label>
          <input type="number" name="base_price" step="0.01" min="0" placeholder="Ej. 32.00" />
        </div>

        <div class="field">
          <label>Temporada pico inicio (mes)</label>
          <input type="number" name="season_start_month" min="1" max="12" placeholder="1-12" />
        </div>

        <div class="field">
          <label>Temporada pico fin (mes)</label>
          <input type="number" name="season_end_month" min="1" max="12" placeholder="1-12" />
        </div>

        <div class="field full">
          <label>Descripción / notas</label>
          <textarea name="notes" placeholder="Opcional: marca, presentación, observaciones..."></textarea>
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="reset">Limpiar</button>
            <button class="btn" type="submit">Guardar producto</button>
          </div>
        </div>
      </form>

      <div class="card soft" id="producto-preview" style="margin-top:12px;">
        <h3>Preview (lo que enviarías al backend)</h3>
        <pre class="code" id="producto-json">{}</pre>
      </div>
    </div>
  `;

  // Navegación interna (placeholder)
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    window.location.hash = `#/${go.dataset.go}`;
  });

  const form = el.querySelector("#producto-form");
  const pre = el.querySelector("#producto-json");

  function buildPayload(fd) {
    // Convertimos a objeto y tipamos campos numéricos
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      product_name: raw.product_name.trim(),
      category: raw.category?.trim() || null,
      perishable: raw.perishable === "1",
      shelf_life_days: raw.shelf_life_days ? Number(raw.shelf_life_days) : null,
      initial_stock: raw.initial_stock ? Number(raw.initial_stock) : 0,
      base_price: raw.base_price ? Number(raw.base_price) : null,
      season_start_month: raw.season_start_month ? Number(raw.season_start_month) : null,
      season_end_month: raw.season_end_month ? Number(raw.season_end_month) : null,
      notes: raw.notes?.trim() || null,
    };

    // Reglas simples (front)
    if (!payload.perishable) payload.shelf_life_days = null;

    return payload;
  }

  function updatePreview() {
    const fd = new FormData(form);
    const payload = buildPayload(fd);
    pre.textContent = JSON.stringify(payload, null, 2);
  }

  form.addEventListener("input", updatePreview);
  updatePreview();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = buildPayload(new FormData(form));
    console.log("Producto capturado:", payload);

    alert("Producto guardado (placeholder)");
    form.reset();
    updatePreview();
  });

  return el;
}

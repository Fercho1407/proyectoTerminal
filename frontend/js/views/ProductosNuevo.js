export function ProductosNuevoView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Nuevo producto</h3>
          <p class="muted">Captura datos base. El backend calcula si es perecedero.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="productos-lista" disabled>📦 Ver productos</button>
        </div>
      </div>

      <form class="form" id="producto-form">
        <div class="field full">
          <label>Nombre del producto</label>
          <input type="text" name="product_name" placeholder="Ej. pasta espagueti 500 g" required />
        </div>

        <div class="field full">
          <label>Categoría (OpenFoodFacts)</label>
          <input type="text" name="category_off" placeholder="Ej. pasta" required />
        </div>

        <div class="field">
          <label>Vida útil despensa (días)</label>
          <input type="number" name="shelf_life_pantry_days" min="0" placeholder="Ej. 365" value="0" required />
        </div>

        <div class="field">
          <label>Vida útil refrigerador (días)</label>
          <input type="number" name="shelf_life_fridge_days" min="0" placeholder="Ej. 7" value="0" required />
        </div>

        <div class="field">
          <label>Vida útil congelador (días)</label>
          <input type="number" name="shelf_life_freezer_days" min="0" placeholder="Ej. 180" value="0" required />
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="reset" id="btn-reset">Limpiar</button>
            <button class="btn" type="submit" id="btn-submit">Guardar producto</button>
          </div>
          <p class="muted" id="producto-status" style="margin-top:10px;"></p>
        </div>
      </form>

      <div class="card soft" id="producto-preview" style="margin-top:12px;">
        <h3>Preview (request)</h3>
        <pre class="code" id="producto-json">{}</pre>
      </div>

      <div class="card soft" id="producto-response" style="margin-top:12px; display:none;">
        <h3>Respuesta del backend</h3>
        <pre class="code" id="producto-resp-json">{}</pre>
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

  const form = el.querySelector("#producto-form");
  const pre = el.querySelector("#producto-json");
  const status = el.querySelector("#producto-status");
  const btnSubmit = el.querySelector("#btn-submit");

  const respCard = el.querySelector("#producto-response");
  const respPre = el.querySelector("#producto-resp-json");

  function buildPayload(fd) {
    const raw = Object.fromEntries(fd.entries());
    return {
      product_name: raw.product_name.trim(),
      category_off: raw.category_off.trim(),
      shelf_life_pantry_days: Number(raw.shelf_life_pantry_days || 0),
      shelf_life_fridge_days: Number(raw.shelf_life_fridge_days || 0),
      shelf_life_freezer_days: Number(raw.shelf_life_freezer_days || 0),
    };
  }

  function updatePreview() {
    const payload = buildPayload(new FormData(form));
    pre.textContent = JSON.stringify(payload, null, 2);
  }

  function setLoading(isLoading) {
    btnSubmit.disabled = isLoading;
    btnSubmit.textContent = isLoading ? "Guardando..." : "Guardar producto";
  }

  async function postProducto(payload) {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Intentar leer JSON aunque sea error
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

  form.addEventListener("input", updatePreview);
  updatePreview();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = buildPayload(new FormData(form));
    status.textContent = "";
    respCard.style.display = "none";
    respPre.textContent = "{}";

    try {
      setLoading(true);
      status.textContent = "Enviando al backend...";
      const creado = await postProducto(payload);

      status.textContent = `Guardado. ID=${creado.id} | perecedero=${creado.perecedero}`;
      respCard.style.display = "block";
      respPre.textContent = JSON.stringify(creado, null, 2);

      form.reset();
      updatePreview();
    } catch (err) {
      status.textContent = `${err.message}`;
    } finally {
      setLoading(false);
    }
  });

  return el;
}

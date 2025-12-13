export function PrediccionesView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Predicciones</h3>
          <p class="muted">Placeholder. Luego conecta a POST /predict</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" data-go="inventario">📦 Ver inventario</button>
          <button class="btn secondary" type="button" data-go="estadisticas-producto" disabled>📈 Stats producto</button>
        </div>
      </div>

      <form class="form" id="predictForm">
        <div class="field full">
          <label>Producto</label>
          <input type="text" name="product_name" placeholder="Ej. pasta espagueti 500 g" required />
        </div>

        <div class="field">
          <label>Horizonte</label>
          <select name="horizon_days">
            <option value="7">7 días</option>
            <option value="14">14 días</option>
            <option value="30">30 días</option>
          </select>
        </div>

        <div class="field">
          <label>Modo</label>
          <select name="mode">
            <option value="sales">Predicción de ventas</option>
            <option value="reorder">Recomendación de compra</option>
          </select>
        </div>

        <div class="field">
          <label>Stock actual (opcional)</label>
          <input type="number" name="current_stock" min="0" placeholder="Ej. 12" />
        </div>

        <div class="field">
          <label>¿Considerar eventos?</label>
          <select name="use_events">
            <option value="1">Sí</option>
            <option value="0">No</option>
          </select>
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="reset" id="btnReset">Limpiar</button>
            <button class="btn" type="submit">Predecir</button>
          </div>
        </div>
      </form>

      <div class="card soft" style="margin-top:12px;">
        <h3>Payload (POST /predict)</h3>
        <pre class="code" id="payloadPreview">{}</pre>
      </div>

      <div class="result" style="margin-top:12px;">
        <div class="card soft">
          <h3>Resultado (placeholder)</h3>
          <p class="muted">Aquí luego va: histórico vs predicción (Chart.js o imagen del backend).</p>
          <div class="placeholder-box" style="height:220px;">Área de gráfica</div>

          <div class="chips" style="margin-top:10px;">
            <span class="tag" id="kpiStock">📦 Stock actual: —</span>
            <span class="tag warn" id="kpiBuy">🟡 Recomendado comprar: —</span>
            <span class="tag" id="kpiExpected">📅 Ventas esperadas: —</span>
          </div>
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

  const form = el.querySelector("#predictForm");
  const preview = el.querySelector("#payloadPreview");

  const kpiStock = el.querySelector("#kpiStock");
  const kpiBuy = el.querySelector("#kpiBuy");
  const kpiExpected = el.querySelector("#kpiExpected");

  function buildPayload(fd) {
    const raw = Object.fromEntries(fd.entries());

    return {
      product_name: (raw.product_name || "").trim(),
      horizon_days: Number(raw.horizon_days || 7),
      mode: raw.mode || "sales",
      current_stock: raw.current_stock ? Number(raw.current_stock) : null,
      use_events: raw.use_events === "1",
    };
  }

  function updatePreview() {
    const payload = buildPayload(new FormData(form));
    preview.textContent = JSON.stringify(payload, null, 2);
  }

  form.addEventListener("input", updatePreview);
  updatePreview();

  // Placeholder de predicción: simula salida del backend
  function mockPredict(payload) {
    // Simula "ventas esperadas" y "recomendado comprar"
    const base = Math.max(1, Math.round(Math.random() * 6));
    const expectedSales = base * payload.horizon_days;

    const stock = payload.current_stock ?? Math.max(0, Math.round(Math.random() * 20));
    const recommendedBuy = Math.max(0, expectedSales - stock);

    return { stock, expectedSales, recommendedBuy };
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = buildPayload(new FormData(form));
    console.log("POST /predict", payload);

    // En el futuro:
    // const res = await api.predict(payload)
    const res = mockPredict(payload);

    kpiStock.textContent = `📦 Stock actual: ${res.stock}`;
    kpiBuy.textContent = `🟡 Recomendado comprar: ${res.recommendedBuy}`;
    kpiExpected.textContent = `📅 Ventas esperadas: ${res.expectedSales}`;

    alert("Predicción generada (placeholder)");
  });

  el.querySelector("#btnReset").addEventListener("click", () => {
    setTimeout(updatePreview, 0);
    kpiStock.textContent = `📦 Stock actual: —`;
    kpiBuy.textContent = `🟡 Recomendado comprar: —`;
    kpiExpected.textContent = `📅 Ventas esperadas: —`;
  });

  return el;
}

export function VentasHistorialView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Historial de ventas</h3>
          <p class="muted">Placeholder. Luego conecta a GET /ventas?from=&to=&q=</p>
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
          <label>Buscar</label>
          <input type="text" name="q" placeholder="Producto, categoría..." />
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
        <tbody id="ventasBody">
          <!-- filas -->
        </tbody>
      </table>
    </div>
  `;

  // Navegación interna (sin router directo)
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    window.location.hash = `#/${go.dataset.go}`;
  });

  // Datos mock (placeholder)
  const mockVentas = [
    { fecha: "2025-12-10", producto: "pasta espagueti 500 g", cantidad: 2, precio: 18.5 },
    { fecha: "2025-12-10", producto: "naranja 1 kg", cantidad: 1, precio: 32.0 },
    { fecha: "2025-12-11", producto: "tamarindo 1 kg", cantidad: 3, precio: 64.0 },
  ];

  const tbody = el.querySelector("#ventasBody");
  function renderRows(rows) {
    tbody.innerHTML = rows.map(r => {
      const total = (Number(r.cantidad) * Number(r.precio || 0));
      return `
        <tr>
          <td>${r.fecha}</td>
          <td>${escapeHtml(r.producto)}</td>
          <td>${r.cantidad}</td>
          <td>$${Number(r.precio || 0).toFixed(2)}</td>
          <td>$${total.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Sin resultados.</td></tr>`;
    }
  }

  renderRows(mockVentas);

  // Filtros locales (placeholder; luego se vuelve query al backend)
  const fromInput = el.querySelector('input[name="from"]');
  const toInput = el.querySelector('input[name="to"]');
  const qInput = el.querySelector('input[name="q"]');

  el.querySelector("#btnApply").addEventListener("click", () => {
    const from = fromInput.value ? new Date(fromInput.value) : null;
    const to = toInput.value ? new Date(toInput.value) : null;
    const q = (qInput.value || "").trim().toLowerCase();

    const filtered = mockVentas.filter(v => {
      const d = new Date(v.fecha);
      const okFrom = !from || d >= from;
      const okTo = !to || d <= to;
      const okQ = !q || v.producto.toLowerCase().includes(q);
      return okFrom && okTo && okQ;
    });

    renderRows(filtered);
  });

  el.querySelector("#btnClear").addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    qInput.value = "";
    renderRows(mockVentas);
  });

  el.querySelector("#btnExport").addEventListener("click", () => {
    // placeholder: luego exportas desde backend o generas CSV aquí con los datos reales
    alert("Exportar CSV (placeholder)");
  });

  return el;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

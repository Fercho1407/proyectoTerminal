export function PrediccionesView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <div class="view-header">
        <div>
          <h3>Predicciones</h3>
          <p class="muted" id="status">Listo.</p>
        </div>
        <div class="view-header-actions">
          <button class="btn secondary" type="button" id="btnLoad">Cargar productos</button>
          <button class="btn secondary" type="button" data-go="inventario">Ver inventario</button>
          <button class="btn secondary" type="button" data-go="estadisticas-producto">Stats producto</button>
        </div>
      </div>

      <form class="form" id="predictForm">
        <div class="field full">
          <label>Producto</label>
          <select id="productId" required>
            <option value="">(Cargando...)</option>
          </select>
          <p class="muted" style="margin-top:6px;">
            Tip: primero clic en <strong>Cargar productos</strong> si está vacío.
          </p>
        </div>

        <div class="field">
          <label>Unidad</label>
          <select id="unit">
            <option value="piece" selected>piece</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="pack">pack</option>
            <option value="box">box</option>
            <option value="lt">lt</option>
            <option value="ml">ml</option>
          </select>
        </div>

        <div class="field">
          <label>Días</label>
          <select id="days">
            <option value="7" selected>7</option>
            <option value="14">14</option>
            <option value="30">30</option>
          </select>
        </div>

        <div class="field">
          <label>Precio (opcional)</label>
          <input type="number" id="price" min="0" step="0.01" placeholder="Si lo dejas vacío usa el último" />
        </div>

        <div class="field">
          <label>Stock actual (opcional)</label>
          <input type="number" id="stock" min="0" step="0.001" placeholder="Ej. 12" />
        </div>

        <div class="field full">
          <div class="actions">
            <button class="btn secondary" type="reset" id="btnReset">Limpiar</button>
            <button class="btn" type="submit" id="btnRun">Predecir</button>
          </div>
        </div>
      </form>

      <div class="card soft" style="margin-top:12px;">
        <h3>Payload (POST /ml/predict)</h3>
        <pre class="code" id="payloadPreview">{}</pre>
      </div>

      <div class="card soft" style="margin-top:12px;">
        <h3>Resultado</h3>

        <div class="chips" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <span class="tag" id="kpiName">Producto: —</span>
          <span class="tag" id="kpiExpected">Ventas esperadas: —</span>
          <span class="tag warn" id="kpiBuy">Recomendado comprar: —</span>
          <span class="tag" id="kpiUsedPrice">Precio usado: —</span>
        </div>

        <div id="chartWrap" style="position:relative; margin-top:12px;">
          <div id="chart" style="height:320px; border:1px dashed rgba(255,255,255,.12); border-radius:12px; overflow:hidden; position:relative;">
            <div class="muted" id="chartEmpty"
              style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none;">
              Área de gráfica
            </div>
          </div>

          <div id="tooltip"
              class="card soft"
              style="position:absolute; left:0; top:0; transform:translate(-9999px,-9999px);
                      pointer-events:none; padding:8px 10px; border-radius:10px; font-size:12px; opacity:.98;">
            <div class="muted" id="tipDate">—</div>
            <div id="tipValue" style="font-weight:700;">—</div>
          </div>
        </div>

        <div style="margin-top:12px; overflow:auto; max-height:220px;">
          <table>
            <thead><tr><th>Fecha</th><th>Predicción</th></tr></thead>
            <tbody id="seriesBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // navegación
  el.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    window.location.hash = `#/${go.dataset.go}`;
  });

  const API_URL = "http://127.0.0.1:8000";

  const status = el.querySelector("#status");
  const btnLoad = el.querySelector("#btnLoad");
  const btnRun = el.querySelector("#btnRun");
  const btnReset = el.querySelector("#btnReset");

  const productSel = el.querySelector("#productId");
  const unitSel = el.querySelector("#unit");
  const daysSel = el.querySelector("#days");
  const priceInp = el.querySelector("#price");
  const stockInp = el.querySelector("#stock");

  const payloadPreview = el.querySelector("#payloadPreview");

  const kpiName = el.querySelector("#kpiName");
  const kpiExpected = el.querySelector("#kpiExpected");
  const kpiBuy = el.querySelector("#kpiBuy");
  const kpiUsedPrice = el.querySelector("#kpiUsedPrice");

  const chart = el.querySelector("#chart");
  const chartEmpty = el.querySelector("#chartEmpty");
  const tooltip = el.querySelector("#tooltip");
  const tipDate = el.querySelector("#tipDate");
  const tipValue = el.querySelector("#tipValue");

  const seriesBody = el.querySelector("#seriesBody");
  const form = el.querySelector("#predictForm");

  let products = [];
  let lastPoints = [];

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
    return Number.isFinite(v) ? `$${v.toFixed(2)}` : "—";
  }

  function fmt3(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v.toFixed(3) : "—";
  }

  function setLoading(on) {
    btnRun.disabled = on;
    btnLoad.disabled = on;
    btnRun.textContent = on ? "Prediciendo..." : "Predecir";
  }

  // Espera a que el elemento esté montado en DOM Y tenga tamaño real (no display:none)
  function waitForMountAndSize(targetEl, { minW = 80, minH = 80, frames = 60 } = {}) {
    return new Promise((resolve) => {
      let n = 0;
      const tick = () => {
        n++;

        if (!targetEl.isConnected) {
          if (n < frames) return requestAnimationFrame(tick);
          return resolve(false);
        }

        const w = targetEl.clientWidth;
        const h = targetEl.clientHeight;

        if (w >= minW && h >= minH) return resolve(true);

        if (n < frames) return requestAnimationFrame(tick);
        resolve(false);
      };
      requestAnimationFrame(tick);
    });
  }

  // ✅ FIX: NO mandes product_id=0, y asegura days como int
  function buildPayload() {
    const product_id = Number(productSel.value); // <- sin fallback a 0
    const unit = unitSel.value;
    const days = parseInt(daysSel.value, 10);

    if (!Number.isFinite(product_id) || product_id <= 0) return null;
    if (!unit) return null;
    if (!Number.isFinite(days) || days <= 0) return null;

    const payload = { product_id, unit, days };

    const price = priceInp.value.trim();
    if (price !== "") {
      const p = Number(price);
      if (Number.isFinite(p) && p >= 0) payload.price = p;
    }

    return payload;
  }

  function updatePreview() {
    payloadPreview.textContent = JSON.stringify(buildPayload() ?? {}, null, 2);
  }

  function productOptionsHtml(selectedId) {
    if (!products.length) return `<option value="">(Sin productos)</option>`;
    return [
      `<option value="">Selecciona...</option>`,
      ...products.map((p) => {
        const sel = Number(selectedId) === Number(p.id) ? "selected" : "";
        const label = `${p.product_name}${p.category_off ? ` · ${p.category_off}` : ""}`;
        return `<option value="${p.id}" ${sel}>${escapeHtml(label)}</option>`;
      }),
    ].join("");
  }

  async function fetchProducts() {
    status.textContent = "Cargando productos...";
    btnLoad.disabled = true;

    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || "Error al cargar productos");

      products = Array.isArray(data) ? data : [];
      productSel.innerHTML = productOptionsHtml(productSel.value);
      status.textContent = `Productos: ${products.length}.`;
    } catch (err) {
      console.error(err);
      products = [];
      productSel.innerHTML = `<option value="">(Error al cargar)</option>`;
      status.textContent = `Error: ${err.message}`;
    } finally {
      btnLoad.disabled = false;
      updatePreview();
    }
  }

  function clearChart() {
    const svg = chart.querySelector("svg");
    if (svg) svg.remove();
    chartEmpty.style.display = "flex";
    tooltip.style.transform = "translate(-9999px,-9999px)";
  }

  function renderSeries(points) {
    seriesBody.innerHTML = points.length
      ? points
          .map(
            (p) => `
              <tr>
                <td>${escapeHtml(p.date)}</td>
                <td>${fmt3(p.y_pred)}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="2" class="muted">Sin datos.</td></tr>`;
  }

  function renderChart(points) {
    if (!Array.isArray(points) || points.length === 0) {
      clearChart();
      return;
    }

    const series = points.map((p) => ({
      date: String(p.date ?? ""),
      value: Number(p.y_pred),
    }));

    if (!series.some((p) => Number.isFinite(p.value))) {
      clearChart();
      return;
    }

    chartEmpty.style.display = "none";
    tooltip.style.transform = "translate(-9999px,-9999px)";

    const old = chart.querySelector("svg");
    if (old) old.remove();

    const W = Math.max(360, Math.round(chart.clientWidth || 900));
    const H = Math.max(240, Math.round(chart.clientHeight || 320));

    const padL = 58,
      padR = 14,
      padT = 14,
      padB = 52;

    const values = series.map((p) => (Number.isFinite(p.value) ? p.value : 0));
    let minV = Math.min(...values);
    let maxV = Math.max(...values);
    if (minV === maxV) {
      maxV = minV + 1;
      minV = Math.max(0, minV - 1);
    }

    const xScale = (i) => {
      if (series.length === 1) return padL;
      return padL + (i * (W - padL - padR)) / (series.length - 1);
    };

    const yScale = (v) => {
      const t = (v - minV) / (maxV - minV);
      return H - padB - t * (H - padT - padB);
    };

    const xAxisTitle = "Fecha";
    const yAxisTitle = `Cantidad esperada (${unitSel.value})`;

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.display = "block";

    const mkLine = (x1, y1, x2, y2, stroke) => {
      const ln = document.createElementNS(ns, "line");
      ln.setAttribute("x1", String(x1));
      ln.setAttribute("y1", String(y1));
      ln.setAttribute("x2", String(x2));
      ln.setAttribute("y2", String(y2));
      ln.setAttribute("stroke", stroke);
      return ln;
    };

    const mkText = (x, y, str, opts = {}) => {
      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y));
      t.setAttribute("fill", opts.fill || "rgba(255,255,255,.75)");
      t.setAttribute("font-size", opts.size || "11");
      if (opts.anchor) t.setAttribute("text-anchor", opts.anchor);
      if (opts.transform) t.setAttribute("transform", opts.transform);
      t.textContent = str;
      return t;
    };

    const x0 = padL;
    const y0 = H - padB;
    const x1 = W - padR;
    const y1 = padT;

    svg.appendChild(mkLine(x0, y0, x1, y0, "rgba(255,255,255,.25)"));
    svg.appendChild(mkLine(x0, y0, x0, y1, "rgba(255,255,255,.25)"));

    const midV = (minV + maxV) / 2;
    [minV, midV, maxV].forEach((v) =>
      svg.appendChild(mkLine(x0, yScale(v), x1, yScale(v), "rgba(255,255,255,.08)"))
    );

    svg.appendChild(mkText(x0 - 10, yScale(maxV) + 4, maxV.toFixed(2), { anchor: "end" }));
    svg.appendChild(mkText(x0 - 10, yScale(midV) + 4, midV.toFixed(2), { anchor: "end" }));
    svg.appendChild(mkText(x0 - 10, yScale(minV) + 4, minV.toFixed(2), { anchor: "end" }));

    const idxA = 0;
    const idxB = Math.floor((series.length - 1) / 2);
    const idxC = series.length - 1;
    const fmtX = (s) => (s.length > 10 ? s.slice(0, 10) : s);

    [idxA, idxB, idxC].forEach((i) => {
      const x = xScale(i);
      svg.appendChild(mkLine(x, y0, x, y0 + 6, "rgba(255,255,255,.25)"));
      svg.appendChild(mkText(x, y0 + 20, fmtX(series[i].date), { anchor: "middle" }));
    });

    const d = series
      .map((p, i) => {
        const v = Number.isFinite(p.value) ? p.value : 0;
        return `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(v)}`;
      })
      .join(" ");

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,.85)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    series.forEach((p, i) => {
      const v = Number.isFinite(p.value) ? p.value : 0;
      const x = xScale(i);
      const y = yScale(v);

      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", "3.2");
      dot.setAttribute("fill", "rgba(255,255,255,.95)");
      svg.appendChild(dot);

      const hit = document.createElementNS(ns, "circle");
      hit.setAttribute("cx", String(x));
      hit.setAttribute("cy", String(y));
      hit.setAttribute("r", "10");
      hit.setAttribute("fill", "transparent");
      hit.style.cursor = "crosshair";

      hit.addEventListener("mousemove", (ev) => {
        tipDate.textContent = p.date;
        tipValue.textContent = `Pred: ${v.toFixed(3)} ${unitSel.value}`;

        const r = chart.getBoundingClientRect();
        tooltip.style.transform = `translate(${ev.clientX - r.left + 12}px, ${
          ev.clientY - r.top + 12
        }px)`;
      });

      hit.addEventListener("mouseleave", () => {
        tooltip.style.transform = "translate(-9999px,-9999px)";
      });

      svg.appendChild(hit);
    });

    svg.appendChild(
      mkText(18, H / 2, yAxisTitle, {
        size: "12",
        fill: "rgba(255,255,255,.80)",
        anchor: "middle",
        transform: `rotate(-90 18 ${H / 2})`,
      })
    );

    svg.appendChild(
      mkText((x0 + x1) / 2, H - 12, xAxisTitle, {
        size: "12",
        fill: "rgba(255,255,255,.80)",
        anchor: "middle",
      })
    );

    chart.appendChild(svg);
  }

  // ✅ FIX: imprime detalle de 422 si sucede
  async function postPredict(payload) {
    const res = await fetch(`${API_URL}/ml/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Si es 422, FastAPI manda un array de errores en detail
      if (res.status === 422) {
        const detail = data?.detail ? JSON.stringify(data.detail, null, 2) : "Sin detail";
        throw new Error(`422 Validación:\n${detail}`);
      }
      throw new Error(data?.detail || `Error HTTP ${res.status}`);
    }
    return data;
  }

  function computeExpected(points) {
    return points.reduce((acc, p) => acc + (Number(p.y_pred) || 0), 0);
  }

  // Redibuja al cambiar tamaño (cuando la vista se muestra o cambia el layout)
  const ro = new ResizeObserver(() => {
    if (lastPoints?.length) renderChart(lastPoints);
  });
  ro.observe(chart);

  form.addEventListener("input", updatePreview);
  unitSel.addEventListener("change", () => {
    updatePreview();
    if (lastPoints?.length) renderChart(lastPoints);
  });
  daysSel.addEventListener("change", updatePreview);
  productSel.addEventListener("change", updatePreview);
  priceInp.addEventListener("input", updatePreview);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = buildPayload();
    if (!payload) {
      status.textContent = "Selecciona un producto y días válidos (evita product_id=0).";
      return;
    }

    try {
      setLoading(true);
      status.textContent = "Consultando backend...";

      const data = await postPredict(payload);

      // ✅ backend esperado: { points: [{date, y_pred}], unit, product_name, remember... }
      lastPoints = Array.isArray(data.points) ? data.points : [];
      renderSeries(lastPoints);

      const okMounted = await waitForMountAndSize(el, { minW: 10, minH: 10, frames: 60 });
      const okSize = await waitForMountAndSize(chart, { minW: 80, minH: 80, frames: 60 });

      if (okMounted && okSize) {
        renderChart(lastPoints);
      } else {
        status.textContent =
          "La gráfica no puede renderizarse: el contenedor no tiene tamaño visible (vista oculta o display:none).";
        clearChart();
      }

      const expected = computeExpected(lastPoints);
      const stock = stockInp.value.trim() === "" ? null : Number(stockInp.value);
      const buy = stock == null ? null : Math.max(0, expected - stock);

      kpiName.textContent = `Producto: ${data.product_name ?? payload.product_id}`;
      kpiExpected.textContent = `Ventas esperadas: ${expected.toFixed(3)} ${data.unit ?? payload.unit}`;
      kpiUsedPrice.textContent = `Precio usado: ${money(data.used_price)}`;
      kpiBuy.textContent =
        stock == null
          ? `Recomendado comprar: (pon stock)`
          : `Recomendado comprar: ${buy.toFixed(3)} ${data.unit ?? payload.unit}`;

      if (okMounted && okSize) status.textContent = `OK: ${data.product_name} (${data.days} día(s), ${data.unit})`;
    } catch (err) {
      console.error(err);
      status.textContent = `Error: ${err.message}`;

      lastPoints = [];
      renderSeries([]);
      clearChart();

      kpiName.textContent = `Producto: —`;
      kpiExpected.textContent = `Ventas esperadas: —`;
      kpiBuy.textContent = `Recomendado comprar: —`;
      kpiUsedPrice.textContent = `Precio usado: —`;
    } finally {
      setLoading(false);
    }
  });

  btnLoad.addEventListener("click", fetchProducts);

  btnReset.addEventListener("click", () => {
    setTimeout(() => {
      updatePreview();
      lastPoints = [];
      renderSeries([]);
      clearChart();

      kpiName.textContent = `Producto: —`;
      kpiExpected.textContent = `Ventas esperadas: —`;
      kpiBuy.textContent = `Recomendado comprar: —`;
      kpiUsedPrice.textContent = `Precio usado: —`;
      status.textContent = "Listo.";
    }, 0);
  });

  updatePreview();
  clearChart();

  waitForMountAndSize(el, { minW: 10, minH: 10, frames: 60 }).then(() => {
    fetchProducts();
  });

  return el;
}

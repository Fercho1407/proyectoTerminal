export function DashboardView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="grid">
      <div class="card">
        <h3>KPIs de hoy</h3>
        <p class="muted">Placeholders: luego conectas el backend.</p>

        <div class="kpis">
          <div class="kpi">
            <div class="label">Ventas (MXN)</div>
            <div class="value">$0.00</div>
          </div>
          <div class="kpi">
            <div class="label">Tickets</div>
            <div class="value">0</div>
          </div>
          <div class="kpi">
            <div class="label">Productos vendidos</div>
            <div class="value">0</div>
          </div>
          <div class="kpi">
            <div class="label">Merma estimada</div>
            <div class="value">$0.00</div>
          </div>
        </div>
      </div>

      <div class="card span-7">
        <h3>Tendencia de ventas (placeholder)</h3>
        <p class="muted">Aquí irá una gráfica (Chart.js) o imagen del backend.</p>
        <div class="placeholder-box">Área de gráfica</div>
      </div>

      <div class="card span-5">
        <h3>Alertas rápidas</h3>
        <p class="muted">Prioriza lo urgente.</p>

        <div class="stack">
          <div class="tag bad">🔴 Stock crítico: 0</div>
          <div class="tag warn">🟡 Reorden sugerido: 0</div>
          <div class="tag good">🟢 En temporada: 0</div>
        </div>

        <div class="actions">
          <button class="btn secondary" type="button" disabled>Ver alertas</button>
        </div>
      </div>
    </div>
  `;

  return el;
}

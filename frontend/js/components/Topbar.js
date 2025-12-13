export function Topbar({ title, subtitle, onSync }) {
  const el = document.createElement("div");
  el.className = "topbar";
  el.innerHTML = `
    <div>
      <h2>${title}</h2>
      <p class="muted">${subtitle}</p>
    </div>
    <div class="right">
      <div class="search" title="Búsqueda (placeholder)">
        🔎 <input type="text" placeholder="Buscar..." />
      </div>
      <button class="btn secondary" type="button" data-action="sync">🔄 Sync</button>
    </div>
  `;

  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "sync") onSync?.();
  });

  return el;
}

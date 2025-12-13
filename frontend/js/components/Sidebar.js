export function Sidebar({ routes, activeId, onNavigate }) {
  const el = document.createElement("aside");
  el.innerHTML = `
    <div class="brand">
      <div class="logo" aria-hidden="true"></div>
      <div>
        <h1>Inventario & Predicción<br><small>Prototipo Front</small></h1>
      </div>
    </div>

    <nav>
      ${routes.map(r => `
        <button class="nav-btn ${r.id === activeId ? "active" : ""}" data-view="${r.id}">
          <span class="nav-left">📊 <span>${r.title}</span></span>
          <span class="pill">Inicio</span>
        </button>
      `).join("")}
    </nav>
  `;

  el.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    onNavigate(btn.dataset.view);
  });

  return el;
}

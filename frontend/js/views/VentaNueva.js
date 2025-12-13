export function VentasNuevaView() {
  const el = document.createElement("section");
  el.className = "view active";

  el.innerHTML = `
    <div class="card">
      <h3>Registrar nueva venta</h3>
      <p class="muted">Formulario base. Luego se conecta a POST /ventas.</p>

      <form class="form" id="venta-form">
        <div class="field full">
          <label>Producto</label>
          <input type="text" name="producto" placeholder="Ej. pasta espagueti 500 g" required />
        </div>

        <div class="field">
          <label>Cantidad</label>
          <input type="number" name="cantidad" min="1" value="1" required />
        </div>

        <div class="field">
          <label>Precio unitario (MXN)</label>
          <input type="number" name="precio" step="0.01" min="0" placeholder="Ej. 18.50" />
        </div>

        <div class="field">
          <label>Fecha</label>
          <input type="date" name="fecha" />
        </div>

        <div class="field full">
          <div class="actions">
            <button type="reset" class="btn secondary">Limpiar</button>
            <button type="submit" class="btn">Guardar venta</button>
          </div>
        </div>
      </form>
    </div>
  `;

  // lógica local de la vista
  el.querySelector("#venta-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target).entries());
    console.log("Venta capturada:", data);

    alert("Venta guardada (placeholder)");
    e.target.reset();
  });

  return el;
}

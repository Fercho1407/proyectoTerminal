import { useEffect, useState } from "react";
import { API_URL } from "../config";

export default function Ventas() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");

  const [productId, setProductId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then(setProductos)
      .catch(() => setError("No se pudieron cargar productos"));
  }, []);

  function registrarVenta() {
    setError("");

    const payload = {
      product_id: Number(productId),
      cantidad: Number(cantidad),
      precio_unitario: Number(precio),
    };

    fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || "Error al registrar venta");
        }
      })
      .then(() => {
        alert("Venta registrada");
        setCantidad("");
        setPrecio("");
      })
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Ventas</h2>

      <div className="card">
        <h3>Nueva venta</h3>

        <label className="label">Producto</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">-- Selecciona --</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <label className="label">Cantidad</label>
        <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />

        <label className="label">Precio unitario</label>
        <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />

        <button
          onClick={registrarVenta}
          disabled={!productId || !cantidad || !precio}
        >
          Registrar
        </button>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

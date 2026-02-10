import { useEffect, useState } from "react";
import { API_URL } from "../config";

export default function Predicciones() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const [productId, setProductId] = useState("");
  const [horizon, setHorizon] = useState("7");

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then(setProductos)
      .catch(() => setError("No se pudieron cargar productos"));
  }, []);

  function predecir() {
    setError("");
    setResultado(null);

    const payload = {
      product_id: Number(productId),
      horizon_days: Number(horizon),
    };

    fetch(`${API_URL}/ml/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.detail || "Error en predicción");
        return data;
      })
      .then((data) => setResultado(data))
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Predicciones</h2>

      <div className="card">
        <label className="label">Producto</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">-- Selecciona --</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <label className="label">Horizonte (días)</label>
        <input type="number" value={horizon} onChange={(e) => setHorizon(e.target.value)} />

        <button onClick={predecir} disabled={!productId || !horizon}>
          Predecir
        </button>

        {error && <p className="error">{error}</p>}

        {resultado && (
          <div className="card" style={{ marginTop: 12 }}>
            <p><b>Demanda estimada:</b> {resultado.demanda ?? "—"}</p>
            {resultado.confianza !== undefined && (
              <p><b>Confianza:</b> {resultado.confianza}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

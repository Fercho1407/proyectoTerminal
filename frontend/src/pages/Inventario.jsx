import { useEffect, useState } from "react";
import { API_URL } from "../config";

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/inventory/stock`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setCargando(false);
      })
      .catch(() => {
        setError("No se pudo cargar inventario");
        setCargando(false);
      });
  }, []);


  return (
    <div>
      <h2>Inventario</h2>

      <div className="card">
        {cargando && <p>Cargando...</p>}
        {error && <p className="error">{error}</p>}

        {!cargando && !error && (
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.product_id}>
                  <td>{x.product_name}</td>
                  <td>{x.stock_actual}</td>
                  <td>{x.unidad || "u"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

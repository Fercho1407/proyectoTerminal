import { useEffect, useState } from "react";
import { Producto } from "../components/Producto";
import { API_URL } from "../config";
import "./styles/Productos.css";

export default function Productos() {
  const [catalogoProductos, setCatalogoProductos] = useState<any[]>([]);
  const [productoBuscado, setProductoBuscado] = useState("");

  const productosFiltrados = catalogoProductos.filter((prod) => {
    const texto = productoBuscado.toLowerCase();

    return (
        prod.product_name.toLowerCase().includes(texto) ||
        prod.category_off.toLowerCase().includes(texto)
    );
    });

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setCatalogoProductos(data))
      .catch((e) => {
        console.error(`Ocurrió un error ${e}`);
      });
  }, []);

  return (
    <div className="products-page">
      <div className="products-header">
        <h2>Productos</h2>
        <span className="muted">{catalogoProductos.length} registros</span>
      </div>

        <div className="products-search">
            <span className="search-label muted">
                Buscar Producto:
            </span>

            <input
                className="search-input"
                type="text"
                placeholder="Escribe para buscar..."
                value={productoBuscado}
                onChange={(e) => setProductoBuscado(e.target.value)}
            />
        </div>


      <div className="products-tableWrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Perecedero</th>
              <th className="th-actions">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.map((prod) => (
              <Producto key={prod.id} product={prod} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

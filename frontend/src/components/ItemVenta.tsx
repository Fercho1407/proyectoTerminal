import { useState } from "react";

interface ItemVentaProps {
  id: string;
  productos: string[];
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ItemVenta = ({ id, productos, onRemove, canRemove }: ItemVentaProps) => {
  const [idSeleccionado, setIdSeleccionado] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("");
  const [unidad, setUnidad] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");

  const subtotal = Number(cantidadProducto) * Number(precioUnitario);

  return (
    <tr>
      <td>
        <select
          value={idSeleccionado}
          onChange={(e) => setIdSeleccionado(e.target.value)}
        >
          <option value="">-- Elige una opción --</option>

          {productos.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.product_name} - {prod.category_off}
            </option>
          ))}
        </select>
      </td>

      <td>
        <input
          type="number"
          value={cantidadProducto}
          onChange={(e) => setCantidadProducto(e.target.value)}
        />
      </td>

      <td>
        <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
          <option value="">Selecciona unidad</option>
          <option value="pieza">Pieza</option>
          <option value="kg">Kg</option>
          <option value="g">Gramos</option>
          <option value="paquete">Paquete</option>
          <option value="caja">Caja</option>
          <option value="lt">Litros</option>
          <option value="ml">Mililitros</option>
        </select>
      </td>

      <td>
        <input
          type="number"
          value={precioUnitario}
          onChange={(e) => setPrecioUnitario(e.target.value)}
        />
      </td>

      <td>{subtotal || 0}</td>

      <td>
        <button
          type="button"
          onClick={() => onRemove(id)}
          disabled={!canRemove}
        >
          Quitar
        </button>
      </td>
    </tr>
  );
};

export default ItemVenta;

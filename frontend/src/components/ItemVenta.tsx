import { useMemo } from "react"; // ✅ (CAMBIO) ya no usamos useState interno

interface Producto {
  id: number;
  product_name: string;
  category_off: string;
}

interface Item {
  id: string;
  productoId: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

interface ItemVentaProps {
  item: Item; 
  productos: Producto[]; 
  onRemove: (id: string) => void;
  canRemove: boolean;
  onChangeItem: (itemActualizado: Item) => void;
}

const ItemVenta = ({ item, productos, onRemove, canRemove, onChangeItem }: ItemVentaProps) => {
  const subtotal = useMemo(() => item.cantidad * item.precioUnitario, [item]);

  return (
    <tr>
      <td>
        <select
          value={item.productoId} 
          onChange={(e) =>
            onChangeItem({ ...item, productoId: e.target.value }) 
          }
        >
          <option value="">-- Elige una opción --</option>

          {productos.map((prod) => (
            <option key={prod.id} value={String(prod.id)}> 
              {prod.product_name} - {prod.category_off}
            </option>
          ))}
        </select>
      </td>

      <td>
        <input
          type="number"
          min={0}
          value={item.cantidad} 
          onChange={(e) =>
            onChangeItem({ ...item, cantidad: Number(e.target.value) }) 
          }
        />
      </td>

      <td>
        <select
          value={item.unidad} 
          onChange={(e) =>
            onChangeItem({ ...item, unidad: e.target.value }) 
          }
        >

          <option value="">Selecciona unidad</option>
          <option value="piece">Pieza</option>
          <option value="kg">Kg</option>
          <option value="g">Gramos</option>
          <option value="pack">Paquete</option>
          <option value="box">Caja</option>
          <option value="lt">Litros</option>
          <option value="ml">Mililitros</option>
        </select>
      </td>

      <td>
        <input
          type="number"
          min={1}
          value={item.precioUnitario} 
          onChange={(e) =>
            onChangeItem({ ...item, precioUnitario: Number(e.target.value) }) 
          }
        />
      </td>

      <td>{subtotal || 0}</td>

      <td>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
        >
          Quitar
        </button>
      </td>
    </tr>
  );
};

export default ItemVenta;

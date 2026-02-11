import { useEffect, useState } from "react";
import { API_URL } from "./../config";
import ItemVenta from "../components/ItemVenta";

export default function NuevaVenta() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([{ id: crypto.randomUUID() }]); //Inicializa con un item 
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    const obtenerProductos = async () => {
      const respuesta = await fetch(`${API_URL}/products`);
      const datos = await respuesta.json();
      setProductos(datos);
    };

    obtenerProductos();
  }, []);

  const agregarItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID() }]);
  };

  const quitarItem = (id: string) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== id) : prev,
    );
  };



  return (
    <div>
      <button onClick={agregarItem}>Añadir Item</button>

      <input
        type="text"
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        placeholder="Ej. Efectivo, Tarjeta..."
      />

      <input
        type="text"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Ej. Venta en mostrador"
      />

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {items.map((it) => (
            <ItemVenta
              key={it.id}
              id={it.id}
              productos={productos}
              onRemove={quitarItem}
              canRemove={items.length > 1}
            />
          ))}
        </tbody>
      </table>

      <div>
        <label>
          Total: 
          {}
        </label>

        <label>
          Total de articulos: 
          {items.length}
        </label>
      </div>
    </div>
    
  );
}

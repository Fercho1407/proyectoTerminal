import { useState, useEffect } from "react";
import { API_URL } from "../config";

const ItemVenta = () => {
  const [productos, setProductos] = useState([]);

  // Guarda el producto seleccionado por el usuario
  const [idSeleccionado, setIdSeleccionado] = useState("");

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/products`);
        const datos = await respuesta.json();
        setProductos(datos);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };

    obtenerProductos();
  }, []);

  // 3. Función que se ejecuta cuando el usuario cambia la opción
  

  return (
    <div className="p-4">
      <label htmlFor="select-producto" className="block mb-2 font-bold">
        Selecciona un producto:
      </label>
        
      <select
        id="select-producto"
        value={idSeleccionado}
        onChange={(e) => {
            const id = e.target.value;
            setIdSeleccionado(id);
            console.log("Producto ID seleccionado:", id);
        }}
        className="border p-2 rounded w-full"
      >
        {/* Opción por defecto (placeholder) */}
        <option value="">-- Elige una opción --</option>

        {/* Iteramos sobre los productos para crear las opciones */}
        {productos.map((prod) => (
          <option key={prod.id} value={prod.id}>
            {prod.product_name} - {prod.category_off}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ItemVenta;

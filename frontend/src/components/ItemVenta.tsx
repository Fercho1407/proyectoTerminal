import { useState, useEffect } from "react";
import { API_URL } from "../config";

const ItemVenta = () => {
  const [productos, setProductos] = useState([]);
  const [idSeleccionado, setIdSeleccionado] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("");
  const [unidad, setUnidad] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");

  const subtotal = Number(cantidadProducto) * Number(precioUnitario);

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

  

  return (
    <tr>
        <td>
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

                {/* Iterar sobre los productos para crear las opciones */}
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
                placeholder="Cantidad de producto a vender"
            />   
        </td>

        <td>
            <select
                id="unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
            >
                <option value="">Selecciona una unidad</option>
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
                placeholder="Precio por unidad"
            />   
        </td>

        <td>
            <span>{subtotal || 0}</span>
        </td>

        <td> 
            <button>Quitar</button>
        </td>

      </tr>
  );
};

export default ItemVenta;

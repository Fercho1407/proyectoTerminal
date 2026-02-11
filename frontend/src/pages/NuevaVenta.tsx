import { useEffect, useState } from "react";
import {API_URL} from "../config"
import ItemVenta from "../components/ItemVenta";

export default function NuevaVenta() {
    const [datos, setDatos] = useState([]);
        
    useEffect(() => {
      // 1. Definimos la función asíncrona aquí adentro
      const obtenerDatos = async () => {
        try {
          const respuesta = await fetch(`${API_URL}/products`);
          
          const datos = await respuesta.json();
          
          console.log(datos); 
          setDatos(datos);

        } catch (error) {
          console.error("Error al obtener productos:", error);
        }
      };

  obtenerDatos();

}, []);    


    return (
    <div>
      <ItemVenta></ItemVenta>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Precio unitario</th>
            <th>subtotal</th>
            <th>Accion</th> 
          </tr>
        </thead>

        <tbody>
          {datos.map((producto) => (
            <tr key={producto.id}>
              <td>{producto.product_name}</td>
              <td>{producto.category_off}</td>
              <td>{producto.shelf_life_pantry_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  );
}

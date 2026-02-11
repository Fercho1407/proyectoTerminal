import { useEffect, useState } from "react";
import {API_URL} from "./../config"
import ItemVenta from "./../components/ItemVenta";

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
      <div>
        <button>Aniadir Item</button>
      </div>
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
          <ItemVenta></ItemVenta>
        </tbody>
      </table>
    </div>

  );
}

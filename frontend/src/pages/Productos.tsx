import { useEffect, useState } from "react";
import { Producto } from "../components/Producto";
import {API_URL} from "./../config"

export default function Productos(){
    const [catalogoProductos, setCatalogoProductos] = useState([]) 


    useEffect(() => {
        fetch(`${API_URL}/products`)
            .then(res => res.json())
            .then((data) => setCatalogoProductos(data))
            .catch((e) => {console.error(`Ocurrio un error ${e}`)});
    }, []);

    return(
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoria</th>
                        <th>Perecedero</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {catalogoProductos.map((prod) => (
                        <Producto key={prod.id} product={prod}/>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
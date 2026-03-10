import { useState } from "react";
import {API_URL} from "./../config";
import "./styles/NuevoProducto.css"

export default function NuevoProducto(){
    const [nombreProducto, setNombreProducto] = useState<string>("");
    const [categoria, setCategoria] = useState<string>("")
    const [uitlDespensa, setUtilDespensa] = useState<Number>(0);
    const [utilRefrigerador, setUtilRefrigerador] = useState<Number>(0);
    const [utilCongelador, setUtilCongelador] = useState<Number>(0);

    const limpiarFormulario = () => {
        setNombreProducto("");
        setCategoria("");
        setUtilDespensa(0);
        setUtilRefrigerador(0);
        setUtilCongelador(0);
    }

    const payloadProducto = {
        product_name: nombreProducto,
        category_off: categoria,
        shelf_life_pantry_days: uitlDespensa,
        shelf_life_fridge_days: utilRefrigerador,
        shelf_life_freezer_days: utilCongelador
    }

    const enviarProducto = async () => {
        if (!nombreProducto.trim()) {
            alert("El nombre del producto es obligatorio.");
            return;
        }

        if (!categoria.trim()) {
            alert("La categoría es obligatoria.");
            return;
        }

        if (
            uitlDespensa === 0 &&
            utilRefrigerador === 0 &&
            utilCongelador === 0
        ) {
            alert("Al menos una vida útil debe ser mayor a 0.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payloadProducto),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Error al guardar producto");
            }

            alert("Producto guardado correctamente");
            limpiarFormulario();

        } catch (error) {
            console.error(error);
            alert("No se pudo guardar el producto");
        }
    };

   


    return (
    <div className="product-page">
        <div className="product-header">
        <h2>Nuevo producto</h2>
        </div>

        <div className="product-form">
        <div className="field">
            <label>Nombre del producto</label>
            <input
            type="text"
            value={nombreProducto}
            onChange={(e) => setNombreProducto(e.target.value)}
            placeholder="Ej. pasta espagueti"
            />
        </div>

        <div className="field">
            <label>Categoría</label>
            <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej. pasta"
            />
        </div>

        <div className="field">
            <label>Vida útil despensa (días)</label>
            <input
            type="number"
            min={0}
            step={1}
            value={Number(uitlDespensa)}
            onChange={(e) => setUtilDespensa(Number(e.target.value))}
            />
        </div>

        <div className="field">
            <label>Vida útil refrigerador (días)</label>
            <input
            type="number"
            min={0}
            step={1}
            value={Number(utilRefrigerador)}
            onChange={(e) => setUtilRefrigerador(Number(e.target.value))}
            />
        </div>

        <div className="field">
            <label>Vida útil congelador (días)</label>
            <input
            type="number"
            min={0}
            step={1}
            value={Number(utilCongelador)}
            onChange={(e) => setUtilCongelador(Number(e.target.value))}
            />
        </div>
        </div>

        <div className="product-json">
        <div className="product-jsonHead">
            <h3>JSON hacia el backend</h3>
            <span className="muted">Solo lectura</span>
        </div>

        <textarea value={JSON.stringify(payloadProducto, null, 2)} readOnly rows={15} />

        <div className="product-actions">
            <button className="btn btn-ghost" onClick={limpiarFormulario}>
            Borrar
            </button>
            <button className="btn btn-primary" onClick={enviarProducto}>
            Guardar
            </button>
        </div>
        </div>
    </div>
    );

}
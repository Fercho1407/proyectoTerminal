import { useState } from "react";
import { API_URL } from "./../config";
import { ModalEditar } from "./ModalEditar";

interface Product {
  product_name: string;
  category_off: string;
  shelf_life_pantry_days: number;
  shelf_life_fridge_days: number;
  shelf_life_freezer_days: number;
  id: number;
  perecedero: number;
}

interface ProductProps {
  product: Product;
}

export const Producto = ({ product }: ProductProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const verDatosProducto = () => {
    alert(
      `Detalles del Producto:\n` +
        `------------------------\n` +
        `ID: ${product.id}\n` +
        `Nombre: ${product.product_name}\n` +
        `Categoría: ${product.category_off}\n` +
        `Perecedero: ${product.perecedero === 1 ? "Sí" : "No"}\n` +
        `Días en Despensa: ${product.shelf_life_pantry_days}\n` +
        `Días en Refri: ${product.shelf_life_fridge_days}\n` +
        `Días en Freezer: ${product.shelf_life_freezer_days}`,
    );
  };

  const eliminarProducto = async () => {
    const confirmar = window.confirm(
      `¿Eliminar este producto: ${product.product_name}?`,
    );

    if (!confirmar) return;

    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Error al eliminar");
      }

      alert("Producto eliminado con éxito");
      window.location.reload(); // temporal

    } catch (error) {
      alert("No se pudo eliminar el producto seleccionado");
      console.error("Error al eliminar:", error);
    }
  };

  const guardarCambios = async (updatedProduct: Product) => {
    try {
      const response = await fetch(`${API_URL}/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Error al actualizar");
      }

      alert("Producto actualizado correctamente");
      setIsEditing(false);
      window.location.reload(); // temporal

    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el producto");
    }
  };

  return (
    <>
      <tr className="product-row">
        <td className="product-cell">{product.product_name}</td>
        <td className="product-cell">{product.category_off}</td>
        <td className="product-cell">{product.perecedero === 1 ? "si" : "no"}</td>

        <td className="product-cell product-actionsCell">
          <button className="btn btn-view" onClick={verDatosProducto}>
            Ver
          </button>

          <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
            Editar
          </button>

          <button className="btn btn-danger" onClick={eliminarProducto}>
            Eliminar
          </button>
        </td>
      </tr>

      {isEditing && (
        <ModalEditar
          product={product}
          onClose={() => setIsEditing(false)}
          onSave={guardarCambios}
        />
      )}
    </>
  );
};

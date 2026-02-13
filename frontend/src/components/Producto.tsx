import { API_URL } from "./../config";

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

  const editarProducto = () => {};

  const eliminarProducto = async () => {
    const confirmar = window.confirm(
      `¿Eliminar este producto: ${product.product_name}?`,
    );

    if (confirmar) {
      try {
        const response = await fetch(`${API_URL}/products/${product.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("Producto eliminado con éxito");
          // Aquí deberías refrescar la lista de productos
        }
      } catch (error) {
        alert("No se pudo eliminar el producto seleccionado");
        console.error("Error al eliminar:", error);
      }
    }
  };

  return (
    <tr>
      <td>{product.product_name}</td>
      <td>{product.category_off}</td>
      <td>{product.perecedero === 1 ? "si" : "no"}</td>
      <td>
        <button onClick={verDatosProducto}>Ver</button>
        <button onClick={editarProducto}>Editar</button>
        <button onClick={() => eliminarProducto(product.id)}>Eliminar</button>
      </td>
    </tr>
  );
};

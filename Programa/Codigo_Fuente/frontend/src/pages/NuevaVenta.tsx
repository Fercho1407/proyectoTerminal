import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";
import ItemVenta from "../components/ItemVenta";
import "./styles/NuevaVenta.css"

interface Item {
  id: string;
  productoId: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

export default function NuevaVenta() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState<Item[]>([
    {
      id: generarId(),
      productoId: "",
      cantidad: 0,
      unidad: "",
      precioUnitario: 0,
    },
  ]);
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");

  function generarId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }


  useEffect(() => {
    const obtenerProductos = async () => {
      const respuesta = await fetch(`${API_URL}/products`);
      const datos = await respuesta.json();
      setProductos(datos);
    };

    obtenerProductos();
  }, []);

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generarId(),
        productoId: "",
        cantidad: 0,
        unidad: "",
        precioUnitario: 0,
      },
    ]);
  };

  const quitarItem = (id: string) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== id) : prev,
    );
  };

  const actualizarItem = (itemActualizado: Item) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemActualizado.id ? itemActualizado : it)),
    );
  };

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  }, [items]);

  const payloadVenta = {
    items: items.map((item) => ({
      product_id: Number(item.productoId),
      qty: item.cantidad,
      unit: item.unidad,
      unit_price: item.precioUnitario,
    })),
    notes: notas,
    payment_method: metodoPago,
  };

  const limpiarFormulario = () => {
      setMetodoPago("");
      setNotas("");
      setItems([
        {
          id: generarId(),
          productoId: "",
          cantidad: 0,
          unidad: "",
          precioUnitario: 0,
        },
      ]);
  }

  const enviarVenta = async () => {
    //Validaciones basicas
    const hayInvalido = items.some(
      (it) =>
        !it.productoId ||
        it.cantidad <= 0 ||
        it.precioUnitario <= 0 ||
        !it.unidad,
    );

    if (hayInvalido) {
      alert(
        "Revisa: producto, cantidad, unidad y precio deben estar completos y ser > 0.",
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadVenta),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al guardar venta");
      }

      alert("Venta guardada");

      limpiarFormulario();

    } catch (err) {
      console.error(err);
      alert(`No se pudo guardar la venta ${err}`);
    }
  };

  return (
    <div className="venta-page">
      <div className="venta-header">
        <h2>Nueva venta</h2>
        <button className="btn" onClick={agregarItem}>Añadir item</button>
      </div>

      <div className="venta-form">
        <div className="field">
          <label>Método de pago</label>
          <input
            type="text"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            placeholder="Ej. Efectivo, Tarjeta..."
          />
        </div>

        <div className="field">
          <label>Notas</label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. Venta en mostrador"
          />
        </div>
      </div>

      <div className="venta-tableWrap">
        <table className="venta-table">
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
                item={it}
                productos={productos}
                onRemove={quitarItem}
                canRemove={items.length > 1}
                onChangeItem={actualizarItem}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="venta-summary">
        <div className="summary-card">
          <span className="summary-label">Total</span>
          <span className="summary-value">{`$${total}`}</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Artículos</span>
          <span className="summary-value">{items.length}</span>
        </div>
      </div>

      <div className="venta-json">
        <div className="venta-jsonHead">
          <h3>JSON hacia el backend</h3>
        </div>

        <textarea
          value={JSON.stringify(payloadVenta, null, 2)}
          readOnly
          rows={18}
        />

        <div className="venta-actions">
          <button className="btn btn-ghost" onClick={limpiarFormulario}>Borrar</button>
          <button className="btn btn-primary" onClick={enviarVenta}>Guardar</button>
        </div>
      </div>
    </div>
  );

}

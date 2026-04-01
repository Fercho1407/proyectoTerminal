type ItemInventario = {
  clave: string;
  product_id: number | string;
  nombre_producto: string;
  categoria: string;
  perecedero: boolean;
  unidad: string;
  stock: number;
};

type Props = {
  item: ItemInventario;
  umbralBajo: number;
  umbralCritico: number;
  onAumentar: (item: ItemInventario) => void;
  onDisminuir: (item: ItemInventario) => void;
  onEstablecer: (item: ItemInventario) => void;
  deshabilitado: boolean;
};

function estadoStock(stock: number, bajo: number, critico: number) {
  if (stock <= critico) return { texto: "Crítico", clase: "bad" };
  if (stock <= bajo) return { texto: "Bajo", clase: "warn" };
  return { texto: "OK", clase: "good" };
}

export default function FilaInventario(props: Props) {
  const item = props.item;
  const estado = estadoStock(item.stock, props.umbralBajo, props.umbralCritico);

  return (
    <tr>
      <td>{item.nombre_producto}</td>
      <td>{item.categoria || "—"}</td>
      <td>
        {item.perecedero ? (
          <span className="tag warn">Sí</span>
        ) : (
          <span className="tag">No</span>
        )}
      </td>
      <td>
        <span className="tag">{item.unidad}</span>
      </td>
      <td>
        <strong>{item.stock}</strong>
      </td>
      <td>
        <span className={`tag ${estado.clase}`}>{estado.texto}</span>
      </td>
      <td>
        <div className="qty">
          <button
            className="btn secondary"
            type="button"
            onClick={() => props.onDisminuir(item)}
            disabled={props.deshabilitado}
          >
            -1
          </button>

          <button
            className="btn secondary"
            type="button"
            onClick={() => props.onAumentar(item)}
            disabled={props.deshabilitado}
          >
            +1
          </button>

          <button
            className="btn secondary"
            type="button"
            onClick={() => props.onEstablecer(item)}
            disabled={props.deshabilitado}
          >
            Set
          </button>
        </div>
      </td>
    </tr>
  );
}

import type { Resumen } from "./tipos";

type Props = {
  resumen: Resumen | null;
};

function formatearDinero(numero: number | undefined) {
  if (!numero) return "$0.00";
  return "$" + numero.toFixed(2);
}

export default function Indicadores({ resumen }: Props) {
  return (
    <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
      
      <div style={{ padding: 20, border: "1px solid gray", borderRadius: 8 }}>
        <h4>Ventas (MXN)</h4>
        <strong>{formatearDinero(resumen?.ventas_mxn)}</strong>
      </div>

      <div style={{ padding: 20, border: "1px solid gray", borderRadius: 8 }}>
        <h4>Tickets</h4>
        <strong>{resumen?.tickets ?? 0}</strong>
      </div>

      <div style={{ padding: 20, border: "1px solid gray", borderRadius: 8 }}>
        <h4>Productos vendidos</h4>
        <strong>{resumen?.productos_vendidos ?? 0}</strong>
      </div>

    </div>
  );
}

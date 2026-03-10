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
    <div className="indicadores">
      <div className="indicador">
        <h4 className="indicador__titulo">Ventas (MXN)</h4>
        <div className="indicador__valor">{formatearDinero(resumen?.sales_mxn)}</div>
      </div>

      <div className="indicador">
        <h4 className="indicador__titulo">Tickets</h4>
        <div className="indicador__valor">{resumen?.tickets ?? 0}</div>
      </div>

      <div className="indicador">
        <h4 className="indicador__titulo">Productos vendidos</h4>
        <div className="indicador__valor">{resumen?.items_sold ?? 0}</div>
      </div>
    </div>
  );
}

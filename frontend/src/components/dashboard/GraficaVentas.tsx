import { useEffect, useRef, useState } from "react";
import type { PuntoTendencia } from "./tipos";

type Props = {
  datos: PuntoTendencia[];
};

type TooltipInfo = {
  x: number;
  y: number;
  punto: PuntoTendencia;
} | null;

export default function GraficaVentas({ datos }: Props) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(800);
  const alto = 300;

  const [tooltip, setTooltip] = useState<TooltipInfo>(null);

  useEffect(() => {
    if (contenedorRef.current) {
      setAncho(contenedorRef.current.clientWidth);
    }
  }, [datos]);

  if (!datos.length) {
    return (
      <div className="grafica">
        <h4 className="grafica__titulo">Tendencia de ventas</h4>
        <div className="grafica__vacio">Sin datos</div>
      </div>
    );
  }

  const valores = datos.map((d) => d.value);
  const max = Math.max(...valores);
  const min = Math.min(...valores);

  const espacioX = ancho / (datos.length - 1 || 1);

  function calcularY(value: number) {
    return alto - ((value - min) / (max - min || 1)) * (alto - 30) - 10;
  }

  const dPath = datos
    .map((p, i) => {
      const x = i * espacioX;
      const y = calcularY(p.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const lineasGrid = [0, 1, 2, 3, 4].map((i) => {
    const y = (alto / 4) * i;
    return <line key={i} x1={0} y1={y} x2={ancho} y2={y} className="grafica__grid" />;
  });

  function renderTooltip() {
    if (!tooltip) return null;

    const { x, y, punto } = tooltip;

    const etiqueta = (punto as any).label ?? (punto as any).date ?? "";
    const valor = punto.value;

    // Tamaño del tooltip
    const w = 160;
    const h = etiqueta ? 46 : 30;

    // Posicion un poco arriba a la derecha
    let tx = x + 12;
    let ty = y - h - 12;

    // Evitar que se salga del SVG
    if (tx + w > ancho) tx = x - w - 12;
    if (ty < 0) ty = y + 12;

    return (
      <g>
        <rect x={tx} y={ty} width={w} height={h} rx={10} ry={10} fill="white" stroke="#222" />
        {etiqueta ? (
          <text x={tx + 10} y={ty + 18} className="grafica__etiqueta">
            {etiqueta}
          </text>
        ) : null}
        <text x={tx + 10} y={ty + (etiqueta ? 36 : 20)} className="grafica__etiqueta">
          Vendido: {`$${valor}`}
        </text>
      </g>
    );
  }

  return (
    <div ref={contenedorRef} className="grafica">
      <h4 className="grafica__titulo">Tendencia de ventas</h4>

      <svg
        className="grafica__svg"
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setTooltip(null)}
      >
        {lineasGrid}

        <path d={dPath} className="grafica__linea" />

        {datos.map((punto, index) => {
          const x = index * espacioX;
          const y = calcularY(punto.value);

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={6}
              className="grafica__punto"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setTooltip({ x, y, punto })}
              onMouseMove={() => setTooltip({ x, y, punto })}
            />
          );
        })}

        {renderTooltip()}
      </svg>
    </div>
  );
}

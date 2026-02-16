import { useEffect, useRef, useState } from "react";
import type { PuntoTendencia } from "./tipos";

type Props = {
  datos: PuntoTendencia[];
};

export default function GraficaVentas({ datos }: Props) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(800);
  const alto = 300;

  useEffect(() => {
    if (contenedorRef.current) {
      setAncho(contenedorRef.current.clientWidth);
    }
  }, [datos]);

  if (!datos.length) {
    return (
      <div
        style={{
          height: alto,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
          border: "1px solid gray",
        }}
      >
        Sin datos
      </div>
    );
  }

  const valores = datos.map(d => d.value);
  const max = Math.max(...valores);
  const min = Math.min(...valores);

  const espacioX = ancho / (datos.length - 1 || 1);

  return (
    <div ref={contenedorRef} style={{ marginTop: 20 }}>
      <svg width="100%" height={alto}>
        {datos.map((punto, index) => {
          const x = index * espacioX;

          const y =
            alto -
            ((punto.value - min) / (max - min || 1)) * alto;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={5}
              fill="white"
            />
          );
        })}
      </svg>
    </div>
  );
}

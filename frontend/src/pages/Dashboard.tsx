import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Indicadores from "./../components/dashboard/Indicadores";
import GraficaVentas from "./../components/dashboard/GraficaVentas";
import type { Resumen, PuntoTendencia } from "./../components/dashboard/tipos";
import {API_URL} from "./../config";

export default function Dashboard() {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [tendencia, setTendencia] = useState<PuntoTendencia[]>([]);
  const [dias, setDias] = useState(7);
  const [mensaje, setMensaje] = useState("Listo");

  async function cargarDatos() {
    setMensaje("Cargando...");

    try {
      const respuestaResumen = await fetch(`${API_URL}/dashboard/summary`);
      const datosResumen = await respuestaResumen.json();

      const respuestaTendencia = await fetch(
        `${API_URL}/dashboard/trend?days=${dias}`,
      );
      const datosTendencia = await respuestaTendencia.json();

      setResumen(datosResumen);
      setTendencia(datosTendencia);
      setMensaje("Datos cargados correctamente");
    } catch (error) {
      console.error(error);
      setMensaje("Error al cargar datos");
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [dias]);

  return (
    <section style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <p>{mensaje}</p>

      <div style={{ marginBottom: 20 }}>
        <button onClick={cargarDatos}>Actualizar</button>

        <button
          onClick={() => navigate("/ventas-nueva")}
          style={{ marginLeft: 10 }}
        >
          Nueva venta
        </button>
      </div>

      <div>
        <label>Días: </label>
        <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
          <option value={7}>7</option>
          <option value={14}>14</option>
          <option value={30}>30</option>
        </select>
      </div>

      <Indicadores resumen={resumen} />

      <GraficaVentas datos={tendencia} />
    </section>
  );
}

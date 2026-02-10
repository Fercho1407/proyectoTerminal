import { useEffect, useState } from "react";
import { API_URL } from "../config";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Form
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState("pieza");
  const [perecedero, setPerecedero] = useState(true);

  function cargarProductos() {
    setCargando(true);
    setError("");

    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProductos(data);
        setCargando(false);
      })
      .catch(() => {
        setError("No se pudieron cargar los productos");
        setCargando(false);
      });
  }

  useEffect(() => {
    cargarProductos();
  }, []);

  function crearProducto() {
    setError("");

    const payload = { nombre, categoria, unidad, perecedero };

    fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || "Error al crear producto");
        }
        return res.json().catch(() => null);
      })
      .then(() => {
        setNombre("");
        setCategoria("");
        setUnidad("pieza");
        setPerecedero(true);
        cargarProductos();
      })
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Productos</h2>

      <div className="card">
        <h3>Nuevo producto</h3>

        <label className="label">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <label className="label">Categoría</label>
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />

        <label className="label">Unidad</label>
        <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
          <option value="pieza">pieza</option>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="lt">lt</option>
          <option value="paq">paq</option>
        </select>

        <label className="label">¿Perecedero?</label>
        <select value={perecedero ? "si" : "no"} onChange={(e) => setPerecedero(e.target.value === "si")}>
          <option value="si">sí</option>
          <option value="no">no</option>
        </select>

        <button onClick={crearProducto} disabled={!nombre.trim()}>
          Guardar
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h3>Listado</h3>

        {cargando && <p>Cargando...</p>}
        {!cargando && (
          <ul>
            {productos.map((p) => (
              <li key={p.id}>
                <b>{p.nombre}</b> — {p.categoria || "sin categoría"} — {p.unidad || "u"} —{" "}
                {p.perecedero ? "perecedero" : "no perecedero"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

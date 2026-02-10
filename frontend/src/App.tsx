import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Inventario from "./pages/Inventario";
import Predicciones from "pages/Predicciones";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <h1>Inventario IA</h1>
        </header>

        <nav className="menu">
          <Link to="/">Dashboard</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/ventas">Ventas</Link>
          <Link to="/inventario">Inventario</Link>
          <Link to="/predicciones">Predicciones</Link>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/predicciones" element={<Predicciones />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

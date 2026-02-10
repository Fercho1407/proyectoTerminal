// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { appRoutes } from "./routes";
import "./styles.css"; // Asegúrate de importar tu CSS

export default function App() {
  return (
    <BrowserRouter>
      {/* 1. Agregamos este div contenedor con clase 'app-container' */}
      <div className="app-container">
        
        <Sidebar />

        <main className="main-content">
          <Routes>
            {appRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
        
      </div>
    </BrowserRouter>
  );
}
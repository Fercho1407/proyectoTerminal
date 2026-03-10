import { NavLink } from "react-router-dom";
import { appRoutes } from "../routes";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Inventario IA</h2>

      <nav className="sidebar-nav">
        {appRoutes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

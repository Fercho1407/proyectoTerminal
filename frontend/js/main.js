import { ROUTES } from "./config.js";
import { Router } from "./router.js";
import { Sidebar } from "./components/Sidebar.js";
import { Topbar } from "./components/Topbar.js";
import { VIEWS } from "./views/index.js";

const root = document.getElementById("root");

const app = document.createElement("div");
app.className = "app";

const main = document.createElement("main");
const topbarMount = document.createElement("div");
const viewMount = document.createElement("div");
viewMount.id = "app";

main.appendChild(topbarMount);
main.appendChild(viewMount);

app.appendChild(document.createElement("div"));
app.appendChild(main);
root.appendChild(app);

let sidebarEl = null;
let topbarEl = null;

const router = new Router({
  onRouteChange: (route) => {
    // Sidebar
    const newSidebar = Sidebar({
      routes: ROUTES,
      activeId: route.id,
      onNavigate: (id) => router.go(id),
    });

    if (sidebarEl) app.replaceChild(newSidebar, sidebarEl);
    else app.replaceChild(newSidebar, app.firstChild);
    sidebarEl = newSidebar;

    // Topbar
    const newTopbar = Topbar({
      title: route.title,
      subtitle: route.subtitle,
      onSync: () => alert("Sync (placeholder)."),
    });

    if (topbarEl) topbarMount.replaceChild(newTopbar, topbarEl);
    else topbarMount.appendChild(newTopbar);
    topbarEl = newTopbar;

    // View
    viewMount.innerHTML = "";
    const factory = VIEWS[route.id];
    viewMount.appendChild(factory ? factory() : document.createTextNode("Vista no encontrada"));
  }
});

router.init();

import { ROUTES } from "./config.js";

export class Router {
  constructor({ onRouteChange }) {
    this.onRouteChange = onRouteChange;
    this.routeMap = new Map(ROUTES.map(r => [r.id, r]));
    this.current = "dashboard";
  }

  init() {
    window.addEventListener("hashchange", () => this.handleHash());
    this.handleHash();
  }

  handleHash() {
    const id = (location.hash || "#/dashboard").replace("#/", "");
    this.go(this.routeMap.has(id) ? id : "dashboard", { push: false });
  }

  go(id, { push = true } = {}) {
    this.current = id;
    if (push) location.hash = `#/${id}`;
    this.onRouteChange?.(this.routeMap.get(id));
  }
}

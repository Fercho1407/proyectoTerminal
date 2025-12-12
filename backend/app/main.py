from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import debug, products, sales, forecast

app = FastAPI(
    title="Inventario & Forecast API",
    version="0.1.0",
)

# CORS: para que tu frontend HTML/JS pueda consumir la API con fetch()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción: ["http://tu-dominio.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(debug.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(forecast.router)
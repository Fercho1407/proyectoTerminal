from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import products, inventory, stats, sales, sales_history, ml, dashboard

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(stats.router)
app.include_router(sales.router)
app.include_router(sales_history.router)
app.include_router(ml.router)
app.include_router(dashboard.router)
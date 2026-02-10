from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import products, inventory, stats, sales, sales_history, ml, dashboard

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    
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
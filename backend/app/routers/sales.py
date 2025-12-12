from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import pandas as pd

from app.services.data_loader import get_ventas

router = APIRouter()

@router.get("/sales")
def get_sales(
    product_name: str = Query(..., description="Nombre exacto del producto"),
    start: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="YYYY-MM-DD"),
):
    df = get_ventas()

    if "fecha" not in df.columns:
        raise HTTPException(status_code=500, detail="Columna 'fecha' no encontrada")

    # Filtrar producto
    sub = df[df["product_name"] == product_name]

    if sub.empty:
        raise HTTPException(status_code=404, detail="Producto sin ventas")

    # Filtro fechas
    if start:
        start_dt = pd.to_datetime(start)
        sub = sub[sub["fecha"] >= start_dt]

    if end:
        end_dt = pd.to_datetime(end)
        sub = sub[sub["fecha"] <= end_dt]

    # Agregar por día (muy importante)
    daily = (
        sub.groupby("fecha", as_index=False)["ventas"]
           .sum()
           .sort_values("fecha")
    )

    return {
        "product_name": product_name,
        "count": int(daily.shape[0]),
        "series": [
            {
                "date": row["fecha"].date().isoformat(),
                "ventas": int(row["ventas"])
            }
            for _, row in daily.iterrows()
        ]
    }

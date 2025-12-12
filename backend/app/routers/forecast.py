from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import pandas as pd

from app.services.data_loader import get_ventas
from app.services.forecast_baseline import forecast_ma7

router = APIRouter()

@router.get("/forecast")
def forecast(
    product_name: str = Query(..., description="Nombre exacto del producto"),
    days: int = Query(7, ge=1, le=60),
    start: Optional[str] = Query(None, description="YYYY-MM-DD (opcional, para recortar historia)"),
    end: Optional[str] = Query(None, description="YYYY-MM-DD (opcional, para recortar historia)"),
):
    df = get_ventas()

    sub = df[df["product_name"] == product_name]
    if sub.empty:
        raise HTTPException(status_code=404, detail="Producto sin ventas")

    # fechas
    if "fecha" not in sub.columns:
        raise HTTPException(status_code=500, detail="Columna 'fecha' no encontrada")

    if start:
        start_dt = pd.to_datetime(start)
        sub = sub[sub["fecha"] >= start_dt]
    if end:
        end_dt = pd.to_datetime(end)
        sub = sub[sub["fecha"] <= end_dt]

    daily = (
        sub.groupby("fecha", as_index=False)["ventas"]
           .sum()
           .sort_values("fecha")
    )

    preds = forecast_ma7(daily, days=days)

    return {
        "product_name": product_name,
        "model": "baseline_ma7",
        "days": days,
        "last_date": daily["fecha"].iloc[-1].date().isoformat(),
        "predictions": preds
    }

from datetime import date, timedelta
from typing import List, Dict
import pandas as pd
import numpy as np

def forecast_ma7(daily_df: pd.DataFrame, days: int = 7) -> List[Dict]:
    """
    daily_df: DataFrame con columnas ['fecha', 'ventas'] ya agregadas por día y ordenadas.
    Predice usando promedio móvil de los últimos 7 días disponibles.
    """
    if daily_df.empty:
        return []

    last_date = pd.to_datetime(daily_df["fecha"].iloc[-1]).date()
    last_vals = daily_df["ventas"].tail(7).astype(float).to_numpy()
    yhat = float(np.mean(last_vals)) if len(last_vals) > 0 else 0.0

    preds = []
    for i in range(1, days + 1):
        d = last_date + timedelta(days=i)
        preds.append({"date": d.isoformat(), "yhat": round(yhat, 2)})
    return preds

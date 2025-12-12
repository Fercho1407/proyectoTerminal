import pandas as pd
from app.core.config import VENTAS_CSV, EVENTOS_CSV

_df_ventas = None
_df_eventos = None

def get_ventas() -> pd.DataFrame:
    global _df_ventas
    if _df_ventas is None:
        if not VENTAS_CSV.exists():
            raise FileNotFoundError(f"No se encontró: {VENTAS_CSV}")
        _df_ventas = pd.read_csv(VENTAS_CSV)
        # Normaliza fecha si existe
        if "fecha" in _df_ventas.columns:
            _df_ventas["fecha"] = pd.to_datetime(_df_ventas["fecha"], errors="coerce")
    return _df_ventas

def get_eventos() -> pd.DataFrame:
    global _df_eventos
    if _df_eventos is None:
        if not EVENTOS_CSV.exists():
            raise FileNotFoundError(f"No se encontró: {EVENTOS_CSV}")
        _df_eventos = pd.read_csv(EVENTOS_CSV)
        if "date" in _df_eventos.columns:
            _df_eventos["date"] = pd.to_datetime(_df_eventos["date"], errors="coerce")
    return _df_eventos

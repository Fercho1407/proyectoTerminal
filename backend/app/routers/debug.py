from fastapi import APIRouter
from app.services.data_loader import get_ventas, get_eventos
from app.core.config import VENTAS_CSV, EVENTOS_CSV

router = APIRouter()

@router.get("/debug/data")
def debug_data():
    dfv = get_ventas()
    dfe = get_eventos()
    return {
        "ventas_csv": str(VENTAS_CSV),
        "eventos_csv": str(EVENTOS_CSV),
        "ventas_shape": [int(dfv.shape[0]), int(dfv.shape[1])],
        "eventos_shape": [int(dfe.shape[0]), int(dfe.shape[1])],
        "ventas_cols": list(dfv.columns),
        "eventos_cols": list(dfe.columns),
    }

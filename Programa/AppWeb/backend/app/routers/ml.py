from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.ml import PredictRequest, PredictResponse
from app.services.ml_service import predict_sales

router = APIRouter(prefix="/ml", tags=["ml"])

@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest, db: Session = Depends(get_db)) -> PredictResponse:
    try:
        return predict_sales(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")

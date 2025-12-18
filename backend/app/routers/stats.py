from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.stats import ProductStatsOut
from app.services.stats_service import get_product_stats

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/product", response_model=ProductStatsOut)
def stats_product(
    product_id: int | None = None,
    product_name: str | None = None,
    unit: str = "piece",
    range: str = "30d",
    metric: str = "sales",
    db: Session = Depends(get_db),
):
    try:
        return get_product_stats(db, product_id, product_name, unit, range, metric)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

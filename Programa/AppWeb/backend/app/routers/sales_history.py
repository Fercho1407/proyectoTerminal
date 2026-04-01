from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.sales_history import SaleHistoryRow
from app.services.sales_history_service import get_sales_history

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("/history", response_model=list[SaleHistoryRow])
def sales_history(
    db: Session = Depends(get_db),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    q: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=2000),
    offset: int = Query(default=0, ge=0),
):
    return get_sales_history(
        db=db,
        from_date=from_date,
        to_date=to_date,
        q=q,
        limit=limit,
        offset=offset,
    )

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_dashboard_trend,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return get_dashboard_summary(db)


@router.get("/trend")
def dashboard_trend(
    days: int = Query(7, ge=1, le=60),
    db: Session = Depends(get_db),
):
    return get_dashboard_trend(db, days)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.sale import SaleCreate, SaleOut
from app.services.sales_service import create_sale

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("", response_model=SaleOut)
def post_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    return create_sale(db, payload.model_dump())

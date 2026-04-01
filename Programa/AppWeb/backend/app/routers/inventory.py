from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.inventory import InventoryMovementCreate, InventoryMovementOut, StockRowOut
from app.services.inventory_service import crear_movimiento, obtener_stock

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.post("/movements", response_model=InventoryMovementOut)
def post_movement(payload: InventoryMovementCreate, db: Session = Depends(get_db)):
    return crear_movimiento(db, payload.model_dump())

@router.get("/stock", response_model=list[StockRowOut])
def get_stock(db: Session = Depends(get_db)):
    return obtener_stock(db)

from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

MovementType = Literal["IN", "OUT", "ADJUST"]
UnitType = Literal["kg", "g", "piece", "pack", "box", "lt", "ml"]

class InventoryMovementCreate(BaseModel):
    product_id: int
    type: MovementType
    qty: float = Field(gt=0)
    unit: UnitType = "piece"
    unit_cost: Optional[float] = None
    reason: Optional[str] = None

class InventoryMovementOut(BaseModel):
    id: int
    product_id: int
    type: MovementType
    qty: float
    unit: UnitType
    unit_cost: Optional[float] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockRowOut(BaseModel):
    product_id: int
    product_name: str
    category_off: Optional[str] = None
    perecedero: int
    unit: UnitType
    stock_actual: float

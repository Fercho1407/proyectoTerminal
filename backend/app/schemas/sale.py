from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    qty: float = Field(gt=0)
    unit: str = "piece"   # debe coincidir con tu ENUM
    unit_price: float = Field(ge=0)

class SaleCreate(BaseModel):
    sold_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    items: List[SaleItemCreate] = Field(min_length=1)


class SaleItemOut(BaseModel):
    id: int
    product_id: int
    qty: float
    unit: str
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class SaleOut(BaseModel):
    id: int
    sold_at: datetime
    total: float
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    items: List[SaleItemOut]

    class Config:
        from_attributes = True

from datetime import datetime
from pydantic import BaseModel


class SaleHistoryRow(BaseModel):
    sale_id: int
    item_id: int

    sold_at: datetime
    product_id: int
    product_name: str

    qty: float
    unit: str
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

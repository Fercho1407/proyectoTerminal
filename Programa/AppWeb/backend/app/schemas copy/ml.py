from pydantic import BaseModel, Field
from typing import List, Optional

class PredictRequest(BaseModel):
    product_id: int = Field(..., ge=1)
    unit: str = Field("piece")         # piece|kg|g|pack|box|lt|ml
    days: int = Field(7, ge=1, le=60)  # para no exagerar
    price: Optional[float] = Field(None, ge=0)  # opcional: sobreescribe precio

class PredPoint(BaseModel):
    date: str
    y_pred: float

class PredictResponse(BaseModel):
    product_id: int
    product_name: str
    unit: str
    days: int
    used_price: float
    points: List[PredPoint]

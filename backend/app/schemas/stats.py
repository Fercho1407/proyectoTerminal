from pydantic import BaseModel

class StatPoint(BaseModel):
    date: str
    value: float

class ProductStatsOut(BaseModel):
    product_id: int
    product_name: str
    unit: str
    range: str
    metric: str

    total: float
    avg_per_day: float
    volatility: float

    series: list[StatPoint]

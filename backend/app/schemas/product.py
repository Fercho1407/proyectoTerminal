from pydantic import BaseModel

class ProductCreate(BaseModel):
    product_name: str
    category_off: str
    shelf_life_pantry_days: int = 0
    shelf_life_fridge_days: int = 0
    shelf_life_freezer_days: int = 0

class ProductOut(ProductCreate):
    id: int
    perecedero: int  

    class Config:
        from_attributes = True  

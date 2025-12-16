from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.product import ProductCreate, ProductOut
from app.services.products_service import crear_producto, listar_productos

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductOut)
def post_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return crear_producto(db, payload.model_dump())


@router.get("", response_model=list[ProductOut])
def get_products(db: Session = Depends(get_db)):
    return listar_productos(db)
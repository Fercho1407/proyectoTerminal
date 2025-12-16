from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.products_service import crear_producto, listar_productos, actualizar_producto

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductOut)
def post_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return crear_producto(db, payload.model_dump())


@router.get("", response_model=list[ProductOut])
def get_products(db: Session = Depends(get_db)):
    return listar_productos(db)


@router.put("/{product_id}", response_model=ProductOut)
def put_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    return actualizar_producto(db, product_id, payload.model_dump())